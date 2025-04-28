"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { type Notification, getUserNotifications, markAllNotificationsAsRead } from "@/lib/firebase/firestore-utils"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NotificationItem } from "./notification-item"
import { useToast } from "@/components/ui/use-toast"

export function NotificationsPopover() {
  const { user } = useFirebase()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) return

      try {
        setLoading(true)
        const userNotifications = await getUserNotifications(user.uid)
        setNotifications(userNotifications)
      } catch (error: any) {
        console.error("Error fetching notifications:", error)

        // Check if this is the Firebase index error
        if (error.message && error.message.includes("requires an index")) {
          toast({
            title: "Firebase Index Required",
            description:
              "Please create the required index in your Firebase console using the link in the error message.",
            variant: "destructive",
          })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()

    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [user, toast])

  const handleMarkAllAsRead = async () => {
    if (!user) return

    try {
      await markAllNotificationsAsRead(user.uid)
      // Update local state
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-8 w-8">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {loading ? (
            <div className="flex h-20 items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-20 items-center justify-center">
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onUpdate={(updatedNotification) => {
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n)),
                    )
                  }}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
