"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useFirebase } from "@/lib/firebase/firebase-provider"

export function MainNav() {
  const pathname = usePathname()
  const { user } = useFirebase()

  const isAdmin = user?.role === "admin"

  const studentLinks = [
    { href: "/browse", label: "Browse" },
    { href: "/cart", label: "Cart" },
    { href: "/orders", label: "Orders" },
    { href: "/token-request", label: "Tokens" },
  ]

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/inventory", label: "Inventory" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/token-requests", label: "Tokens" },
  ]

  const links = isAdmin ? adminLinks : studentLinks

  return (
    <div className="flex items-center gap-6">
      {/* Logo / Home Link */}
      <div className="flex items-center gap-2">
        <img 
          src="/aamu-logo.png" 
          alt="AAMU Logo"
          className="h-8 w-8 object-contain"
        />
        <Link
          href={isAdmin ? "/admin/dashboard" : "/browse"}
          className="text-xl font-heading tracking-tight text-primary"
        >
          Bulldogs Market
        </Link>
      </div>

      {/* Horizontal Links */}
      <nav className="hidden md:flex items-center gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-sm px-3 py-1.5 rounded-md font-medium transition-colors",
              pathname === link.href
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
