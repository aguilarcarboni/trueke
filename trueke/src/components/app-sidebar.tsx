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
import {
  Gavel,
  Heart,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquare,
  Package,
  Repeat,
  Shield,
  Store,
  User,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { signOut, useSession } from 'next-auth/react'
import { getProfileAction } from '@/app/actions/profile'
import type { UserProfile } from '@/lib/entities/profile'
import { useEffect, useState } from 'react'

interface AppSidebarProps {
  isAdmin?: boolean
}

const AppSidebar = ({ isAdmin = false }: AppSidebarProps) => {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    async function fetchUserProfile() {
      if (!session?.user?.id) {
        setProfile(null)
        return
      }
      const profile = await getProfileAction(session.user.id)
      setProfile(profile)
    }
    fetchUserProfile()
  }, [session?.user?.id])

  const userRoutes = [
    { name: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, scopeId: 'dashboard' },
    { name: 'Marketplace', url: '/marketplace', icon: Store, scopeId: 'marketplace' },
    { name: 'Exchanges', url: '/exchanges', icon: Repeat, scopeId: 'exchanges' },
    { name: 'Auctions', url: '/auctions', icon: Gavel, scopeId: 'auctions' },
    { name: 'Messages', url: '/messages', icon: MessageSquare, scopeId: 'messages' },
    { name: 'Favorites', url: '/favorites', icon: Heart, scopeId: 'favorites' },
    { name: 'Profile', url: '/profile', icon: User, scopeId: 'profile' },
    { name: 'My Items', url: '/items', icon: Package, scopeId: 'my-items' }
  ]
  const adminRoutes = [
    { name: 'Admin Dashboard', url: '/dashboard', icon: Shield, scopeId: 'admin-dashboard' },
    { name: 'Admin Profile', url: '/profile', icon: User, scopeId: 'admin-profile' },
  ]
  const routes = isAdmin ? adminRoutes : userRoutes

  const displayName =
    `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim() ||
    profile?.username ||
    session?.user?.name ||
    'User'

  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  const locationSummary = [
    profile?.address?.muniDistrict,
    profile?.address?.city,
    profile?.address?.province,
    profile?.address?.countryCode,
  ]
    .filter(Boolean)
    .join(', ')

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut({ callbackUrl: '/' })
    setIsLoggingOut(false)
  }

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
        <div className="w-full group-data-[state=collapsed]/sidebar:flex group-data-[state=collapsed]/sidebar:flex-col group-data-[state=collapsed]/sidebar:items-center">
          <button
            className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted dark:hover:bg-sidebar-accent group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-0"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={profile?.profile_picture_url || undefined} alt={displayName} />
              <AvatarFallback className="text-xs text-muted-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left group-data-[state=collapsed]/sidebar:hidden">
              <p className="text-sm font-medium leading-none truncate">{displayName || profile?.username}</p>
              <p className="text-xs mt-0.5 truncate">{profile?.email || session?.user?.email}</p>
              {locationSummary && (
                <p className="text-xs mt-0.5 truncate">{locationSummary}</p>
              )}
            </div>
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-muted dark:hover:bg-sidebar-accent disabled:opacity-50 group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-0"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 shrink-0" />
            )}
            <span className="group-data-[state=collapsed]/sidebar:hidden">{isLoggingOut ? "Signing out..." : "Log out"}</span>
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </SidebarRoot>
  )
}

export default AppSidebar
