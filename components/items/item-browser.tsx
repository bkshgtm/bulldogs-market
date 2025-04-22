"use client"

import { useEffect, useState } from "react"
import { type Item, getItems } from "@/lib/firebase/firestore-utils"
import { ItemCard } from "./item-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/hooks/use-cart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Loader2, Filter } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const CATEGORIES = [
  { value: "all", label: "All Items" },
  { value: "food", label: "Food" },
  { value: "clothing", label: "Clothing" },
  { value: "hygiene", label: "Hygiene" },
  { value: "school", label: "School Supplies" },
  { value: "other", label: "Other" },
]

export function ItemBrowser() {
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const { addToCart, isInCart } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true)
        const fetchedItems = await getItems()
        setItems(fetchedItems)
        setFilteredItems(fetchedItems)
      } catch (error) {
        console.error("Error fetching items:", error)
        toast({
          title: "Error Loading Items",
          description: "There was a problem loading the inventory. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [toast])

  useEffect(() => {
    // Filter items based on search query and category
    let filtered = items

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) => item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query),
      )
    }

    setFilteredItems(filtered)
  }, [items, searchQuery, selectedCategory])

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search items..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="w-full md:w-auto overflow-auto">
          <Tabs defaultValue="all" value={selectedCategory} onValueChange={handleCategoryChange}>
            <TabsList className="inline-flex w-auto md:w-full md:grid md:grid-cols-6">
              {CATEGORIES.map((category) => (
                <TabsTrigger key={category.value} value={category.value} className="whitespace-nowrap">
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex h-60 flex-col items-center justify-center gap-4 rounded-lg border p-8 text-center">
          <Filter className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No items found</p>
          <p className="text-sm text-muted-foreground max-w-md">
            Try adjusting your search or filter to find what you're looking for.
          </p>
          {searchQuery || selectedCategory !== "all" ? (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("all")
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} onAddToCart={() => addToCart(item)} isInCart={isInCart(item.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
