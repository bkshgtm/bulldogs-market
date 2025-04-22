"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { type Item, getItems, addItem, updateItem, deleteItem } from "@/lib/firebase/firestore-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Search, Loader2, AlertTriangle } from "lucide-react"

const CATEGORIES = [
  { value: "food", label: "Food" },
  { value: "clothing", label: "Clothing" },
  { value: "hygiene", label: "Hygiene" },
  { value: "school", label: "School Supplies" },
  { value: "other", label: "Other" },
]

type ItemFormData = {
  name: string
  description: string
  category: string
  imageUrl: string
  quantity: number
}

const defaultItemForm: ItemFormData = {
  name: "",
  description: "",
  category: "food",
  imageUrl: "",
  quantity: 1,
}

export function InventoryManager() {
  const { user } = useFirebase()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState<ItemFormData>(defaultItemForm)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Redirect if not admin
    if (user && user.role !== "admin") {
      router.push("/browse")
    }
  }, [user, router])

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
          title: "Error",
          description: "Failed to load inventory items. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [toast])

  useEffect(() => {
    // Filter items based on search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const filtered = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query),
      )
      setFilteredItems(filtered)
    } else {
      setFilteredItems(items)
    }
  }, [items, searchQuery])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number.parseInt(value) || 0 : value,
    }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
    }))
  }

  const handleAddItem = async () => {
    try {
      setIsSubmitting(true)

      // Validate form
      if (!formData.name.trim()) {
        toast({
          title: "Name Required",
          description: "Please enter a name for the item.",
          variant: "destructive",
        })
        return
      }

      if (!formData.category) {
        toast({
          title: "Category Required",
          description: "Please select a category for the item.",
          variant: "destructive",
        })
        return
      }

      if (formData.quantity < 0) {
        toast({
          title: "Invalid Quantity",
          description: "Quantity cannot be negative.",
          variant: "destructive",
        })
        return
      }

      // Add item to database
      const itemId = await addItem({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        imageUrl: formData.imageUrl,
        quantity: formData.quantity,
      })

      // Update local state
      const newItem: Item = {
        id: itemId,
        ...formData,
        createdAt: { toDate: () => new Date() } as any,
      }

      setItems((prev) => [...prev, newItem])

      // Reset form and close dialog
      setFormData(defaultItemForm)
      setIsAddDialogOpen(false)

      toast({
        title: "Item Added",
        description: `${formData.name} has been added to inventory.`,
      })
    } catch (error) {
      console.error("Error adding item:", error)
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditItem = async () => {
    if (!selectedItem) return

    try {
      setIsSubmitting(true)

      // Validate form
      if (!formData.name || !formData.category || formData.quantity < 0) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields correctly.",
          variant: "destructive",
        })
        return
      }

      // Update item in database
      await updateItem(selectedItem.id, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        imageUrl: formData.imageUrl,
        quantity: formData.quantity,
      })

      // Update local state
      setItems((prev) => prev.map((item) => (item.id === selectedItem.id ? { ...item, ...formData } : item)))

      // Reset form and close dialog
      setFormData(defaultItemForm)
      setSelectedItem(null)
      setIsEditDialogOpen(false)

      toast({
        title: "Item Updated",
        description: `${formData.name} has been updated.`,
      })
    } catch (error) {
      console.error("Error updating item:", error)
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!selectedItem) return

    try {
      setIsSubmitting(true)

      // Delete item from database
      await deleteItem(selectedItem.id)

      // Update local state
      setItems((prev) => prev.filter((item) => item.id !== selectedItem.id))

      // Reset and close dialog
      setSelectedItem(null)
      setIsDeleteDialogOpen(false)

      toast({
        title: "Item Deleted",
        description: `${selectedItem.name} has been removed from inventory.`,
      })
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (item: Item) => {
    setSelectedItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (item: Item) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Inventory Management</h1>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>Add a new item to the Bulldogs Market inventory.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={handleSelectChange}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={0}
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddItem} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Item"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search inventory..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex h-60 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No items found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "Try adjusting your search query." : "Start by adding items to your inventory."}
          </p>
          {searchQuery && (
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="capitalize">{item.category}</TableCell>
                  <TableCell className="hidden max-w-xs truncate md:table-cell">{item.description}</TableCell>
                  <TableCell className={item.quantity <= 5 ? "text-destructive" : ""}>{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(item)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Make changes to the selected inventory item.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Item Name</Label>
              <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={formData.category} onValueChange={handleSelectChange}>
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-imageUrl">Image URL</Label>
              <Input
                id="edit-imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                name="quantity"
                type="number"
                min={0}
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleEditItem} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="py-4">
              <p className="font-medium">{selectedItem.name}</p>
              <p className="text-sm text-muted-foreground">Category: {selectedItem.category}</p>
              <p className="text-sm text-muted-foreground">Quantity: {selectedItem.quantity}</p>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteItem} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
