"use client"

import { useState } from "react"
import { HomePage } from "@/components/pages/home-page"
import { TeamPage } from "@/components/pages/team-page"
import { MinePage } from "@/components/pages/mine-page"
import { Home, Users, User } from "lucide-react"
import { ProfitClaimSystem } from "@/components/investment/profit-claim-system"

export function MainApp() {
  const [activeTab, setActiveTab] = useState("home")

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomePage />
      case "team":
        return <TeamPage />
      case "mine":
        return <MinePage />
      default:
        return <HomePage />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Background Profit Claim System */}
      <ProfitClaimSystem />

      {/* Main Content */}
      <div className="pb-16">{renderContent()}</div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === "home" ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            onClick={() => setActiveTab("team")}
            className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === "team" ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs font-medium">Team</span>
          </button>

          <button
            onClick={() => setActiveTab("mine")}
            className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === "mine" ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">Mine</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MainApp
