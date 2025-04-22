import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { RegisteredStudents } from "@/components/admin/registered-students"

export default function StudentsPage() {
  return (
    <AdminSidebar>
      <RegisteredStudents />
    </AdminSidebar>
  )
}
