import { MainLayout } from "@/components/layout/main-layout"
import { ItemBrowser } from "@/components/items/item-browser"

export default function BrowsePage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="mb-6 text-3xl font-bold">Browse Items</h1>
        <ItemBrowser />
      </div>
    </MainLayout>
  )
}
