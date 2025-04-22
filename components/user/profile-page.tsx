"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload } from "lucide-react"
import { uploadProfileImage, updateUserProfile } from "@/lib/firebase/firestore-utils"

export function ProfilePage() {
  const { user, refreshUserProfile } = useFirebase()
  const [firstName, setFirstName] = useState(user?.profile?.firstName || "")
  const [lastName, setLastName] = useState(user?.profile?.lastName || "")
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    try {
      setIsSaving(true)

      await updateUserProfile(user.uid, {
        firstName,
        lastName,
      })

      await refreshUserProfile()

      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)

      toast({
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      setIsUploading(true)

      await uploadProfileImage(user.uid, file)
      await refreshUserProfile()

      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully.",
      })
    } catch (error) {
      console.error("Error uploading profile image:", error)

      toast({
        title: "Upload Failed",
        description: "Failed to upload your profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  if (!user) return null

  const userInitials =
    user.profile?.firstName && user.profile?.lastName
      ? `${user.profile.firstName[0]}${user.profile.lastName[0]}`
      : user.email
        ? user.email.substring(0, 2).toUpperCase()
        : "U"

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-3xl font-bold">My Account</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="profile-form" onSubmit={handleProfileUpdate}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user.email || ""} disabled />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={user.role === "admin" ? "Staff" : "Student"} disabled />
                </div>

                {user.role === "student" && (
                  <div className="grid gap-2">
                    <Label htmlFor="tokens">Token Balance</Label>
                    <Input id="tokens" value={user.profile?.tokenBalance || 0} disabled />
                  </div>
                )}
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button type="submit" form="profile-form" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Upload or update your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Avatar className="h-32 w-32 mb-6">
              <AvatarImage src={user.profile?.photoURL || ""} />
              <AvatarFallback className="text-2xl bg-[hsl(var(--market-gold))] text-black">
                {userInitials}
              </AvatarFallback>
            </Avatar>

            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

            <Button onClick={triggerFileInput} variant="outline" className="w-full" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New Picture
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
