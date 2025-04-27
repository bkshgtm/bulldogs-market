"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { MainNav } from "./main-nav"
import { UserNav } from "./user-nav"
import { NotificationsPopover } from "../notifications/notifications-popover"
import { Loader2 } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

export function MainLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useFirebase()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // If user is loaded and not loading
    if (!loading) {
      // If no user, redirect to login
      if (!user) {
        router.push("/")
        return
      }

      // If user is student trying to access admin pages
      if (user.role === "student" && pathname.startsWith("/admin")) {
        router.push("/browse")
        return
      }

      // If user is admin trying to access student pages (except root)
      if (user.role === "admin" && !pathname.startsWith("/admin") && pathname !== "/") {
        router.push("/admin/dashboard")
        return
      }
    }
  }, [user, loading, pathname, router])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="p-6 rounded-md flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-base">Loading Bulldogs Market...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="p-6 rounded-md border">
          <p className="text-base">Please log in to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <MainNav />
            <div className="flex items-center gap-4">
              <NotificationsPopover />
              <UserNav />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      <footer className="bg-card border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Campus Marketplace. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
