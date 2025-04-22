import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { FirebaseProvider } from "@/lib/firebase/firebase-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Bulldogs Market",
  description: "Browse and request free items from AAMU's donation-based market",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <FirebaseProvider>
          <div className="flex min-h-screen flex-col">
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
              {children}
            </main>
            <footer className="border-t text-sm text-muted-foreground py-4 text-center">
              © {new Date().getFullYear()} Bulldogs Market · Alabama A&M University
            </footer>
          </div>
          <Toaster />
        </FirebaseProvider>
      </body>
    </html>
  )
}
