"use client"

import { useEffect, useState } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { type Order, getUserOrders, cancelOrder, sendOrderStatusUpdateEmail } from "@/lib/firebase/firestore-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { Package, Loader2, AlertCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function OrdersPage() {
  const { user } = useFirebase()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const { toast } = useToast()

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<{ id: string; tokensToRefund: number } | null>(null)

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return

      try {
        setLoading(true)
        const userOrders = await getUserOrders(user.uid)
        setOrders(userOrders)
      } catch (error) {
        console.error("Error fetching orders:", error)
        toast({
          title: "Error",
          description: "Failed to load your orders. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()

    // Set up polling for order updates
    const interval = setInterval(fetchOrders, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [user, toast])

  const confirmCancelOrder = (orderId: string, tokensToRefund: number) => {
    setOrderToCancel({ id: orderId, tokensToRefund })
    setIsConfirmDialogOpen(true)
  }

  const handleCancelOrder = async () => {
    if (!user || !orderToCancel) return

    try {
      setCancellingOrderId(orderToCancel.id)
      await cancelOrder(orderToCancel.id, user.uid, orderToCancel.tokensToRefund)

      // Send cancellation email
      if (user.email) {
        await sendOrderStatusUpdateEmail(user.email, orderToCancel.id, "cancelled")
      }

      // Update local state
      setOrders((prev) =>
        prev.map((order) => (order.id === orderToCancel.id ? { ...order, status: "cancelled" } : order)),
      )

      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled and your tokens have been refunded.",
      })
    } catch (error) {
      console.error("Error cancelling order:", error)
      toast({
        title: "Error",
        description: "Failed to cancel your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCancellingOrderId(null)
      setOrderToCancel(null)
      setIsConfirmDialogOpen(false)
    }
  }

  const getStatusBadgeVariant = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "outline"
      case "ready":
        return "default"
      case "completed":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatPickupTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return format(date, "EEE, MMM d, h:mm a")
    } catch (error) {
      return isoString
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-3xl font-bold">My Orders</h1>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-center">
          <Package className="mb-4 h-12 w-12 text-muted-foreground" />
          <CardTitle className="mb-2">No orders yet</CardTitle>
          <CardDescription>You haven't placed any orders yet. Browse the market to get started.</CardDescription>
          <Button className="mt-6" onClick={() => (window.location.href = "/browse")}>
            Browse Items
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Order #{order.id.slice(-6)}</CardTitle>
                    <CardDescription>{order.createdAt ? format(order.createdAt.toDate(), "PPP") : ""}</CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 font-medium">Items</h3>
                    <ul className="space-y-1">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between text-sm">
                          <span>{item.name}</span>
                          <span>x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg bg-muted p-3">
                    <h3 className="mb-1 font-medium">Pickup Details</h3>
                    <p className="text-sm">Time: {formatPickupTime(order.pickupTime)}</p>
                    <p className="text-sm">Location: AAMU's Bulldog Market</p>
                    <p className="text-sm">Macleb and Macintosh Building</p>
                    <p className="text-sm">Room 103</p>
                  </div>

                  {order.status === "ready" && (
                    <div className="rounded-lg bg-[hsl(var(--market-gold))/0.1] p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-[hsl(var(--market-gold))]" />
                        <span>Your order is ready for pickup!</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              {order.status === "pending" && (
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => confirmCancelOrder(order.id, order.tokensUsed)}
                    disabled={!!cancellingOrderId}
                  >
                    {cancellingOrderId === order.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      "Cancel Order"
                    )}
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Cancellation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? Your tokens will be refunded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep order</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive text-destructive-foreground">
              Yes, cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
