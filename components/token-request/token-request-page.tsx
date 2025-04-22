"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import {
  type TokenRequest,
  createTokenRequest,
  getUserTokenBalance,
  getUserTokenRequests,
} from "@/lib/firebase/firestore-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Loader2, Coins } from "lucide-react"
import { format } from "date-fns"

export function TokenRequestPage() {
  const { user } = useFirebase()
  const [tokenBalance, setTokenBalance] = useState<number | null>(null)
  const [tokensRequested, setTokensRequested] = useState(1)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<TokenRequest[]>([])
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        setLoading(true)
        const [balance, userRequests] = await Promise.all([
          getUserTokenBalance(user.uid),
          getUserTokenRequests(user.uid),
        ])

        setTokenBalance(balance)
        setRequests(userRequests)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to request tokens.",
        variant: "destructive",
      })
      return
    }

    // Validate input
    if (tokensRequested <= 0 || tokensRequested > 5) {
      toast({
        title: "Invalid Request",
        description: "You can request between 1 and 5 tokens.",
        variant: "destructive",
      })
      return
    }

    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for your token request.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      await createTokenRequest(user.uid, user.email || "", reason, tokensRequested)

      // Reset form
      setTokensRequested(1)
      setReason("")

      // Refresh requests
      const userRequests = await getUserTokenRequests(user.uid)
      setRequests(userRequests)

      toast({
        title: "Request Submitted",
        description: "Your token request has been submitted and is pending approval.",
      })
    } catch (error: any) {
      console.error("Error submitting token request:", error)
      let errorMessage = "Failed to submit your token request. Please try again."
      
      if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to request tokens."
      } else if (error.code === "unavailable") {
        errorMessage = "Service unavailable. Please check your connection."
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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

  const hasPendingRequest = requests.some((request) => request.status === "pending")

  return (
    <div className="container py-6">
      <h1 className="mb-6 text-3xl font-bold">Request Additional Tokens</h1>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Request Emergency Tokens</CardTitle>
                <CardDescription>
                  If you need additional items beyond your weekly limit, you can request emergency tokens.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form id="token-request-form" onSubmit={handleSubmit}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="current-balance">Current Token Balance</Label>
                      <Input
                        id="current-balance"
                        value={tokenBalance !== null ? tokenBalance : "Loading..."}
                        disabled
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="tokens-requested">Tokens Requested</Label>
                      <Input
                        id="tokens-requested"
                        type="number"
                        min={1}
                        max={5}
                        value={tokensRequested}
                        onChange={(e) => setTokensRequested(Number.parseInt(e.target.value))}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="reason">Reason for Request</Label>
                      <Textarea
                        id="reason"
                        placeholder="Please explain why you need additional tokens..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                        className="min-h-32"
                      />
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  form="token-request-form"
                  className="w-full"
                  disabled={isSubmitting || hasPendingRequest}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : hasPendingRequest ? (
                    "You have a pending request"
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Request History</CardTitle>
                <CardDescription>Your previous token requests and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Coins className="mb-2 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">You haven't made any token requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div key={request.id} className="rounded-lg border p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="font-medium">
                            {request.tokensRequested} Token{request.tokensRequested > 1 ? "s" : ""}
                          </div>
                          <Badge variant={getStatusBadgeVariant(request.status)} className="capitalize">
                            {request.status}
                          </Badge>
                        </div>
                        <p className="mb-2 text-sm">{request.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          Requested on {request.createdAt ? format(request.createdAt.toDate(), "PPP") : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
