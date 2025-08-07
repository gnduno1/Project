"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/providers/auth-provider"
import { getDatabase, ref, get, push, update } from "firebase/database"
import { Wallet, TrendingUp, Target } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const defaultPlans = [
  {
    id: "refinery1",
    name: "Oil Refinery",
    image: "/refinery-image.jpg",
    investment: 5000,
    dailyProfit: 175,
    duration: 90,
    totalReturn: 15750,
    rateOfReturn: 35,
    badge: "Popular",
    badgeColor: "bg-blue-500",
    enabled: true,
  },
  {
    id: "refinery2",
    name: "Gas Refinery",
    image: "/refinery-image.jpg",
    investment: 8000,
    dailyProfit: 296,
    duration: 90,
    totalReturn: 26640,
    rateOfReturn: 37,
    badge: "Best",
    badgeColor: "bg-green-500",
    enabled: true,
  },
  {
    id: "refinery3",
    name: "Memphis Refinery",
    image: "/refinery-image.jpg",
    investment: 11000,
    dailyProfit: 429,
    duration: 90,
    totalReturn: 38610,
    rateOfReturn: 39,
    badge: "Value",
    badgeColor: "bg-purple-500",
    enabled: true,
  },
  {
    id: "refinery4",
    name: "Meraux Refinery",
    image: "/refinery-image.jpg",
    investment: 22000,
    dailyProfit: 924,
    duration: 90,
    totalReturn: 83160,
    rateOfReturn: 42,
    badge: "VIP",
    badgeColor: "bg-yellow-500",
    enabled: true,
  },
]

export function HomePage() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [plans, setPlans] = useState(defaultPlans)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadInvestmentPlans()
  }, [])

  const loadInvestmentPlans = async () => {
    try {
      const database = getDatabase()
      const plansSnapshot = await get(ref(database, "settings/investmentPlans"))

      if (plansSnapshot.exists()) {
        const plansData = plansSnapshot.val()
        const plansList = Object.entries(plansData)
          .map(([id, data]: [string, any]) => ({
            id,
            ...data,
          }))
          .filter((plan: any) => plan.enabled)
          .sort((a: any, b: any) => a.investment - b.investment)

        setPlans(plansList)
      }
    } catch (error) {
      console.error("Error loading investment plans:", error)
    }
  }

  const handleInvest = (plan: any) => {
    setSelectedPlan(plan)
    setShowConfirmDialog(true)
  }

  const confirmPurchase = async () => {
    if (!selectedPlan || !user) return

    setLoading(true)
    setShowConfirmDialog(false)

    try {
      const database = getDatabase()
      const userRef = ref(database, `users/${user.uid}`)
      const userSnapshot = await get(userRef)
      const userData = userSnapshot.val()

      const currentBalance = userData?.balance || 0
      const requiredAmount = selectedPlan.investment

      if (currentBalance < requiredAmount) {
        toast({
          title: "Insufficient Balance",
          description: `Need ₨${requiredAmount - currentBalance} more to invest`,
          variant: "destructive",
        })
        return
      }

      const newBalance = currentBalance - requiredAmount

      await update(userRef, {
        balance: newBalance,
        total_invested: (userData?.total_invested || 0) + requiredAmount,
      })

      const investmentRef = ref(database, `investments/${user.uid}`)
      await push(investmentRef, {
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: selectedPlan.investment,
        dailyProfit: selectedPlan.dailyProfit,
        duration: selectedPlan.duration,
        totalReturn: selectedPlan.totalReturn,
        startDate: Date.now(),
        status: "active",
        lastProfitClaim: 0,
      })

      toast({
        title: "Investment Successful!",
        description: `₨${selectedPlan.dailyProfit} daily profit activated.`,
      })

      await refreshUser()
    } catch (error) {
      toast({
        title: "Error",
        description: "Investment failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Welcome and Balance */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white p-4 safe-area-top">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold">Al-Arab Car Trade</h1>
            <p className="text-sm text-blue-100">Welcome back, {user?.username}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-100">Balance</p>
            <p className="text-xl font-bold">₨{user?.balance?.toLocaleString() || 0}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
            <Wallet className="h-5 w-5 mx-auto mb-1 text-green-200" />
            <p className="text-xs text-blue-100">Total Invested</p>
            <p className="text-sm font-bold">₨{user?.total_invested?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-yellow-200" />
            <p className="text-xs text-blue-100">Total Earned</p>
            <p className="text-sm font-bold">₨{user?.total_earned?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
            <Target className="h-5 w-5 mx-auto mb-1 text-purple-200" />
            <p className="text-xs text-blue-100">Profit Available</p>
            <p className="text-sm font-bold">₨{user?.withdrawable_profit?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>

      {/* Investment Plans */}
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Investment Plans</h2>

        <div className="grid grid-cols-2 gap-4">
          {plans.map((plan) => {
            const canAfford = (user?.balance || 0) >= plan.investment

            return (
              <Card key={plan.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={plan.image || "/placeholder.svg"}
                    alt={plan.name}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = `/placeholder.svg?height=128&width=200&text=${plan.name}`
                    }}
                  />
                  <Badge className={`absolute top-2 right-2 ${plan.badgeColor} text-white text-xs`}>{plan.badge}</Badge>
                  {!canAfford && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="destructive" className="text-xs">
                        Insufficient Balance
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-3">
                  <h3 className="font-bold text-sm mb-1">{plan.name}</h3>
                  <p className="text-lg font-bold text-red-600 mb-2">Rs {plan.investment.toLocaleString()}</p>

                  <div className="space-y-1 text-xs text-gray-600 mb-3">
                    <div className="flex justify-between">
                      <span>Rate of return:</span>
                      <span className="font-bold text-green-600">{plan.rateOfReturn}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-bold">{plan.duration} Days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily Profit:</span>
                      <span className="font-bold text-blue-600">₨{plan.dailyProfit}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleInvest(plan)}
                    disabled={!canAfford || loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-8"
                  >
                    {canAfford ? "Buy now" : "Low Balance"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Investment</DialogTitle>
            <DialogDescription>Are you sure you want to invest in {selectedPlan?.name}?</DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Plan</p>
                    <p className="font-semibold">{selectedPlan.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Amount</p>
                    <p className="font-semibold">₨{selectedPlan.investment}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Daily Profit</p>
                    <p className="font-semibold text-green-600">₨{selectedPlan.dailyProfit}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-semibold">{selectedPlan.duration} Days</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span>Current Balance:</span>
                  <span className="font-semibold">₨{user?.balance || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>After Investment:</span>
                  <span className="font-semibold">₨{(user?.balance || 0) - selectedPlan.investment}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPurchase} disabled={loading}>
              {loading ? "Processing..." : "Confirm Investment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
