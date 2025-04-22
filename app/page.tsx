"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginPage } from "@/components/auth/login-page"
import { useFirebase } from "@/lib/firebase/firebase-provider"

export default function Home() {
  const router = useRouter()
  const { user, loading } = useFirebase()

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/browse")
      }
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  return <LoginPage />
}
