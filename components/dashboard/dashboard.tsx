"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Car,
  TrendingUp,
  History,
  User,
  Plus,
  Minus,
  LogOut,
  Settings,
  Shield,
  Wallet,
  Gift,
  Banknote,
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { InvestmentPlans } from "@/components/investment/investment-plans"
import { UserInvestments } from "@/components/investment/user-investments"
import { ProfileSection } from "@/components/profile/profile-section"
import { DepositForm } from "@/components/transactions/deposit-form"
import { WithdrawForm } from "@/components/transactions/withdraw-form"
import { TransactionHistory } from "@/components/transactions/transaction-history"
import { AdminPanel } from "@/components/admin/admin-panel"

export function Dashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("plans")

  const isAdmin = user?.is_admin || false

  const tabs = [
    { id: "plans", label: "Plans", icon: TrendingUp },
    { id: "investments", label: "Investments", icon: Car },
    { id: "profile", label: "Profile", icon: User },
    { id: "deposit", label: "Deposit", icon: Plus },
    { id: "withdraw", label: "Withdraw", icon: Minus },
    ...(!isAdmin ? [{ id: "history", label: "History", icon: History }] : []),
    ...(isAdmin ? [{ id: "admin", label: "Admin", icon: Settings }] : []),
  ]

  return (
    <div className="mobile-container mobile-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile Header */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white shadow-xl safe-area-top">
        <div className="mobile-p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center mobile-gap-2">
              <div className="mobile-p-1 bg-white/20 rounded backdrop-blur-sm">
                <Car className="h-4 w-4" />
              </div>
              <div>
                <h1 className="mobile-text-sm font-bold">Al-Arab Car Trade</h1>
                <p className="mobile-text-xs text-blue-100">{isAdmin ? "Admin" : "Investment"}</p>
              </div>
            </div>

            <div className="flex items-center mobile-gap-2">
              <div className="text-right">
                <p className="mobile-text-xs text-blue-100">Welcome</p>
                <p className="mobile-text-xs font-semibold flex items-center">
                  {user?.username?.substring(0, 8)}
                  {isAdmin && <Shield className="h-2 w-2 ml-1 text-yellow-300" />}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={logout}
                className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-white/30 mobile-text-xs h-6 px-2 relative overflow-hidden group"
              >
                <LogOut className="h-2 w-2 mr-1" />
                Out
                {/* Pakistani Rupee Notes Animation */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute animate-float-money opacity-30"
                      style={{
                        left: `${20 + i * 15}%`,
                        animationDelay: `${i * 0.3}s`,
                        animationDuration: "2s",
                      }}
                    >
                      <Banknote className="h-3 w-3 text-green-300 rotate-12" />
                    </div>
                  ))}
                </div>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Balance Card with Enhanced Animations */}
      <div className="mobile-p-2">
        <Card className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white border-0 shadow-xl relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-500/20 animate-pulse"></div>

          {/* Floating Money Animation for Deposit */}
          {activeTab === "deposit" && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-float-in"
                  style={{
                    left: `${Math.random() * 80 + 10}%`,
                    top: `${Math.random() * 60 + 20}%`,
                    animationDelay: `${i * 0.4}s`,
                    animationDuration: "3s",
                  }}
                >
                  <Wallet className="h-4 w-4 text-green-200 opacity-40" />
                </div>
              ))}
            </div>
          )}

          <CardContent className="mobile-p-2 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 mb-1 flex items-center mobile-text-xs">
                  <Wallet className="h-3 w-3 mr-1 animate-bounce" />
                  {isAdmin ? "Admin Balance" : "Balance"}
                </p>
                <p className="mobile-text-lg font-bold animate-pulse">₨{user?.balance?.toLocaleString() || "0"}</p>
                {!isAdmin && user?.balance === 20 && (
                  <p className="mobile-text-xs text-green-100 flex items-center animate-bounce">
                    <Gift className="h-2 w-2 mr-1" />
                    Welcome bonus!
                  </p>
                )}
              </div>
              <div className="flex mobile-gap-1">
                <Button
                  size="sm"
                  className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-white/30 mobile-text-xs h-6 px-2 relative overflow-hidden group"
                  onClick={() => setActiveTab("deposit")}
                >
                  <Plus className="h-2 w-2 mr-1" />
                  Add
                  {/* Wallet Animation for Add Button */}
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <Wallet className="h-3 w-3 text-green-300 absolute top-1 right-1 animate-bounce" />
                  </div>
                </Button>
                <Button
                  size="sm"
                  className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-white/30 mobile-text-xs h-6 px-2 relative overflow-hidden group"
                  onClick={() => setActiveTab("withdraw")}
                >
                  <Minus className="h-2 w-2 mr-1" />
                  Out
                  {/* Pakistani 5000 Rupee Notes Animation */}
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    {[...Array(2)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute animate-float-out"
                        style={{
                          left: `${10 + i * 20}%`,
                          top: "10%",
                          animationDelay: `${i * 0.2}s`,
                          animationDuration: "1.5s",
                        }}
                      >
                        <div className="w-4 h-2 bg-gradient-to-r from-green-600 to-green-800 rounded-sm text-xs flex items-center justify-center text-white font-bold opacity-80">
                          5K
                        </div>
                      </div>
                    ))}
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Main Content */}
      <div className="mobile-content mobile-p-2 pb-20 safe-area-bottom">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Mobile Tabs */}
          <TabsList
            className={`grid w-full mb-2 bg-white/80 backdrop-blur-sm ${isAdmin ? "grid-cols-6" : "grid-cols-6"}`}
          >
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`flex flex-col items-center mobile-p-1 mobile-text-xs transition-all duration-300 ${
                    tab.id === "admin"
                      ? "bg-red-100 text-red-700 data-[state=active]:bg-red-600 data-[state=active]:text-white"
                      : ""
                  } ${activeTab === tab.id ? "scale-110" : ""}`}
                >
                  <IconComponent className={`h-3 w-3 ${activeTab === tab.id ? "animate-bounce" : ""}`} />
                  <span className="mobile-text-xs">{tab.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value="plans">
            <InvestmentPlans />
          </TabsContent>

          <TabsContent value="investments">
            <UserInvestments />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileSection />
          </TabsContent>

          <TabsContent value="deposit">
            <DepositForm />
          </TabsContent>

          <TabsContent value="withdraw">
            <WithdrawForm />
          </TabsContent>

          {!isAdmin && (
            <TabsContent value="history">
              <TransactionHistory />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="admin">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <style jsx>{`
        @keyframes float-money {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(180deg);
          }
        }
        @keyframes float-in {
          0% {
            transform: translateY(20px) scale(0);
            opacity: 0;
          }
          50% {
            transform: translateY(-10px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(0px) scale(0.8);
            opacity: 0;
          }
        }
        @keyframes float-out {
          0% {
            transform: translateY(0px) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-30px) scale(0.5) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-float-money {
          animation: float-money 2s ease-in-out infinite;
        }
        .animate-float-in {
          animation: float-in 3s ease-in-out infinite;
        }
        .animate-float-out {
          animation: float-out 1.5s ease-out infinite;
        }
      `}</style>
    </div>
  )
}
