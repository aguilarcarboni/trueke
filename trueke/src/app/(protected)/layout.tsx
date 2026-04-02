'use client'
import "../globals.css";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { useEffect } from "react";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const { data: session, status} = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const isAdmin = Boolean(session?.user?.is_admin)
  
  useEffect(() => {
    if (status === "loading") return

    if (!session?.user) {
      router.replace("/login")
      return
    }

    if (pathname === "/") {
      router.replace("/dashboard")
    }
  }, [status, session, pathname, router])

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      {session?.user &&
        <SidebarProvider>
          <div className="flex h-screen w-full">
            <AppSidebar isAdmin={isAdmin} />
            <SidebarInset className="overflow-y-auto">
              <div className="flex min-h-full flex-1 flex-col p-5">
                {children}
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      }
    </div>
  );
}
