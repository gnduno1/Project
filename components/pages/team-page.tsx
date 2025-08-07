"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/components/providers/auth-provider"
import { getDatabase, ref, get } from "firebase/database"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  Gift,
  Share2,
  Copy,
  TrendingUp,
  Target,
  Award,
  RefreshCw,
  UserPlus,
  DollarSign,
  Crown,
} from "lucide-react"

export function TeamPage() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [referralData, setReferralData] = useState({
    referralCode: "",
    totalReferrals: 0,
    totalEarnings: 0,
    thisMonthReferrals: 0,
    thisMonthEarnings: 0,
    referralList: [],
    commissionHistory: [],
  })

  useEffect(() => {
    if (user?.uid) {
      loadReferralData()
    }
  }, [user])

  const loadReferralData = async () => {
    setLoading(true)
    try {
      const database = getDatabase()

      // Load user's referral code and stats
      const userRef = ref(database, `users/${user?.uid}`)
      const userSnapshot = await get(userRef)
      const userData = userSnapshot.val()

      // Load all users to find referrals
      const usersRef = ref(database, "users")
      const usersSnapshot = await get(usersRef)
      const allUsers = usersSnapshot.val() || {}

      // Find users referred by current user
      const referredUsers = Object.entries(allUsers)
        .filter(([id, data]: [string, any]) => data.referred_by === user?.uid)
        .map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }))

      // Load commission history
      const commissionsRef = ref(database, "referral_commissions")
      const commissionsSnapshot = await get(commissionsRef)
      const commissionsData = commissionsSnapshot.val() || {}

      const userCommissions = Object.entries(commissionsData)
        .filter(([id, data]: [string, any]) => data.referrerId === user?.uid)
        .map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }))
        .sort((a: any, b: any) => b.timestamp - a.timestamp)

      // Calculate this month's stats
      const thisMonth = new Date().getMonth()
      const thisYear = new Date().getFullYear()

      const thisMonthCommissions = userCommissions.filter((commission: any) => {
        const commissionDate = new Date(commission.timestamp)
        return commissionDate.getMonth() === thisMonth && commissionDate.getFullYear() === thisYear
      })

      setReferralData({
        referralCode: userData?.refer_code || "",
        totalReferrals: referredUsers.length,
        totalEarnings: userData?.referral_earnings || 0,
        thisMonthReferrals: thisMonthCommissions.length,
        thisMonthEarnings: thisMonthCommissions.reduce((sum: number, c: any) => sum + (c.commissionAmount || 0), 0),
        referralList: referredUsers,
        commissionHistory: userCommissions.slice(0, 10), // Last 10 commissions
      })
    } catch (error) {
      console.error("Error loading referral data:", error)
      toast({
        title: "Error",
        description: "Failed to load referral data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyReferCode = () => {
    if (referralData.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode)
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      })
    }
  }

  const shareReferCode = () => {
    if (navigator.share && referralData.referralCode) {
      navigator.share({
        title: "Join Al-Arab Car Trade",
        text: `Use my referral code ${referralData.referralCode} and get ₨50 bonus on signup! Start investing in profitable car trading.`,
        url: window.location.origin,
      })
    } else {
      copyReferCode()
    }
  }

  const refreshData = async () => {
    await loadReferralData()
    await refreshUser()
    toast({
      title: "Refreshed!",
      description: "Referral data updated successfully",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white p-4 safe-area-top">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold">Team & Referrals</h1>
            <p className="text-sm text-purple-100">Build your network and earn</p>
          </div>
          <Button
            onClick={refreshData}
            disabled={loading}
            size="sm"
            variant="secondary"
            className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
            <Users className="h-5 w-5 mx-auto mb-1 text-purple-200" />
            <p className="text-xs text-purple-100">Total Referrals</p>
            <p className="text-lg font-bold">{referralData.totalReferrals}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-200" />
            <p className="text-xs text-purple-100">Total Earnings</p>
            <p className="text-lg font-bold">₨{referralData.totalEarnings.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Referral Code Card */}
        <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Gift className="h-5 w-5 mr-2 text-blue-600" />
              Your Referral Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <div className="bg-white p-4 rounded-xl border-2 border-blue-300 shadow-sm mb-3">
                <code className="text-2xl font-bold text-blue-600">{referralData.referralCode || "Loading..."}</code>
              </div>

              <div className="flex gap-2">
                <Button onClick={copyReferCode} className="flex-1 bg-transparent" variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
                <Button onClick={shareReferCode} className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <div className="bg-white/70 rounded-lg p-3 text-sm">
              <h4 className="font-semibold mb-2 text-blue-800">How it works:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Share your code with friends</li>
                <li>• They get ₨50 bonus on signup</li>
                <li>• You earn 30% commission on their deposits</li>
                <li>• Unlimited referrals, unlimited earnings!</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Target className="h-5 w-5 mr-2 text-green-600" />
              This Month Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <UserPlus className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <p className="text-sm text-green-600">New Referrals</p>
                <p className="text-xl font-bold text-green-800">{referralData.thisMonthReferrals}</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <p className="text-sm text-blue-600">Earnings</p>
                <p className="text-xl font-bold text-blue-800">₨{referralData.thisMonthEarnings.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Monthly Goal Progress</span>
                <span className="font-semibold">{Math.min(referralData.thisMonthReferrals * 10, 100)}%</span>
              </div>
              <Progress value={Math.min(referralData.thisMonthReferrals * 10, 100)} className="h-2" />
              <p className="text-xs text-gray-600 text-center">Refer 10 friends this month to unlock bonus rewards!</p>
            </div>
          </CardContent>
        </Card>

        {/* Referral List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Your Team ({referralData.totalReferrals})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referralData.referralList.length > 0 ? (
              <div className="space-y-3">
                {referralData.referralList.slice(0, 5).map((referral: any) => (
                  <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {referral.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{referral.username}</p>
                        <p className="text-xs text-gray-600">
                          Joined {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={referral.status === "active" ? "default" : "secondary"} className="text-xs">
                        {referral.status}
                      </Badge>
                      <p className="text-xs text-gray-600 mt-1">
                        ₨{referral.total_deposited?.toLocaleString() || 0} deposited
                      </p>
                    </div>
                  </div>
                ))}

                {referralData.referralList.length > 5 && (
                  <p className="text-center text-sm text-gray-600">
                    +{referralData.referralList.length - 5} more team members
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No referrals yet</p>
                <p className="text-xs">Start sharing your code to build your team!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commission History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Award className="h-5 w-5 mr-2 text-yellow-600" />
              Recent Commissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referralData.commissionHistory.length > 0 ? (
              <div className="space-y-3">
                {referralData.commissionHistory.map((commission: any) => (
                  <div
                    key={commission.id}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div>
                      <p className="font-medium text-sm text-green-800">Commission from {commission.newUserUsername}</p>
                      <p className="text-xs text-green-600">
                        {new Date(commission.timestamp).toLocaleDateString()} • Deposit: ₨
                        {commission.depositAmount?.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">+₨{commission.commissionAmount}</p>
                      <p className="text-xs text-green-500">{commission.commissionRate}% rate</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No commissions yet</p>
                <p className="text-xs">Earn commissions when your referrals make deposits!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referral Levels */}
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Crown className="h-5 w-5 mr-2 text-yellow-600" />
              Referral Levels & Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Bronze Level</p>
                  <p className="text-xs text-gray-600">1-9 referrals</p>
                </div>
                <Badge className="bg-orange-500 text-white">30% Commission</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Silver Level</p>
                  <p className="text-xs text-gray-600">10-24 referrals</p>
                </div>
                <Badge className="bg-gray-500 text-white">35% Commission</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Gold Level</p>
                  <p className="text-xs text-gray-600">25+ referrals</p>
                </div>
                <Badge className="bg-yellow-500 text-white">40% Commission</Badge>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
              <p className="text-sm font-semibold text-center text-yellow-800">
                🎉 Current Level: Bronze • Next Level: {10 - referralData.totalReferrals} more referrals needed!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
