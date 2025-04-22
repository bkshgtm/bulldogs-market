"use client"

import { useEffect, useState } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import {
  type Notification,
  getAdminNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/firebase/firestore-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Bell, Package, ShoppingBag, Users, Loader2, CheckCircle } from "lucide-react"

export function NotificationsPage() {
  const { user } = useFirebase()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "order" | "inventory" | "token" | "system">("all")
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const router = useRouter()

  useEffect(() => {
    // Redirect if not admin
    if (user && user.role !== "admin") {
      router.push("/browse")
    }
  }, [user, router])

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true)
        const allNotifications = await getAdminNotifications()
        setNotifications(allNotifications)
        setFilteredNotifications(allNotifications)
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()

    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Filter notifications based on active tab
    if (activeTab === "all") {
      setFilteredNotifications(notifications)
    } else {
      setFilteredNotifications(notifications.filter((notification) => notification.type === activeTab))
    }
  }, [notifications, activeTab])

  const handleMarkAllAsRead = async () => {
    if (!user) return

    try {
      await markAllNotificationsAsRead(user.uid)
      // Update local state
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification,
        ),
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case "order":
        return <Package className="h-5 w-5 text-blue-500" />
      case "inventory":
        return <ShoppingBag className="h-5 w-5 text-green-500" />
      case "token":
        return <Users className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return ""
    try {
      return formatDistanceToNow(timestamp.toDate(), { addSuffix: true })
    } catch (error) {
      return ""
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notifications</h1>

        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Center</CardTitle>
          <CardDescription>Stay updated with important events in the Bulldogs Market</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">
                All
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="order">Orders</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="token">Tokens</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {loading ? (
                <div className="flex h-60 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex h-60 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">No notifications</p>
                  <p className="text-sm text-muted-foreground">
                    You're all caught up! No new notifications in this category.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors",
                        notification.read ? "bg-background" : "bg-muted/30",
                      )}
                      onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                    >
                      <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1">
                        <p className={cn("text-sm", !notification.read && "font-medium")}>{notification.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{getTimeAgo(notification.createdAt)}</p>
                      </div>
                      {!notification.read && (
                        <Badge variant="secondary" className="ml-2">
                          New
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
