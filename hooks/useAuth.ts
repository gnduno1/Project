"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { getDatabase, ref, set, get, update, onValue, off } from "firebase/database"

interface UserData {
  uid: string
  email: string
  username: string
  balance: number
  total_invested: number
  total_earned: number
  withdrawable_profit: number
  referral_code: string
  referred_by?: string
  created_at: number
  last_login: number
  is_admin?: boolean
  phone?: string
  full_name?: string
  profile_image?: string
  status: "active" | "suspended" | "pending"
  email_verified: boolean
}

interface AuthContextType {
  user: UserData | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, username: string, referralCode?: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateUserProfile: (data: Partial<UserData>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUserData(firebaseUser.uid)
        setupRealTimeUserData(firebaseUser.uid)
      } else {
        setUser(null)
        cleanupListeners()
      }
      setLoading(false)
    })

    return () => {
      unsubscribe()
      cleanupListeners()
    }
  }, [])

  const setupRealTimeUserData = (uid: string) => {
    const database = getDatabase()
    const userRef = ref(database, `users/${uid}`)

    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val()
        setUser({
          uid,
          ...userData,
        })
      }
    })
  }

  const cleanupListeners = () => {
    if (user?.uid) {
      const database = getDatabase()
      off(ref(database, `users/${user.uid}`))
    }
  }

  const loadUserData = async (uid: string) => {
    try {
      const database = getDatabase()
      const userRef = ref(database, `users/${uid}`)
      const snapshot = await get(userRef)

      if (snapshot.exists()) {
        const userData = snapshot.val()
        setUser({
          uid,
          ...userData,
        })

        // Update last login
        await update(userRef, {
          last_login: Date.now(),
        })
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  const generateReferralCode = (username: string): string => {
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")
    return `${username.toUpperCase().slice(0, 4)}${randomNum}`
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      const result = await signInWithEmailAndPassword(auth, email, password)
      await loadUserData(result.user.uid)
    } catch (error: any) {
      throw new Error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string, username: string, referralCode?: string) => {
    try {
      setLoading(true)

      // Check if username already exists
      const database = getDatabase()
      const usernameRef = ref(database, `usernames/${username.toLowerCase()}`)
      const usernameSnapshot = await get(usernameRef)

      if (usernameSnapshot.exists()) {
        throw new Error("Username already taken")
      }

      // Validate referral code if provided
      let referredBy = undefined
      if (referralCode) {
        const referralSnapshot = await get(ref(database, "users"))
        if (referralSnapshot.exists()) {
          const users = referralSnapshot.val()
          const referrer = Object.values(users).find((u: any) => u.referral_code === referralCode.toUpperCase())
          if (referrer) {
            referredBy = (referrer as any).uid
          } else {
            throw new Error("Invalid referral code")
          }
        }
      }

      const result = await createUserWithEmailAndPassword(auth, email, password)

      // Update Firebase Auth profile
      await updateProfile(result.user, {
        displayName: username,
      })

      const userData: UserData = {
        uid: result.user.uid,
        email: email,
        username: username,
        balance: 0,
        total_invested: 0,
        total_earned: 0,
        withdrawable_profit: 0,
        referral_code: generateReferralCode(username),
        referred_by: referredBy,
        created_at: Date.now(),
        last_login: Date.now(),
        is_admin: false,
        status: "active",
        email_verified: result.user.emailVerified,
      }

      // Save user data to database
      await set(ref(database, `users/${result.user.uid}`), userData)

      // Reserve username
      await set(usernameRef, result.user.uid)

      // Add referral bonus if referred
      if (referredBy) {
        const referrerRef = ref(database, `users/${referredBy}`)
        const referrerSnapshot = await get(referrerRef)
        if (referrerSnapshot.exists()) {
          const referrerData = referrerSnapshot.val()
          await update(referrerRef, {
            balance: (referrerData.balance || 0) + 50, // 50 PKR referral bonus
            total_earned: (referrerData.total_earned || 0) + 50,
          })
        }
      }

      setUser(userData)
    } catch (error: any) {
      throw new Error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      cleanupListeners()
      await signOut(auth)
      setUser(null)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const refreshUser = async () => {
    if (user?.uid) {
      await loadUserData(user.uid)
    }
  }

  const updateUserProfile = async (data: Partial<UserData>) => {
    if (!user?.uid) return

    try {
      const database = getDatabase()
      const userRef = ref(database, `users/${user.uid}`)
      await update(userRef, data)
      await refreshUser()
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    updateUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
