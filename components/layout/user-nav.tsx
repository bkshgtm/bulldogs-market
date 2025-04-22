"use client"

import { useFirebase } from "@/lib/firebase/firebase-provider"
import { getUserTokenBalance } from "@/lib/firebase/firestore-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { Loader2, User, LogOut, Settings, Package, Coins } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function UserNav() {
  const { user, signOut } = useFirebase()
  const [tokenBalance, setTokenBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchTokenBalance() {
      if (user && user.role === "student") {
        try {
          setLoading(true)
          const balance = await getUserTokenBalance(user.uid)
          setTokenBalance(balance)
        } catch (error) {
          console.error("Error fetching token balance:", error)
          toast({
            title: "Error",
            description: "Failed to load token balance. Please refresh the page.",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    fetchTokenBalance()
  }, [user])

  if (!user) return null

  const userInitials = user.email ? user.email.substring(0, 2).toUpperCase() : "U"

  return (
    <div className="flex items-center gap-2">
      {user.role === "student" && (
        <div className="hidden md:block">
          <div className="flex items-center gap-2 rounded-md border px-3 py-1 text-sm">
            <Coins className="h-4 w-4 text-primary" />
            <span>Tokens:</span>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="font-bold">{tokenBalance}</span>}
          </div>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="relative h-8 w-8 rounded-full p-0 overflow-hidden">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.profile?.photoURL || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground">{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.email}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.role === "admin" ? "Staff" : "Student"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <a href="/profile" className="flex items-center cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </a>
            </DropdownMenuItem>

            {user.role === "student" && (
              <>
                <DropdownMenuItem asChild>
                  <a href="/orders" className="flex items-center cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    <span>My Orders</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/token-request" className="flex items-center cursor-pointer">
                    <Coins className="mr-2 h-4 w-4" />
                    <span>Request Tokens</span>
                  </a>
                </DropdownMenuItem>
              </>
            )}
            {user.role === "admin" && (
              <>
                <DropdownMenuItem asChild>
                  <a href="/admin/dashboard" className="flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/admin/inventory" className="flex items-center cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    <span>Manage Inventory</span>
                  </a>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()} className="flex items-center cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
