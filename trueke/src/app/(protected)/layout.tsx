'use client'
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import "../globals.css";
import LoadingComponent from "@/components/misc/LoadingComponent";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { useEffect, useState } from "react";
import { Admin } from "@/components/sections/admin/admin";
import { AdminProfile } from "@/components/sections/admin/admin-profile";
import { getProfileAction } from "@/app/actions/profile-actions";
import type { UserProfile } from "@/utils/supabase/tables/profile";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const { data: session, status} = useSession()
  const router = useRouter()
  const isAdmin = Boolean(session?.user?.is_admin)
  
  useEffect(() => {
    if (status === "loading") return

    if (!session?.user) {
      router.push("/login")
      return
    } else {
      router.push("/dashboard")
    }
  }, [session])

  return (
    <div className="flex flex-col scrollbar-hide h-full w-full scroll-smooth">
      {session?.user &&
        <SidebarProvider>
          <div className="flex h-full w-full scroll-smooth">
            <AppSidebar isAdmin={isAdmin} />
            <SidebarInset>
              <div className="flex-1 p-5">
                {children}
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      }
    </div>
  );
}
