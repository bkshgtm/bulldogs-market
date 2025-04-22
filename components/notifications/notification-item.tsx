"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { type Notification, markNotificationAsRead } from "@/lib/firebase/firestore-utils"
import { cn } from "@/lib/utils"
import { Bell, Package, ShoppingBag, Users } from "lucide-react"

interface NotificationItemProps {
  notification: Notification
  onUpdate: (notification: Notification) => void
}

export function NotificationItem({ notification, onUpdate }: NotificationItemProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (notification.read) return

    try {
      setIsLoading(true)
      await markNotificationAsRead(notification.id)
      onUpdate({ ...notification, read: true })
    } catch (error) {
      console.error("Error marking notification as read:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const timeAgo = notification.createdAt
    ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })
    : ""

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "order":
        return <Package className="h-5 w-5 text-primary" />
      case "inventory":
        return <ShoppingBag className="h-5 w-5 text-primary" />
      case "token":
        return <Users className="h-5 w-5 text-primary" />
      default:
        return <Bell className="h-5 w-5 text-primary" />
    }
  }

  return (
    <div
      className={cn(
        "flex cursor-pointer items-start gap-3 border-b p-4 transition-colors hover:bg-secondary/50",
        notification.read ? "opacity-70" : "bg-primary/5",
        isLoading && "pointer-events-none",
      )}
      onClick={handleClick}
    >
      <div className="mt-1">{getNotificationIcon()}</div>
      <div className="flex-1">
        <p className={cn("text-sm", !notification.read && "font-medium")}>{notification.message}</p>
        <p className="mt-1 text-xs text-muted-foreground">{timeAgo}</p>
      </div>
      {!notification.read && <div className="h-2 w-2 rounded-full bg-primary" />}
    </div>
  )
}
