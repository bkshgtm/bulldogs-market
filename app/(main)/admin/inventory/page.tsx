import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { InventoryManager } from "@/components/admin/inventory-manager"

export default function Inventory() {
  return (
    <AdminSidebar>
      <InventoryManager />
    </AdminSidebar>
  )
}
