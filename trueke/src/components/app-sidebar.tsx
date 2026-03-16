'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import Account from './auth/Account'
import {
  Gavel,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Package,
  Repeat,
  Shield,
  Store,
  User,
} from 'lucide-react'

interface AppSidebarProps {
  isAdmin?: boolean
}

const AppSidebar = ({ isAdmin = false }: AppSidebarProps) => {
  
  const pathname = usePathname()

  const userRoutes = [
    { name: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, scopeId: 'dashboard' },
    { name: 'Marketplace', url: '/marketplace', icon: Store, scopeId: 'marketplace' },
    { name: 'Exchanges', url: '/exchanges', icon: Repeat, scopeId: 'exchanges' },
    { name: 'Auctions', url: '/auctions', icon: Gavel, scopeId: 'auctions' },
    { name: 'Messages', url: '/messages', icon: MessageSquare, scopeId: 'messages' },
    { name: 'Favorites', url: '/favorites', icon: Heart, scopeId: 'favorites' },
    { name: 'Profile', url: '/profile', icon: User, scopeId: 'profile' },
    { name: 'My Items', url: '/my-items', icon: Package, scopeId: 'my-items' }
  ]
  const adminRoutes = [
    { name: 'Admin Dashboard', url: '/dashboard', icon: Shield, scopeId: 'admin-dashboard' },
    { name: 'Admin Profile', url: '/profile', icon: User, scopeId: 'admin-profile' },
  ]
  const routes = isAdmin ? adminRoutes : userRoutes

  return (
    <SidebarRoot collapsible="icon" className="bg-background text-foreground">
      <SidebarHeader className="border-b border-muted">
        <div className="flex w-full items-center gap-3">
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {routes.map((item) => (
            <SidebarMenuItem key={item.scopeId}>
              <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
                <Link href={item.url} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span className="truncate group-data-[state=collapsed]/sidebar:hidden">
                    {item.name}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-muted">
        <div className="w-full group-data-[state=collapsed]/sidebar:justify-center">
          <Account />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </SidebarRoot>
  )
}

export default AppSidebar
