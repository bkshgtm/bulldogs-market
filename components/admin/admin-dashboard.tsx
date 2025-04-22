"use client"

import { useEffect, useState } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import {
  getAllOrders,
  getAllTokenRequests,
  getItems,
  resetWeeklyTokens,
  type Order,
  type TokenRequest,
  type Item,
} from "@/lib/firebase/firestore-utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { Package, ShoppingBag, Users, Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function AdminDashboard() {
  const { user } = useFirebase()
  const [orders, setOrders] = useState<Order[]>([])
  const [tokenRequests, setTokenRequests] = useState<TokenRequest[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [isResettingTokens, setIsResettingTokens] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/browse")
    }
  }, [user, router])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [fetchedOrders, fetchedRequests, fetchedItems] = await Promise.all([
          getAllOrders(),
          getAllTokenRequests(),
          getItems(),
        ])
        setOrders(fetchedOrders)
        setTokenRequests(fetchedRequests)
        setItems(fetchedItems)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const pendingOrders = orders.filter((o) => o.status === "pending").length
  const pendingTokenRequests = tokenRequests.filter((r) => r.status === "pending").length
  const lowStockItems = items.filter((i) => i.quantity <= 5).length

  const handleResetWeeklyTokens = async () => {
    try {
      setIsResettingTokens(true)
      await resetWeeklyTokens()
      toast({
        title: "Weekly Tokens Reset",
        description: "All student token balances reset to 3.",
      })
    } catch (error) {
      console.error("Reset failed:", error)
      toast({
        title: "Error",
        description: "Could not reset tokens.",
        variant: "destructive",
      })
    } finally {
      setIsResettingTokens(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <header className="border-b pb-4">
        <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">System Stats</CardTitle>
            <CardDescription>Overview of current state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Pending Orders: <span className="font-bold text-foreground">{pendingOrders}</span></p>
            <p>Token Requests: <span className="font-bold text-foreground">{pendingTokenRequests}</span></p>
            <p>Total Items: <span className="font-bold text-foreground">{items.length}</span></p>
            <p>Low Stock: <span className="font-bold text-destructive">{lowStockItems}</span></p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Button onClick={() => router.push("/admin/orders")} className="w-full">Process Orders</Button>
            <Button onClick={() => router.push("/admin/token-requests")} className="w-full">Review Token Requests</Button>
            <Button onClick={() => router.push("/admin/inventory")} className="w-full">Manage Inventory</Button>
            <Button
              onClick={handleResetWeeklyTokens}
              disabled={isResettingTokens}
              className="w-full"
            >
              {isResettingTokens ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Resetting...</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" /> Reset Weekly Tokens</>
              )}
            </Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <CardDescription>Latest orders and token requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="orders">
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="requests">Requests</TabsTrigger>
              </TabsList>
              <TabsContent value="orders" className="space-y-4">
                {orders.length > 0 ? (
                  orders.slice(0, 5).map((order) => (
                    <RecentItem
                      key={order.id}
                      label={`Order #${order.id.slice(-6)}`}
                      email={order.userEmail}
                      status={order.status}
                      date={order.createdAt?.toDate()}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No recent orders.</p>
                )}
              </TabsContent>
              <TabsContent value="requests" className="space-y-4">
                {tokenRequests.length > 0 ? (
                  tokenRequests.slice(0, 5).map((req) => (
                    <RecentItem
                      key={req.id}
                      label={req.userEmail}
                      email={`Requested ${req.tokensRequested} token(s)`}
                      status={req.status}
                      date={req.createdAt?.toDate()}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No recent token requests.</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function RecentItem({ label, email, status, date }: { label: string; email: string; status: string; date?: Date }) {
  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-500"
      case "ready": return "text-blue-600"
      case "completed": return "text-green-600"
      case "approved": return "text-green-600"
      case "rejected": return "text-red-500"
      default: return "text-muted-foreground"
    }
  }

  return (
    <div className="flex items-center justify-between border-b pb-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{email}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${getStatusClass(status)}`}>{status}</p>
        {date && <p className="text-xs text-muted-foreground">{date.toLocaleDateString()}</p>}
      </div>
    </div>
  )
}