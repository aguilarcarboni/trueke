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
        expect(screen.getByText('List name is required')).toBeInTheDocument()
      })
      expect(mockCreateCustomListAction).not.toHaveBeenCalled()
    })

    it('shows an error and does not call the action when name is only whitespace', async () => {
      setup()
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: '   ' } })
      fireEvent.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => {
        expect(screen.getByText('List name is required')).toBeInTheDocument()
      })
      expect(mockCreateCustomListAction).not.toHaveBeenCalled()
    })

    it('shows an error when name contains disallowed characters', async () => {
      setup()
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My@List' } })
      fireEvent.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => {
        expect(screen.getByText(/letters, numbers, spaces/i)).toBeInTheDocument()
      })
      expect(mockCreateCustomListAction).not.toHaveBeenCalled()
    })

    it('shows an error when description contains disallowed characters', async () => {
      setup()
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My List' } })
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Bad desc @@@' } })
      fireEvent.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => {
        expect(screen.getByText(/basic punctuation/i)).toBeInTheDocument()
      })
      expect(mockCreateCustomListAction).not.toHaveBeenCalled()
    })

    it('applies shake class to the name input on name error', async () => {
      setup()
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Bad@Name' } })
      fireEvent.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toHaveClass('animate-shake')
      })
    })

    it('clears the name error when the user starts typing again', async () => {
      setup()
      fireEvent.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => {
        expect(screen.getByText('List name is required')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'A' } })
      expect(screen.queryByText('List name is required')).not.toBeInTheDocument()
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

  // ── Alphanumeric checks ──────────────────────────────────────────────────────

  it('accepts a name with letters and numbers', () => {
    const result = UserListFormSchema.safeParse({ name: 'Top 10' })
    expect(result.success).toBe(true)
  })

  it('accepts a name with hyphens', () => {
    const result = UserListFormSchema.safeParse({ name: 'Work-Clients' })
    expect(result.success).toBe(true)
  })

  it("accepts a name with apostrophes", () => {
    const result = UserListFormSchema.safeParse({ name: "Daniel's List" })
    expect(result.success).toBe(true)
  })

  it('rejects a name with special characters like @', () => {
    const result = UserListFormSchema.safeParse({ name: 'My@List' })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toMatch(/letters, numbers, spaces/)
  })

  it('rejects a name with exclamation marks', () => {
    const result = UserListFormSchema.safeParse({ name: 'Favorites!' })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toMatch(/letters, numbers, spaces/)
  })

  it('rejects a name with hashtags', () => {
    const result = UserListFormSchema.safeParse({ name: '#VIPs' })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toMatch(/letters, numbers, spaces/)
  })

  it('rejects a name that is only special characters', () => {
    const result = UserListFormSchema.safeParse({ name: '!@#$%' })
    expect(result.success).toBe(false)
  })

  // ── Description regex checks ───────────────────────────────────────────────

  it('accepts a description with letters, numbers, and basic punctuation', () => {
    const result = UserListFormSchema.safeParse({ name: 'My List', description: 'Trusted buyers (top 10), reliable!' })
    expect(result.success).toBe(true)
  })

  it('accepts a description with commas, periods, and question marks', () => {
    const result = UserListFormSchema.safeParse({ name: 'My List', description: 'Who are these? Close friends, mostly.' })
    expect(result.success).toBe(true)
  })

  it('rejects a description with @ symbol', () => {
    const result = UserListFormSchema.safeParse({ name: 'My List', description: 'Contact @user' })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toMatch(/basic punctuation/)
  })

  it('rejects a description with hashtags', () => {
    const result = UserListFormSchema.safeParse({ name: 'My List', description: '#vip users' })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toMatch(/basic punctuation/)
  })

  it('rejects a description with emojis', () => {
    const result = UserListFormSchema.safeParse({ name: 'My List', description: 'Best friends 😊' })
    expect(result.success).toBe(false)
  })
})
