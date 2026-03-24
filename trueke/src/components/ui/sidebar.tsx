'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { PanelLeft, PanelRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type SidebarContextValue = {
  open: boolean
  setOpen: (value: boolean | ((value: boolean) => boolean)) => void
  toggle: () => void
  collapsible: 'icon' | 'none'
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.')
  }
  return context
}

type SidebarProviderProps = {
  children: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  collapsible?: 'icon' | 'none'
}

function SidebarProvider({
  children,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  collapsible = 'icon',
}: SidebarProviderProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolledOpen

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const next = typeof value === 'function' ? value(open) : value
      if (openProp === undefined) {
        setUncontrolledOpen(next)
      }
      onOpenChange?.(next)
    },
    [open, onOpenChange, openProp]
  )

  const toggle = React.useCallback(() => setOpen((prev) => !prev), [setOpen])

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      toggle,
      collapsible,
    }),
    [open, setOpen, toggle, collapsible]
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

type SidebarProps = React.HTMLAttributes<HTMLDivElement> & {
  collapsible?: 'icon' | 'none'
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, collapsible = 'icon', ...props }, ref) => {
    const { open } = useSidebar()

    return (
      <div
        ref={ref}
        data-state={open ? 'expanded' : 'collapsed'}
        data-collapsible={collapsible}
        className={cn(
          'group/sidebar sticky top-0 flex h-screen min-h-screen w-[280px] flex-col border-r border-muted bg-background text-foreground transition-[width] duration-200 ease-in-out',
          collapsible === 'icon' && 'data-[state=collapsed]:w-[72px]',
          className
        )}
        {...props}
      />
    )
  }
)
Sidebar.displayName = 'Sidebar'

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center gap-2 px-3 py-4', className)}
      {...props}
    />
  )
)
SidebarHeader.displayName = 'SidebarHeader'

const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center px-3 py-4', className)}
      {...props}
    />
  )
)
SidebarFooter.displayName = 'SidebarFooter'

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex-1 space-y-6 overflow-y-auto px-3 py-4', className)}
      {...props}
    />
  )
)
SidebarContent.displayName = 'SidebarContent'

const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-2', className)} {...props} />
  )
)
SidebarGroup.displayName = 'SidebarGroup'

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-2 text-xs font-semibold uppercase tracking-wide text-subtitle group-data-[collapsible=icon]/sidebar:hidden',
        className
      )}
      {...props}
    />
  )
)
SidebarGroupLabel.displayName = 'SidebarGroupLabel'

const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-lg border border-transparent', className)} {...props} />
  )
)
SidebarGroupContent.displayName = 'SidebarGroupContent'

const SidebarMenu = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />
  )
)
SidebarMenu.displayName = 'SidebarMenu'

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('list-none', className)} {...props} />
  )
)
SidebarMenuItem.displayName = 'SidebarMenuItem'

type SidebarMenuButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
  isActive?: boolean
}

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, asChild, isActive = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          isActive && 'bg-muted text-foreground',
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
SidebarMenuButton.displayName = 'SidebarMenuButton'

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, ...props }, ref) => {
  const { toggle, open } = useSidebar()
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      aria-label="Toggle sidebar"
      className={cn('h-9 w-9 text-foreground', className)}
      onClick={() => toggle()}
      {...props}
    >
      {open ? <PanelLeft className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
    </Button>
  )
})
SidebarTrigger.displayName = 'SidebarTrigger'

const SidebarRail = React.forwardRef<HTMLButtonElement, React.HTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const { toggle } = useSidebar()
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => toggle()}
        className={cn(
          'absolute inset-y-0 right-0 hidden w-3 cursor-pointer bg-transparent group-data-[state=collapsed]/sidebar:block',
          className
        )}
        {...props}
      />
    )
  }
)
SidebarRail.displayName = 'SidebarRail'

const SidebarInset = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex min-h-screen flex-1 flex-col bg-background text-foreground', className)}
      {...props}
    />
  )
)
SidebarInset.displayName = 'SidebarInset'

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
}
