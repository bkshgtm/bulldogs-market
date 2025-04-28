"use client"

import type { Item } from "@/lib/firebase/firestore-utils"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, AlertCircle, Check } from "lucide-react"

interface ItemCardProps {
  item: Item
  onAddToCart: () => void
  isInCart: boolean
}

export function ItemCard({ item, onAddToCart, isInCart }: ItemCardProps) {
  const isOutOfStock = item.quantity <= 0

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="aspect-square w-full overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl || "/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/20">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>
      <CardHeader className="p-4 flex-grow">
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-1 text-lg">{item.name}</CardTitle>
          <Badge variant="outline" className="capitalize">
            {item.category}
          </Badge>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground mt-2">{item.description}</p>
        <p className="mt-2 text-sm font-medium">
          <span className={isOutOfStock ? "text-destructive" : ""}>
            {isOutOfStock ? "Out of Stock" : `${item.quantity} available`}
          </span>
        </p>
      </CardHeader>
      <CardFooter className="p-4 pt-0">
        {isOutOfStock ? (
          <Button disabled className="w-full" variant="outline">
            <AlertCircle className="mr-2 h-4 w-4" />
            Out of Stock
          </Button>
        ) : isInCart ? (
          <Button disabled className="w-full" variant="secondary">
            <Check className="mr-2 h-4 w-4" />
            Added to Cart
          </Button>
        ) : (
          <Button 
            onClick={() => {
              const cartData = localStorage.getItem('cart') || '[]'
              const currentCartItems = JSON.parse(cartData) as Array<{id: string, quantity: number}>
              const currentItemInCart = currentCartItems.find(i => i.id === item.id)
              const currentQuantity = currentItemInCart?.quantity || 0
              
              if (currentQuantity >= item.quantity) {
                alert(`Only ${item.quantity} available in inventory`)
                return
              }
              onAddToCart()
            }} 
            className="w-full"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
