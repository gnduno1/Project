"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { AuthForm } from "@/components/auth/auth-form"
import { MainApp } from "@/components/main-app"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return <main className="min-h-screen">{user ? <MainApp /> : <AuthForm />}</main>
}
