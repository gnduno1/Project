"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { initializeApp } from "firebase/app"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth"
import { getDatabase, ref, set, get, update } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyD8pGyZYRALQwRB47weu4WrpB2deMPzOcg",
  authDomain: "al-arab-car.firebaseapp.com",
  projectId: "al-arab-car",
  storageBucket: "al-arab-car.firebasestorage.app",
  messagingSenderId: "505774197327",
  appId: "1:505774197327:web:1e82e7946aaa161845383a",
  measurementId: "G-LYJ49FM60P",
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const database = getDatabase(app)

interface UserData {
  uid: string
  email: string
  username: string
  balance: number
  is_admin: boolean
  total_deposited: number
  total_withdrawn: number
  total_invested: number
  total_earned: number
  withdrawable_profit: number // New field for profit tracking
  phone?: string
  address?: string
  date_of_birth?: string
  nationality?: string
  status: string
  created_at: number
  last_login: number
  refer_code: string
  referred_by?: string
  referral_earnings: number
  referral_count: number
}

interface AuthContextType {
  user: UserData | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string, referCode?: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateProfile: (data: Partial<UserData>) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Generate unique refer code
function generateReferCode(username: string): string {
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `${username.substring(0, 3).toUpperCase()}${randomNum}`
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    if (auth.currentUser) {
      const userRef = ref(database, `users/${auth.currentUser.uid}`)
      const snapshot = await get(userRef)
      if (snapshot.exists()) {
        setUser(snapshot.val())
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const userRef = ref(database, `users/${userCredential.user.uid}`)
    await update(userRef, { last_login: Date.now() })
  }

  const signUp = async (email: string, password: string, username: string, referCode?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    let welcomeBonus = 20 // Base welcome bonus
    let referredBy = null

    // Check if refer code is valid
    if (referCode && referCode.trim()) {
      const usersRef = ref(database, "users")
      const usersSnapshot = await get(usersRef)

      if (usersSnapshot.exists()) {
        const users = usersSnapshot.val()
        const referrer = Object.values(users).find((u: any) => u.refer_code === referCode)

        if (referrer) {
          referredBy = (referrer as any).uid
          welcomeBonus = 50 // Higher bonus for referred users

          // Update referrer's referral count (but no commission yet)
          const referrerRef = ref(database, `users/${(referrer as any).uid}`)
          await update(referrerRef, {
            referral_count: ((referrer as any).referral_count || 0) + 1,
          })
        }
      }
    }

    const userData: UserData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email!,
      username,
      balance: welcomeBonus,
      withdrawable_profit: 0, // New field for tracking withdrawable profits
      is_admin: email === "horyaqurehi6@gmail.com",
      total_deposited: 0,
      total_withdrawn: 0,
      total_invested: 0,
      total_earned: 0,
      status: "active",
      created_at: Date.now(),
      last_login: Date.now(),
      refer_code: generateReferCode(username),
      referral_earnings: 0,
      referral_count: 0,
    }

    // Only add referred_by if it's not null
    if (referredBy) {
      userData.referred_by = referredBy
    }

    const userRef = ref(database, `users/${userCredential.user.uid}`)
    await set(userRef, userData)
  }

  const updateProfile = async (data: Partial<UserData>) => {
    if (!auth.currentUser) throw new Error("No user logged in")

    const userRef = ref(database, `users/${auth.currentUser.uid}`)
    await update(userRef, {
      ...data,
      updated_at: Date.now(),
    })

    await refreshUser()
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error("No user logged in")
    }

    // Re-authenticate user with current password
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
    await reauthenticateWithCredential(auth.currentUser, credential)

    // Update password
    await updatePassword(auth.currentUser, newPassword)
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = ref(database, `users/${firebaseUser.uid}`)
        const snapshot = await get(userRef)
        if (snapshot.exists()) {
          setUser(snapshot.val())
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout, refreshUser, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export default AuthProvider
