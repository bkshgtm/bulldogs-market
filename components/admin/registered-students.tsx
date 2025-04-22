"use client"

import { useEffect, useState } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { getAllStudents } from "@/lib/firebase/firestore-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { Search, Loader2, Users } from "lucide-react"
import type { UserProfile } from "@/lib/firebase/firebase-provider"

export function RegisteredStudents() {
  const { user } = useFirebase()
  const [students, setStudents] = useState<(UserProfile & { id?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredStudents, setFilteredStudents] = useState<(UserProfile & { id?: string })[]>([])
  const router = useRouter()

  useEffect(() => {
    // Redirect if not admin
    if (user && user.role !== "admin") {
      router.push("/browse")
    }
  }, [user, router])

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true)
        const allStudents = await getAllStudents()
        setStudents(allStudents)
        setFilteredStudents(allStudents)
      } catch (error) {
        console.error("Error fetching students:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const filtered = students.filter(
        (student) =>
          student.firstName.toLowerCase().includes(query) ||
          student.lastName.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query),
      )
      setFilteredStudents(filtered)
    } else {
      setFilteredStudents(students)
    }
  }, [students, searchQuery])

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-3xl font-bold">Registered Students</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>View all registered students in the Bulldogs Market system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search students..."
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
          ) : filteredStudents.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No students found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try adjusting your search query." : "No students have registered yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Token Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id || student.email}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.photoURL || ""} />
                            <AvatarFallback className="bg-[hsl(var(--market-gold))] text-black">
                              {student.firstName?.[0]}
                              {student.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {student.firstName} {student.lastName}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{student.tokenBalance || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
