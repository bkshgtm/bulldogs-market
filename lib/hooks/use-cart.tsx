"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Item } from "@/lib/firebase/firestore-utils"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { useToast } from "@/components/ui/use-toast"

type CartItem = {
  id: string
  name: string
  imageUrl: string
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  addToCart: (item: Item) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  itemCount: number
  isInCart: (itemId: string) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const { user } = useFirebase()
  const { toast } = useToast()

  // Load cart from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedCart = localStorage.getItem(`cart-${user.uid}`)
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart))
        } catch (e) {
          console.error("Error parsing cart from localStorage:", e)
        }
      }
    }
  }, [user])

  // Save cart to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`cart-${user.uid}`, JSON.stringify(items))
    }
  }, [items, user])

  const addToCart = (item: Item) => {
    // Check if user has enough tokens (max 2 items)
    if (items.length >= 2) {
      toast({
        title: "Item limit reached",
        description: "You can only select up to 2 items.",
        variant: "destructive",
      })
      return
    }

    // Check if item is already in cart
    if (items.some((cartItem) => cartItem.id === item.id)) {
      toast({
        title: "Item already in cart",
        description: "This item is already in your cart.",
      })
      return
    }

    setItems((prev) => [
      ...prev,
      {
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        quantity: 1,
      },
    ])

    toast({
      title: "Item added to cart",
      description: `${item.name} has been added to your cart.`,
    })
  }

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return

    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setItems([])
  }

  const itemCount = items.length

  const isInCart = (itemId: string) => {
    return items.some((item) => item.id === itemId)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
