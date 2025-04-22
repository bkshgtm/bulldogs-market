import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { TokenRequestsPage } from "@/components/admin/token-requests-page"

export default function TokenRequests() {
  return (
    <AdminSidebar>
      <TokenRequestsPage />
    </AdminSidebar>
  )
}
