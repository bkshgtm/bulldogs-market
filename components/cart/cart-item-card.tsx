"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, Minus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CartItemProps {
  item: {
    id: string
    name: string
    imageUrl: string
    quantity: number
    availableQuantity: number
  }
  onRemove: () => void
  onUpdateQuantity: (quantity: number) => void
}

export function CartItemCard({ item, onRemove, onUpdateQuantity }: CartItemProps) {
  const { toast } = useToast()
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-md">
            {item.imageUrl ? (
              <img src={item.imageUrl || "/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted/20">
                <span className="text-xs text-muted-foreground">No image</span>
              </div>
            )}
          </div>

          <div className="flex-1" data-cart-item>
            <h3 className="font-medium">{item.name}</h3>
            <span className="text-sm text-muted-foreground">
              {item.availableQuantity} available
            </span>
            <div className="mt-2 flex items-center">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdateQuantity(item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="mx-4 w-8 text-center font-bold">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  // Get current cart state
                  const cartData = localStorage.getItem('cart') || '[]'
                  const currentCartItems = JSON.parse(cartData) as Array<{id: string, quantity: number}>
                  
                  // Calculate total items in cart
                  const totalItems = currentCartItems.reduce((sum, i) => sum + i.quantity, 0)

                  // Check inventory limit
                  if (item.quantity + 1 > item.availableQuantity) {
                    toast({
                      title: "Inventory Limit",
                      description: `Only ${item.availableQuantity} available for ${item.name}`,
                      variant: "destructive"
                    })
                    return
                  }

                  // Check 3-item order limit
                  if (totalItems + 1 > 3) {
                    toast({
                      title: "Order Limit",
                      description: "Maximum 3 items total per order",
                      variant: "destructive"
                    })
                    return
                  }

                  onUpdateQuantity(item.quantity + 1)
                }}
                disabled={item.quantity >= item.availableQuantity}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
