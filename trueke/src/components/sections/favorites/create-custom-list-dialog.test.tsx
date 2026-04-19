import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateCustomListDialog } from './create-custom-list-dialog'
import { UserListFormSchema } from '@/lib/entities/user-list'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

const mockCreateCustomListAction = vi.fn()
vi.mock('@/app/actions/user-list', () => ({
  createCustomListAction: (...args: unknown[]) => mockCreateCustomListAction(...args),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup(overrides: Partial<React.ComponentProps<typeof CreateCustomListDialog>> = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    onCreated: vi.fn(),
    ...overrides,
  }
  return { ...render(<CreateCustomListDialog {...props} />), props }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CreateCustomListDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the dialog title when open', () => {
      setup()
      expect(screen.getByText('Create Custom List')).toBeInTheDocument()
    })

    it('renders the name input', () => {
      setup()
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    })

    it('renders the description textarea', () => {
      setup()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    })

    it('renders Cancel and Create List buttons', () => {
      setup()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create list/i })).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      setup({ open: false })
      expect(screen.queryByText('Create Custom List')).not.toBeInTheDocument()
    })
  })

  // ── Client-side validation ─────────────────────────────────────────────────

  describe('client-side validation', () => {
    it('shows an error and does not call the action when name is empty', async () => {
      setup()
      fireEvent.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => {
        expect(screen.getByText('List name is required.')).toBeInTheDocument()
      })
      expect(mockCreateCustomListAction).not.toHaveBeenCalled()
    })

    it('shows an error and does not call the action when name is only whitespace', async () => {
      setup()
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: '   ' } })
      fireEvent.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => {
        expect(screen.getByText('List name is required.')).toBeInTheDocument()
      })
      expect(mockCreateCustomListAction).not.toHaveBeenCalled()
    })
  })

  // ── Successful creation ────────────────────────────────────────────────────

  describe('successful creation', () => {
    it('calls createCustomListAction with trimmed name', async () => {
      mockCreateCustomListAction.mockResolvedValue({ success: true, data: { listId: 'list-1' } })
      setup()

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: '  Close Friends  ' } })
      fireEvent.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => expect(mockCreateCustomListAction).toHaveBeenCalled())
      expect(mockCreateCustomListAction).toHaveBeenCalledWith('Close Friends', undefined)
    })

    it('passes description when provided', async () => {
      mockCreateCustomListAction.mockResolvedValue({ success: true, data: { listId: 'list-1' } })
      setup()

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My List' } })
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'A test description' } })
      fireEvent.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => expect(mockCreateCustomListAction).toHaveBeenCalled())
      expect(mockCreateCustomListAction).toHaveBeenCalledWith('My List', 'A test description')
    })

    it('passes undefined for description when left blank', async () => {
      mockCreateCustomListAction.mockResolvedValue({ success: true, data: { listId: 'list-1' } })
      setup()

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My List' } })
      fireEvent.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => expect(mockCreateCustomListAction).toHaveBeenCalled())
      expect(mockCreateCustomListAction).toHaveBeenCalledWith('My List', undefined)
    })

    it('calls onCreated with listId and name on success', async () => {
      mockCreateCustomListAction.mockResolvedValue({ success: true, data: { listId: 'list-42' } })
      const { props } = setup()

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My List' } })
      fireEvent.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => expect(props.onCreated).toHaveBeenCalled())
      expect(props.onCreated).toHaveBeenCalledWith('list-42', 'My List')
    })

    it('shows a success toast after creation', async () => {
      mockCreateCustomListAction.mockResolvedValue({ success: true, data: { listId: 'list-1' } })
      setup()

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My List' } })
      fireEvent.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => expect(mockToast).toHaveBeenCalled())
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'List created' })
      )
    })

    it('calls onOpenChange(false) to close the dialog after success', async () => {
      mockCreateCustomListAction.mockResolvedValue({ success: true, data: { listId: 'list-1' } })
      const { props } = setup()

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My List' } })
      fireEvent.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => expect(props.onOpenChange).toHaveBeenCalledWith(false))
    })
  })

  // ── Server error handling ──────────────────────────────────────────────────

  describe('server error handling', () => {
    it('shows the server error message on failure', async () => {
      mockCreateCustomListAction.mockResolvedValue({
        success: false,
        error: 'List name must be at most 50 characters',
      })
      setup()

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My List' } })
      fireEvent.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => {
        expect(
          screen.getByText('List name must be at most 50 characters')
        ).toBeInTheDocument()
      })
    })

    it('shows fallback error when server returns no message', async () => {
      mockCreateCustomListAction.mockResolvedValue({ success: false })
      setup()

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My List' } })
      fireEvent.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => {
        expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
      })
    })

    it('does not call onCreated on failure', async () => {
      mockCreateCustomListAction.mockResolvedValue({ success: false, error: 'Server error' })
      const { props } = setup()

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My List' } })
      fireEvent.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => expect(screen.getByText('Server error')).toBeInTheDocument())
      expect(props.onCreated).not.toHaveBeenCalled()
    })

    it('does not show a toast on failure', async () => {
      mockCreateCustomListAction.mockResolvedValue({ success: false, error: 'Server error' })
      setup()

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My List' } })
      fireEvent.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => expect(screen.getByText('Server error')).toBeInTheDocument())
      expect(mockToast).not.toHaveBeenCalled()
    })
  })

  // ── Cancel / close ─────────────────────────────────────────────────────────

  describe('cancel and close', () => {
    it('calls onOpenChange(false) when Cancel is clicked', () => {
      const { props } = setup()
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
      expect(props.onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})

// ── UserListFormSchema ─────────────────────────────────────────────────────────

describe('UserListFormSchema', () => {
  it('accepts a valid name', () => {
    const result = UserListFormSchema.safeParse({ name: 'Close Friends' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty name', () => {
    const result = UserListFormSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toBe('List name is required')
  })

  it('rejects a name longer than 50 characters', () => {
    const result = UserListFormSchema.safeParse({ name: 'A'.repeat(51) })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toBe('List name must be at most 50 characters')
  })

  it('accepts a name exactly 50 characters long', () => {
    const result = UserListFormSchema.safeParse({ name: 'A'.repeat(50) })
    expect(result.success).toBe(true)
  })

  it('accepts when description is omitted', () => {
    const result = UserListFormSchema.safeParse({ name: 'My List' })
    expect(result.success).toBe(true)
  })

  it('accepts a valid description', () => {
    const result = UserListFormSchema.safeParse({ name: 'My List', description: 'Some description' })
    expect(result.success).toBe(true)
  })

  it('rejects a description longer than 200 characters', () => {
    const result = UserListFormSchema.safeParse({ name: 'My List', description: 'A'.repeat(201) })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toBe('Description must be at most 200 characters')
  })

  it('accepts a description exactly 200 characters long', () => {
    const result = UserListFormSchema.safeParse({ name: 'My List', description: 'A'.repeat(200) })
    expect(result.success).toBe(true)
  })
})
