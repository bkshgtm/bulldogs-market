"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { initializeApp, getApps, getApp } from "firebase/app"
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { firebaseConfig } from "./firebase-config"
import { useRouter } from "next/navigation"
import { getUserRole, getUserProfile, createUserProfile } from "@/lib/firebase/firestore-utils"
import { setCookie, deleteCookie } from "cookies-next"

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

export { auth, db, storage }

// Types
export type UserProfile = {
  firstName: string
  lastName: string
  email: string
  role: "student" | "admin"
  photoURL?: string
  tokenBalance?: number
}

export type User = {
  uid: string
  email: string | null
  role: "student" | "admin"
  profile?: UserProfile
  tokenBalance?: number
}

type FirebaseContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string, role: "student" | "admin") => Promise<void>
  signOut: () => Promise<void>
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: "student" | "admin",
  ) => Promise<FirebaseUser | undefined>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>
  auth: typeof auth
  refreshUserProfile: () => Promise<void>
}

// Create context
const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined)

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUserProfile = async () => {
    if (!auth.currentUser || !user) return

    try {
      const userProfile = await getUserProfile(auth.currentUser.uid)
      if (userProfile) {
        setUser({ ...user, profile: userProfile })
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const role = await getUserRole(firebaseUser.uid)
        const userProfile = await getUserProfile(firebaseUser.uid)

        const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: role ?? "student",
        profile: userProfile || undefined,
}

        setUser(userData)
        setCookie("user", JSON.stringify(userData), {
          maxAge: 30 * 24 * 60 * 60,
          path: "/",
        })
      } else {
        setUser(null)
        deleteCookie("user")
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const signIn = async (email: string, password: string, role: "student" | "admin") => {
    try {
      setLoading(true)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const actualRole = await getUserRole(userCredential.user.uid)
      
      if (actualRole !== role) {
        await firebaseSignOut(auth)
        throw new Error(`You must sign in as ${role} using the ${role} form`)
      }

      router.push(role === "admin" ? "/admin/dashboard" : "/browse")
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      deleteCookie("user")
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
      throw error
    }
  }

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: "student" | "admin",
  ) => {
    try {
      setLoading(true)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`,
      })

      // Create user profile and wait for it to complete
      await createUserProfile(userCredential.user.uid, email, role, firstName, lastName)
      
      // Verify role was set correctly before redirecting
      const verifiedRole = await getUserRole(userCredential.user.uid)
      
      if (verifiedRole === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/browse")
      }

      return userCredential.user
    } catch (error) {
      console.error("Sign up error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error("Password reset error:", error)
      throw error
    }
  }

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    if (!auth.currentUser) throw new Error("No user signed in")

    try {
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL: photoURL || auth.currentUser.photoURL,
      })

      await refreshUserProfile()
    } catch (error) {
      console.error("Profile update error:", error)
      throw error
    }
  }

  return (
    <FirebaseContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        signUp,
        resetPassword,
        updateUserProfile,
        auth,
        refreshUserProfile,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  )
}

export function useFirebase() {
  const context = useContext(FirebaseContext)
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider")
  }
  return context
}
