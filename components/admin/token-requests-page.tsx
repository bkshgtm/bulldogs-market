"use client"

import { useEffect, useState } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { type TokenRequest, getAllTokenRequests, updateTokenRequest } from "@/lib/firebase/firestore-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Search, Loader2, Coins, CheckCircle, XCircle } from "lucide-react"

export function TokenRequestsPage() {
  const { user } = useFirebase()
  const [requests, setRequests] = useState<TokenRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<TokenRequest["status"] | "all">("all")
  const [filteredRequests, setFilteredRequests] = useState<TokenRequest[]>([])
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Redirect if not admin
    if (user && user.role !== "admin") {
      router.push("/browse")
    }
  }, [user, router])

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true)
        const allRequests = await getAllTokenRequests()
        setRequests(allRequests)
        setFilteredRequests(allRequests)
      } catch (error) {
        console.error("Error fetching token requests:", error)
        toast({
          title: "Error",
          description: "Failed to load token requests. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [toast])

  useEffect(() => {
    // Filter requests based on search query and status filter
    let filtered = requests

    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (request) => request.userEmail.toLowerCase().includes(query) || request.reason.toLowerCase().includes(query),
      )
    }

    setFilteredRequests(filtered)
  }, [requests, searchQuery, statusFilter])

  const handleUpdateRequest = async (requestId: string, status: "approved" | "rejected") => {
    try {
      setProcessingRequestId(requestId)

      // Update request status
      await updateTokenRequest(requestId, status)

      // Update local state
      setRequests((prev) => prev.map((request) => (request.id === requestId ? { ...request, status } : request)))

      toast({
        title: `Request ${status === "approved" ? "Approved" : "Rejected"}`,
        description: `The token request has been ${status}.`,
      })
    } catch (error) {
      console.error("Error updating token request:", error)
      toast({
        title: "Error",
        description: "Failed to update token request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingRequestId(null)
    }
  }

  const getStatusBadgeVariant = (status: TokenRequest["status"]) => {
    switch (status) {
      case "pending":
        return "outline"
      case "approved":
        return "default"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""
    try {
      return format(timestamp.toDate(), "MMM d, yyyy h:mm a")
    } catch (error) {
      return ""
    }
  }

  return (
    <div className="container py-6">
      <h1 className="mb-6 text-3xl font-bold">Token Requests</h1>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by email or reason..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex h-60 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <Coins className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No token requests found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filter."
              : "There are no token requests in the system yet."}
          </p>
          {(searchQuery || statusFilter !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead className="hidden md:table-cell">Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.userEmail}</TableCell>
                  <TableCell>{request.tokensRequested}</TableCell>
                  <TableCell className="hidden max-w-xs truncate md:table-cell">{request.reason}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(request.status)} className="capitalize">
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(request.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {request.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateRequest(request.id, "approved")}
                            disabled={!!processingRequestId}
                          >
                            {processingRequestId === request.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-1 h-3 w-3" />
                            )}
                            Approve
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleUpdateRequest(request.id, "rejected")}
                            disabled={!!processingRequestId}
                          >
                            {processingRequestId === request.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="mr-1 h-3 w-3" />
                            )}
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
