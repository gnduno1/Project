"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Car,
  Crown,
  Zap,
  Shield,
  Rocket,
  CheckCircle,
  AlertCircle,
  Wallet,
  RefreshCw,
  TrendingUp,
  DollarSign,
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { getDatabase, ref, push, update, get } from "firebase/database"

// Updated plans with new car images
const defaultPlans = [
  {
    id: "starter",
    name: "Starter",
    icon: "Car",
    image: "/placeholder.svg?height=150&width=300&text=🚗+Honda+City&bg=ffffff",
    investment: 250,
    dailyProfit: 70,
    duration: 90,
    totalReturn: 6300,
    totalProfit: 6050, // 90 days total profit
    badge: "Popular",
    badgeColor: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
    enabled: true,
  },
  {
    id: "growth",
    name: "Growth",
    icon: "Zap",
    image: "/placeholder.svg?height=150&width=300&text=🚙+Toyota+Corolla&bg=ffffff",
    investment: 500,
    dailyProfit: 140,
    duration: 90,
    totalReturn: 12600,
    totalProfit: 12100, // 90 days total profit
    badge: "Best",
    badgeColor: "bg-green-500",
    gradient: "from-green-500 to-green-600",
    enabled: true,
  },
  {
    id: "premium",
    name: "Premium",
    icon: "Shield",
    image: "/placeholder.svg?height=150&width=300&text=🏎️+BMW+3+Series&bg=ffffff",
    investment: 1000,
    dailyProfit: 280,
    duration: 90,
    totalReturn: 25200,
    totalProfit: 24200, // 90 days total profit
    badge: "Value",
    badgeColor: "bg-purple-500",
    gradient: "from-purple-500 to-purple-600",
    enabled: true,
  },
  {
    id: "elite",
    name: "Elite",
    icon: "Crown",
    image: "/placeholder.svg?height=150&width=300&text=🏆+Mercedes+S+Class&bg=ffffff",
    investment: 2500,
    dailyProfit: 750,
    duration: 90,
    totalReturn: 67500,
    totalProfit: 65000, // 90 days total profit
    badge: "VIP",
    badgeColor: "bg-yellow-500",
    gradient: "from-yellow-500 to-orange-500",
    enabled: true,
  },
]

export function InvestmentPlans() {
  const { user, refreshUser } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showResultDialog, setShowResultDialog] = useState(false)
  const [purchaseResult, setPurchaseResult] = useState<{
    success: boolean
    message: string
    plan?: any
  }>({ success: false, message: "" })
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<any[]>(defaultPlans)
  const [plansLoading, setPlansLoading] = useState(true)

  // Load investment plans from Firebase
  useEffect(() => {
    loadInvestmentPlans()
  }, [])

  const loadInvestmentPlans = async () => {
    try {
      setPlansLoading(true)
      const database = getDatabase()
      const plansSnapshot = await get(ref(database, "settings/investmentPlans"))

      if (plansSnapshot.exists()) {
        const plansData = plansSnapshot.val()
        const plansList = Object.entries(plansData)
          .map(([id, data]: [string, any]) => ({
            id,
            ...data,
            totalProfit: data.dailyProfit * data.duration - data.investment, // Calculate 90 days total profit
          }))
          .filter((plan: any) => plan.enabled) // Only show enabled plans
          .sort((a: any, b: any) => a.investment - b.investment) // Sort by investment amount (price)

        setPlans(plansList)
      } else {
        // Use default plans if no plans exist in Firebase
        setPlans(defaultPlans)
      }
    } catch (error) {
      console.error("Error loading investment plans:", error)
      // Fallback to default plans on error
      setPlans(defaultPlans)
    } finally {
      setPlansLoading(false)
    }
  }

  // Function to get icon component from string
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Car":
        return Car
      case "Zap":
        return Zap
      case "Shield":
        return Shield
      case "Crown":
        return Crown
      case "Rocket":
        return Rocket
      default:
        return Car
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
        setPurchaseResult({
          success: false,
          message: `Need ₨${requiredAmount - currentBalance} more to invest`,
        })
      } else {
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

        setPurchaseResult({
          success: true,
          message: `Investment successful! ₨${selectedPlan.dailyProfit} daily profit activated.`,
          plan: selectedPlan,
        })

        await refreshUser()
      }
    } catch (error) {
      setPurchaseResult({
        success: false,
        message: "Error occurred. Please try again.",
      })
    }

    setLoading(false)
    setShowResultDialog(true)
  }

  const closeResultDialog = () => {
    setShowResultDialog(false)
    setSelectedPlan(null)
    setPurchaseResult({ success: false, message: "" })
  }

  if (plansLoading) {
    return (
      <div className="space-y-3">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-1">🚗 Investment Plans</h2>
          <p className="text-xs text-gray-600">Loading plans...</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-1">🚗 Car Trading Plans</h2>
        <p className="text-xs text-gray-600">Choose your car trading investment plan</p>
        <Button
          onClick={loadInvestmentPlans}
          size="sm"
          variant="outline"
          className="mt-2 text-xs bg-transparent"
          disabled={plansLoading}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${plansLoading ? "animate-spin" : ""}`} />
          Refresh Plans
        </Button>
      </div>

      {/* Compact Balance Display */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardContent className="p-2">
          <div className="flex items-center justify-center space-x-2">
            <Wallet className="h-4 w-4" />
            <div className="text-center">
              <p className="text-green-100 text-xs">Available Balance</p>
              <p className="text-lg font-bold">₨{user?.balance?.toLocaleString() || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        {plans.map((plan) => {
          const IconComponent = typeof plan.icon === "string" ? getIconComponent(plan.icon) : plan.icon || Car
          const canAfford = (user?.balance || 0) >= plan.investment

          return (
            <Card
              key={plan.id}
              className={`relative overflow-hidden hover:shadow-lg transition-all duration-300 ${
                !canAfford ? "opacity-75" : ""
              }`}
            >
              <Badge className={`absolute top-1 right-1 z-10 ${plan.badgeColor} text-white text-xs`}>
                {plan.badge}
              </Badge>

              {!canAfford && (
                <Badge className="absolute top-1 left-1 z-10 bg-red-500 text-white text-xs">Low Balance</Badge>
              )}

              <div className="h-24 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-2 overflow-hidden">
                <img
                  src={plan.image || "/placeholder.svg"}
                  alt={`${plan.name} Car`}
                  className="max-h-full max-w-full object-contain rounded-md drop-shadow-lg hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `/placeholder.svg?height=150&width=300&text=${plan.name}+Car&bg=ffffff`
                  }}
                />
              </div>

              <CardHeader className="p-2">
                <CardTitle className="text-sm flex items-center space-x-1">
                  <IconComponent className="h-3 w-3" />
                  <span>{plan.name}</span>
                </CardTitle>
                <CardDescription className="text-xs">Car Trading Investment</CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 p-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600">Investment</p>
                    <p className="font-semibold">₨{plan.investment}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 flex items-center">
                      <DollarSign className="h-3 w-3 mr-1 text-green-500" />
                      Daily Profit
                    </p>
                    <p className="font-semibold text-green-600">₨{plan.dailyProfit}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-semibold">{plan.duration} Days</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Return</p>
                    <p className="font-semibold text-blue-600">₨{plan.totalReturn?.toLocaleString()}</p>
                  </div>
                </div>

                {/* Daily Profit Highlight - PROMINENTLY DISPLAYED */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-2">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-bold text-green-700">DAILY PROFIT</span>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">₨{plan.dailyProfit}</div>
                    <div className="text-xs text-green-600 font-medium">
                      Earn ₨{plan.dailyProfit} every day for {plan.duration} days
                    </div>
                  </div>
                </div>

                {/* 90 Days Total Profit Display */}
                <div className="pt-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">90 Days Total Profit:</span>
                    <span className="font-semibold text-purple-600">₨{plan.totalProfit?.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div className={`bg-gradient-to-r ${plan.gradient} h-1 rounded-full w-full`}></div>
                  </div>
                </div>

                {!canAfford && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      Need ₨{plan.investment - (user?.balance || 0)} more
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  className="w-full text-xs h-6"
                  onClick={() => handleInvest(plan)}
                  disabled={!canAfford}
                  variant={canAfford ? "default" : "secondary"}
                  size="sm"
                >
                  <Rocket className="h-3 w-3 mr-1" />
                  {canAfford ? "Invest Now" : "Low Balance"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No investment plans available</p>
          <Button onClick={loadInvestmentPlans} size="sm" className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Plans
          </Button>
        </div>
      )}

      {/* Compact Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">🚗 Confirm Investment</DialogTitle>
            <DialogDescription className="text-xs">Invest in {selectedPlan?.name} plan?</DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-2">
              <div className="bg-gray-50 p-2 rounded text-xs">
                <div className="grid grid-cols-2 gap-2">
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

              <div className="bg-green-50 border border-green-200 rounded p-2 text-xs">
                <div className="font-semibold text-green-700 mb-1 flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Daily Earnings:
                </div>
                <div className="text-green-600">
                  You will earn ₨{selectedPlan.dailyProfit} every day for {selectedPlan.duration} days
                </div>
                <div className="text-green-700 font-semibold mt-1">
                  90 Days Total Profit: ₨{selectedPlan.totalProfit?.toLocaleString()}
                </div>
              </div>

              <div className="bg-blue-50 p-2 rounded text-xs">
                <div className="flex justify-between">
                  <span>Current Balance:</span>
                  <span className="font-semibold">₨{user?.balance?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>After Investment:</span>
                  <span className="font-semibold">
                    ₨{((user?.balance || 0) - selectedPlan.investment).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} size="sm" className="text-xs">
              Cancel
            </Button>
            <Button onClick={confirmPurchase} disabled={loading} size="sm" className="text-xs">
              {loading ? "Processing..." : "Confirm Investment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compact Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-sm">
              {purchaseResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span>{purchaseResult.success ? "🎉 Success!" : "❌ Failed"}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Alert variant={purchaseResult.success ? "default" : "destructive"}>
              <AlertDescription className="text-xs">{purchaseResult.message}</AlertDescription>
            </Alert>

            {purchaseResult.success && purchaseResult.plan && (
              <div className="bg-green-50 p-2 rounded text-xs">
                <h4 className="font-semibold mb-1">🚗 Investment Details:</h4>
                <div className="grid grid-cols-2 gap-1">
                  <div>Plan: {purchaseResult.plan.name}</div>
                  <div>Amount: ₨{purchaseResult.plan.investment}</div>
                  <div>Daily Profit: ₨{purchaseResult.plan.dailyProfit}</div>
                  <div>Duration: {purchaseResult.plan.duration} Days</div>
                </div>
                <div className="mt-2 p-2 bg-green-100 rounded border border-green-200">
                  <div className="font-semibold text-green-700 flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Daily Earnings Activated!
                  </div>
                  <div className="text-green-600">You will now earn ₨{purchaseResult.plan.dailyProfit} every day</div>
                  <div className="text-green-700 font-semibold mt-1">
                    90 Days Total Profit: ₨{purchaseResult.plan.totalProfit?.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={closeResultDialog} size="sm" className="text-xs">
              {purchaseResult.success ? "Continue" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InvestmentPlans
