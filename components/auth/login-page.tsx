"use client"

import type React from "react"

import { useState } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { ModeToggle } from "@/components/theme-toggle"
import { Loader2, User, Mail, Lock, KeyRound } from "lucide-react"
import { createUserProfile, sendPasswordResetEmail } from "@/lib/firebase/firestore-utils"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [activeTab, setActiveTab] = useState<"student" | "admin">("student")
  const [isSignUp, setIsSignUp] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const { signIn, signUp, loading, auth, resetPassword } = useFirebase()
  const { toast } = useToast()
  const router = useRouter()

  const validateEmail = (email: string, role: "student" | "admin") => {
    if (role === "student" && !email.endsWith("@aamu.edu")) {
      toast({
        title: "Invalid Email",
        description: "Please use your AAMU email address (@aamu.edu)",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email, activeTab)) return

    try {
      if (isSignUp) {
        // Validate first and last name
        if (!firstName.trim() || !lastName.trim()) {
          toast({
            title: "Missing Information",
            description: "Please enter your first and last name.",
            variant: "destructive",
          })
          return
        }

        // Handle sign up
        const user = await signUp(email, password, firstName, lastName, activeTab)

        if (user) {
          // Create user profile with appropriate role
          await createUserProfile(user.uid, email, activeTab, firstName, lastName)

          toast({
            title: "Account Created",
            description: "Your account has been created successfully.",
          })

          // Redirect based on role
          if (activeTab === "admin") {
            router.push("/admin/dashboard")
          } else {
            router.push("/browse")
          }
        }
      } else {
        // Handle sign in
        await signIn(email, password, activeTab)

        // Redirect based on selected tab (which matches role)
        if (activeTab === "admin") {
          router.push("/admin/dashboard")
        } else {
          router.push("/browse")
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error)

      // Provide more specific error messages
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        toast({
          title: "Invalid Credentials",
          description: "The email or password you entered is incorrect. Please try again.",
          variant: "destructive",
        })
      } else if (error.code === "auth/email-already-in-use") {
        toast({
          title: "Email Already in Use",
          description: "This email is already registered. Please log in instead.",
          variant: "destructive",
        })
      } else if (error.message.includes("You must sign in as")) {
        toast({
          title: "Role Mismatch",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Authentication Error",
          description: error.message || "An error occurred during authentication. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to reset your password.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsResetting(true)
      await resetPassword(resetEmail)
      await sendPasswordResetEmail(resetEmail)

      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for instructions to reset your password.",
      })

      setIsResetDialogOpen(false)
      setResetEmail("")
    } catch (error: any) {
      console.error("Password reset error:", error)

      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to send password reset email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <img src="/aamu-logo.png" alt="AAMU Logo" className="h-12 w-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold">Bulldogs Market</h1>
          <p className="mt-2 text-muted-foreground">Access free essentials for AAMU students</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{isSignUp ? "Create Account" : "Login"}</CardTitle>
            <CardDescription>
              {isSignUp
                ? "Sign up to access the Bulldogs Market"
                : "Sign in to browse available items or manage inventory"}
            </CardDescription>
          </CardHeader>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "student" | "admin")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="admin">Staff</TabsTrigger>
            </TabsList>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  {isSignUp && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="firstName" className="text-sm">
                          First Name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="firstName"
                            className="pl-10"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="lastName" className="text-sm">
                          Last Name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="lastName"
                            className="pl-10"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-sm">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-10"
                        placeholder={activeTab === "student" ? "student@aamu.edu" : "staff@example.com"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    {activeTab === "student" && (
                      <p className="text-xs text-muted-foreground">
                        {isSignUp ? "Must use your AAMU email (@aamu.edu)" : ""}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm">
                        Password
                      </Label>
                      {!isSignUp && (
                        <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="link" className="p-0 h-auto text-xs">
                              Forgot password?
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reset Password</DialogTitle>
                              <DialogDescription>
                                Enter your email address and we'll send you a link to reset your password.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="reset-email">Email</Label>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    id="reset-email"
                                    type="email"
                                    className="pl-10"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                  />
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={handlePasswordReset} disabled={isResetting}>
                                {isResetting ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  "Send Reset Link"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    {isSignUp && (
                      <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isSignUp ? "Creating account..." : "Signing in..."}
                      </>
                    ) : isSignUp ? (
                      <>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Create Account
                      </>
                    ) : (
                      <>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Tabs>

          <CardFooter className="flex flex-col">
            <div className="mt-2 text-center text-sm">
              {isSignUp ? (
                <p>
                  Already have an account?{" "}
                  <Button variant="link" className="p-0 h-auto" onClick={() => setIsSignUp(false)}>
                    Sign in
                  </Button>
                </p>
              ) : (
                <p>
                  Don't have an account?{" "}
                  <Button variant="link" className="p-0 h-auto" onClick={() => setIsSignUp(true)}>
                    Sign up
                  </Button>
                </p>
              )}
            </div>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {activeTab === "student"
                ? "Need help? Contact the Bulldogs Market staff."
                : "Staff login is restricted to authorized personnel only."}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
