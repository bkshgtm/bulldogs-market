"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useFirebase } from "@/lib/firebase/firebase-provider"

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Bell,
  Menu,
  User,
  LogOut,
  ShoppingBasket,
} from "lucide-react"

interface AdminSidebarProps {
  children: React.ReactNode
}

export function AdminSidebar({ children }: AdminSidebarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { signOut } = useFirebase()

  const routes = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/inventory", label: "Inventory", icon: ShoppingBag },
    { href: "/admin/orders", label: "Orders", icon: Package },
    { href: "/admin/token-requests", label: "Tokens", icon: Users },
    { href: "/admin/students", label: "Students", icon: Users },
    { href: "/admin/notifications", label: "Alerts", icon: Bell },
    { href: "/profile", label: "My Account", icon: User },
  ]

  const renderLink = (route: typeof routes[number]) => {
    const isActive = pathname === route.href
    return (
      <Link
        key={route.href}
        href={route.href}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all",
          isActive
            ? "bg-primary text-white"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <route.icon className="h-4 w-4" />
        {route.label}
      </Link>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b bg-background px-4 py-2">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-primary font-bold text-lg">
          <img src="/aamu-logo.png" alt="AAMU Logo" className="h-6 w-6" />
          Bulldogs Market
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <div className="p-4 border-b">
              <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg text-primary">
                <img src="/aamu-logo.png" alt="AAMU Logo" className="h-6 w-6" />
                Bulldogs Market
              </Link>
            </div>
            <ScrollArea className="h-full p-4">
              <nav className="flex flex-col gap-2">
                {routes.map(renderLink)}
                <Button
                  variant="ghost"
                  onClick={signOut}
                  className="justify-start gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </nav>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        <div className="h-14 flex items-center px-6 border-b">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-primary font-bold text-lg">
            <img src="/aamu-logo.png" alt="AAMU Logo" className="h-6 w-6" />
            Bulldogs Market
          </Link>
        </div>
        <ScrollArea className="flex-1 p-4">
          <nav className="flex flex-col gap-2">
            {routes.map(renderLink)}
            <Button
              variant="ghost"
              onClick={signOut}
              className="justify-start gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </nav>
        </ScrollArea>
      </aside>

      {/* Page Content */}
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  )
}
