"use client"

import { useEffect, useState } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import {
  getAllOrders,
  updateOrderStatus,
  addNotification,
  type Order,
} from "@/lib/firebase/firestore-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Loader2, Search, CheckCircle, XCircle } from "lucide-react"
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

export default function AdminOrdersPage() {
  const { user } = useFirebase()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [confirmCancel, setConfirmCancel] = useState<{ id: string; userId: string } | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role !== "admin") router.push("/browse")
  }, [user, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllOrders()
        setOrders(data)
      } catch {
        toast({ title: "Failed to load orders", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [toast])

  const filtered = orders.filter((order) => {
    const matchesFilter = filter === "all" || order.status === filter
    const matchesSearch = order.userEmail.toLowerCase().includes(search.toLowerCase()) || order.id.includes(search)
    return matchesFilter && matchesSearch
  })

  const updateStatus = async (id: string, userId: string, status: Order["status"]) => {
    try {
      await updateOrderStatus(id, status)
      const message =
        status === "ready"
          ? `Your order #${id.slice(-6)} is ready for pickup at AAMU's Bulldog Market (Macleb and Macintosh Building, Room 103).`
          : status === "completed"
          ? `Your order #${id.slice(-6)} has been completed. Thank you for shopping with us!`
          : ""
      if (message) await addNotification(userId, message)
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
      toast({ title: `Order marked ${status}` })
    } catch {
      toast({ title: "Failed to update order", variant: "destructive" })
    }
  }

  const cancelOrder = async () => {
    if (!confirmCancel) return
    try {
      await updateOrderStatus(confirmCancel.id, "cancelled")
      await addNotification(confirmCancel.userId, `Your order #${confirmCancel.id.slice(-6)} was cancelled by staff. Your tokens have been refunded.`)
      setOrders((prev) => prev.map((o) => (o.id === confirmCancel.id ? { ...o, status: "cancelled" } : o)))
      toast({ title: "Order cancelled" })
    } catch {
      toast({ title: "Cancel failed", variant: "destructive" })
    } finally {
      setConfirmCancel(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            {['all', 'pending', 'ready', 'completed', 'cancelled'].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground">No orders found.</p>
      ) : (
        <div className="overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Pickup Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">#{order.id.slice(-6)}</TableCell>
                  <TableCell>{order.userEmail}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {order.items.map((item, index) => (
                        <div key={index} className="text-sm">
                          {item.name} <span className="text-muted-foreground">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.pickupTime ? (
                      <div className="text-sm">
                        {new Date(order.pickupTime).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                        <div className="text-muted-foreground">
                          {new Date(order.pickupTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm">
                      AAMU's Bulldog Market<br/>
                      Macleb and Macintosh Building<br/>
                      Room 103
                    </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className="capitalize" variant={
                      order.status === "cancelled"
                        ? "destructive"
                        : order.status === "completed"
                        ? "secondary"
                        : order.status === "ready"
                        ? "default"
                        : "outline"
                    }>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {order.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, order.userId, "ready")}>Ready</Button>
                    )}
                    {order.status === "ready" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, order.userId, "completed")}>Complete</Button>
                    )}
                    {order.status !== "completed" && order.status !== "cancelled" && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmCancel(order)}>
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!confirmCancel} onOpenChange={() => setConfirmCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>This will permanently cancel the order.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Dismiss</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white" onClick={cancelOrder}>
              Confirm Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
