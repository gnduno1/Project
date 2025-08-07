"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Car, Clock, Gift, CheckCircle } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { getDatabase, ref, get, update } from "firebase/database"

export function UserInvestments() {
  const { user, refreshUser } = useAuth()
  const [investments, setInvestments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [claimingProfit, setClaimingProfit] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadInvestments()
    }
  }, [user])

  const loadInvestments = async () => {
    if (!user) return

    setLoading(true)
    try {
      const database = getDatabase()
      const investmentsRef = ref(database, `investments/${user.uid}`)
      const snapshot = await get(investmentsRef)

      if (snapshot.exists()) {
        const investmentsData = snapshot.val()
        const investmentsList = Object.entries(investmentsData).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }))
        setInvestments(investmentsList)
      } else {
        setInvestments([])
      }
    } catch (error) {
      console.error("Error loading investments:", error)
    } finally {
      setLoading(false)
    }
  }

  const canClaimProfit = (investment: any) => {
    const now = Date.now()
    const lastClaim = investment.lastProfitClaim || investment.startDate
    const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60)
    return hoursSinceLastClaim >= 24 && investment.status === "active"
  }

  const claimDailyProfit = async (investmentId: string) => {
    if (!user) return

    setClaimingProfit(investmentId)
    try {
      const database = getDatabase()
      const investment = investments.find((inv) => inv.id === investmentId)

      if (!investment || !canClaimProfit(investment)) {
        return
      }

      // Update user balance
      const userRef = ref(database, `users/${user.uid}`)
      const userSnapshot = await get(userRef)
      const userData = userSnapshot.val()

      // Add profit to withdrawable_profit instead of balance
      const newWithdrawableProfit = (userData.withdrawable_profit || 0) + investment.dailyProfit
      const newTotalEarned = (userData.total_earned || 0) + investment.dailyProfit

      await update(userRef, {
        withdrawable_profit: newWithdrawableProfit,
        total_earned: newTotalEarned,
      })

      // Update investment last claim time
      const investmentRef = ref(database, `investments/${user.uid}/${investmentId}`)
      await update(investmentRef, {
        lastProfitClaim: Date.now(),
      })

      await refreshUser()
      await loadInvestments()
    } catch (error) {
      console.error("Error claiming profit:", error)
    } finally {
      setClaimingProfit(null)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading investments...</p>
      </div>
    )
  }

  if (investments.length === 0) {
    return (
      <Card className="text-center py-6">
        <CardContent>
          <Car className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Investments Yet</h3>
          <p className="text-sm text-gray-600 mb-4">Start investing in car trading plans to earn daily profits.</p>
          <Button size="sm">Browse Plans</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards - Mobile Optimized */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-blue-100 text-xs">Active</p>
              <p className="text-lg font-bold">{investments.filter((inv) => inv.status === "active").length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-green-100 text-xs">Invested</p>
              <p className="text-lg font-bold">
                ₨{investments.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-purple-100 text-xs">Returns</p>
              <p className="text-lg font-bold">
                ₨{investments.reduce((sum, inv) => sum + inv.totalReturn, 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Cards - Mobile Optimized */}
      <div className="space-y-3">
        {investments.map((investment) => {
          const daysElapsed = Math.floor((Date.now() - investment.startDate) / (1000 * 60 * 60 * 24))
          const remainingDays = Math.max(0, investment.duration - daysElapsed)
          const progress = Math.min(100, (daysElapsed / investment.duration) * 100)
          const profitEarned = investment.dailyProfit * daysElapsed
          const remainingProfit = Math.max(0, investment.totalReturn - profitEarned)
          const canClaim = canClaimProfit(investment)

          return (
            <Card key={investment.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">{investment.planName}</CardTitle>
                    <CardDescription className="text-xs">
                      Started {new Date(investment.startDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={investment.status === "active" ? "default" : "secondary"}
                    className={investment.status === "active" ? "bg-green-100 text-green-800 text-xs" : "text-xs"}
                  >
                    {investment.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-3 space-y-3">
                {/* Investment Details - Compact */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600">Investment</p>
                    <p className="font-semibold">₨{investment.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Daily Profit</p>
                    <p className="font-semibold text-green-600">₨{investment.dailyProfit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Days Left</p>
                    <p className="font-semibold">{remainingDays}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Return</p>
                    <p className="font-semibold text-blue-600">₨{investment.totalReturn.toLocaleString()}</p>
                  </div>
                </div>

                {/* Progress Bar - Compact */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-1" />
                </div>

                {/* Profit Information - Compact */}
                <div className="bg-green-50 p-2 rounded text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-gray-600">Earned</p>
                      <p className="font-semibold text-green-600">₨{profitEarned.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Remaining</p>
                      <p className="font-semibold text-blue-600">₨{remainingProfit.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Claim Profit Section - Compact */}
                {investment.status === "active" && (
                  <div className="space-y-2">
                    {canClaim ? (
                      <Alert className="border-green-200 bg-green-50 p-2">
                        <Gift className="h-3 w-3 text-green-600" />
                        <AlertDescription className="text-green-800 text-xs">
                          Daily profit of ₨{investment.dailyProfit} ready!
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="p-2">
                        <Clock className="h-3 w-3" />
                        <AlertDescription className="text-xs">
                          Next claim in{" "}
                          {24 -
                            Math.floor(
                              (Date.now() - (investment.lastProfitClaim || investment.startDate)) / (1000 * 60 * 60),
                            )}{" "}
                          hours
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      className="w-full text-xs h-8"
                      onClick={() => claimDailyProfit(investment.id)}
                      disabled={!canClaim || claimingProfit === investment.id}
                      size="sm"
                    >
                      {claimingProfit === investment.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                          Claiming...
                        </>
                      ) : canClaim ? (
                        <>
                          <Gift className="h-3 w-3 mr-1" />
                          Claim ₨{investment.dailyProfit}
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Not Available
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {investment.status === "completed" && (
                  <Alert className="border-blue-200 bg-blue-50 p-2">
                    <CheckCircle className="h-3 w-3 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-xs">
                      Completed! Total earned: ₨{investment.totalReturn.toLocaleString()}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
