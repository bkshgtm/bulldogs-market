"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/lib/hooks/use-cart"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import {
  createOrder,
  getUserTokenBalance,
  updateUserTokenBalance,
  sendOrderConfirmationEmail,
} from "@/lib/firebase/firestore-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CartItemCard } from "./cart-item-card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCart, AlertTriangle, Loader2, ArrowLeft, Calendar, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Generate pickup time slots
const generateTimeSlots = () => {
  const slots = []
  const now = new Date()

  // Generate slots for the next 5 weekdays
  for (let day = 0; day < 5; day++) {
    const currentDate = new Date(now)
    currentDate.setDate(now.getDate() + day)

    // Skip weekends
    const dayOfWeek = currentDate.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue
    }

    // Generate slots every 10 minutes from 9 AM to 4 PM
    for (let hour = 9; hour < 16; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const time = new Date(currentDate)
        time.setHours(hour, minute, 0, 0)

        // Skip times in the past
        if (time <= now) continue

        const formattedTime = time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })

        const formattedDate = time.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
        })

        slots.push({
          value: time.toISOString(),
          label: `${formattedDate}, ${formattedTime}`,
        })
      }
    }
  }

  return slots
}

const TIME_SLOTS = generateTimeSlots()

export function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, itemCount } = useCart()
  const { user } = useFirebase()
  const [pickupTime, setPickupTime] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleCheckoutConfirm = async () => {
    if (!user) {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to complete your order.",
        variant: "destructive",
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Please add items before checking out.",
        variant: "destructive",
      })
      return
    }

    if (!pickupTime) {
      toast({
        title: "Please select a pickup time",
        description: "You must select a pickup time to complete your order.",
        variant: "destructive",
      })
      return
    }

    // Open confirmation dialog
    setIsConfirmDialogOpen(true)
  }

  const handleCheckout = async () => {
    // Add these logs at the beginning of handleCheckout
    console.log("User authenticated:", !!user)
    console.log("User ID:", user?.uid)
    console.log("User role:", user?.role)

    try {
      setIsSubmitting(true)

      // Check token balance
      const tokenBalance = await getUserTokenBalance(user!.uid)
      const tokensNeeded = items.length // Each item costs 1 token

      if (tokenBalance < tokensNeeded) {
        toast({
          title: "Not enough tokens",
          description: `You need ${tokensNeeded} tokens but only have ${tokenBalance}. Please request more tokens.`,
          variant: "destructive",
        })
        return
      }

      // Create order
      const orderId = await createOrder(
        user!.uid,
        user!.email || "",
        items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
        })),
        pickupTime,
        tokensNeeded,
        user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : undefined,
      )

      // Deduct tokens
      await updateUserTokenBalance(user!.uid, -tokensNeeded)

      // Send confirmation email
      if (user!.email) {
        await sendOrderConfirmationEmail(
          user!.email,
          orderId,
          items.map((item) => ({ name: item.name, quantity: item.quantity })),
          pickupTime,
        )
      }

      // Clear cart
      clearCart()

      toast({
        title: "Order placed successfully!",
        description: "Your order has been placed. You can view it in your orders page.",
      })

      // Close dialog
      setIsConfirmDialogOpen(false)

      // Redirect to orders page
      router.push("/orders")
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Error placing order",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Your Cart</h1>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground" />
            <CardTitle className="mb-2 text-xl">Your cart is empty</CardTitle>
            <CardDescription className="max-w-md">
              Browse the market to add items to your cart. You can select up to 2 items per order.
            </CardDescription>
            <Button className="mt-6" onClick={() => router.push("/browse")}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Browse Items
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="space-y-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onRemove={() => removeFromCart(item.id)}
                    onUpdateQuantity={(quantity) => updateQuantity(item.id, quantity)}
                  />
                ))}
              </div>

              <Button variant="outline" className="mt-4" onClick={() => router.push("/browse")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Add More Items
              </Button>
            </div>
          </div>

          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>You are using {itemCount} of your tokens.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup-time" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Select Pickup Time
                  </Label>
                  <Select value={pickupTime} onValueChange={setPickupTime}>
                    <SelectTrigger id="pickup-time" className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Select a time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md bg-muted p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Items must be picked up during the selected time slot.</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleCheckoutConfirm}
                  disabled={isSubmitting || items.length === 0 || !pickupTime}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Checkout"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Order</DialogTitle>
            <DialogDescription>Please review your order details before confirming.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <h4 className="mb-2 font-medium">Order Items:</h4>
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span>x{item.quantity}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <p className="text-sm">
                <strong>Pickup Time:</strong> {pickupTime ? new Date(pickupTime).toLocaleString() : "Not selected"}
              </p>
              <p className="text-sm">
                <strong>Tokens Used:</strong> {items.length}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
