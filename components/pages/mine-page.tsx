"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import {
  User,
  Wallet,
  CreditCard,
  Settings,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Crown,
  TrendingUp,
  History,
  Lock,
  Bell,
  Phone,
  Mail,
  ArrowLeft,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DepositForm } from "@/components/transactions/deposit-form"
import { WithdrawForm } from "@/components/transactions/withdraw-form"
import { ProfileSection } from "@/components/profile/profile-section"
import { UserInvestments } from "@/components/investment/user-investments"
import { TransactionHistory } from "@/components/transactions/transaction-history"
import { AdminPanel } from "@/components/admin/admin-panel"
import { getDatabase, ref, get, update, remove } from "firebase/database"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Bot, Send, Trash2, CheckCircle, AlertTriangle, Info, Gift, Megaphone } from "lucide-react"

type ActiveSection =
  | "main"
  | "profile"
  | "investments"
  | "transactions"
  | "password"
  | "notifications"
  | "help"
  | "settings"
  | "admin"

export function MinePage() {
  const { user, logout } = useAuth()
  const [showDepositDialog, setShowDepositDialog] = useState(false)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [activeSection, setActiveSection] = useState<ActiveSection>("main")
  const [supportInfo, setSupportInfo] = useState({
    phone: "+92 325 7340165",
    email: "support@abcartrade.com",
    address: "Karachi, Pakistan",
  })
  const [notifications, setNotifications] = useState<any[]>([])
  const [showBot, setShowBot] = useState(false)
  const [botLanguage, setBotLanguage] = useState<"en" | "ur">("en")
  const [botMessages, setBotMessages] = useState<any[]>([])
  const [botInput, setBotInput] = useState("")
  const [botLoading, setBotLoading] = useState(false)

  useEffect(() => {
    fetchSupportInfo()
  }, [])

  useEffect(() => {
    if (user?.uid) {
      loadNotifications()
    }
  }, [user])

  const fetchSupportInfo = async () => {
    try {
      const database = getDatabase()
      const snapshot = await get(ref(database, "settings/supportInfo"))
      if (snapshot.exists()) {
        setSupportInfo(snapshot.val())
      }
    } catch (error) {
      console.error("Error fetching support info:", error)
    }
  }

  const loadNotifications = async () => {
    try {
      const database = getDatabase()
      const notificationsRef = ref(database, `notifications/${user?.uid}`)
      const snapshot = await get(notificationsRef)

      if (snapshot.exists()) {
        const notificationsData = Object.entries(snapshot.val())
          .map(([id, data]: [string, any]) => ({ id, ...data }))
          .sort((a, b) => b.timestamp - a.timestamp)
        setNotifications(notificationsData)
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
    }
  }

  const menuItems = [
    {
      icon: User,
      title: "My Profile",
      description: "Personal information & settings",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      section: "profile" as ActiveSection,
    },
    {
      icon: TrendingUp,
      title: "My Investment",
      description: "View active investments",
      color: "text-green-600",
      bgColor: "bg-green-50",
      section: "investments" as ActiveSection,
    },
    {
      icon: History,
      title: "Transaction History",
      description: "All deposits & withdrawals",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      section: "transactions" as ActiveSection,
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "View admin messages & updates",
      color: "text-red-600",
      bgColor: "bg-red-50",
      section: "notifications" as ActiveSection,
      badge:
        notifications.filter((n) => !n.isRead).length > 0 ? notifications.filter((n) => !n.isRead).length : undefined,
    },
    {
      icon: Lock,
      title: "Change Password",
      description: "Update your password",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      section: "password" as ActiveSection,
    },
    {
      icon: Settings,
      title: "Settings",
      description: "App preferences & privacy",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      section: "settings" as ActiveSection,
    },
  ]

  const botResponses = {
    en: {
      greeting: "Hello! I'm your Al-Arab Car Trade assistant. How can I help you today?",
      platform_info:
        "Al-Arab Car Trade is a premium investment platform where you can invest in car trading and earn guaranteed daily profits. We offer various investment plans with different profit rates.",
      how_to_invest:
        "To invest: 1) Make a deposit 2) Choose an investment plan 3) Confirm your investment 4) Start earning daily profits automatically!",
      withdrawal_process:
        "To withdraw: 1) Go to Mine page 2) Click Withdraw 3) Enter amount (min ₨500) 4) Provide account details 5) Wait for admin approval",
      profit_calculation:
        "Profits are calculated daily based on your investment plan. For example, if you invest ₨10,000 in a 2.5% daily plan, you'll earn ₨250 daily for the plan duration.",
      referral_program:
        "Invite friends with your referral code! They get ₨50 bonus, you earn ₨30 per successful referral. No limits!",
      support_hours: "Our support team is available 24/7. You can contact us anytime for assistance.",
      minimum_deposit: "Minimum deposit is ₨250. You can deposit using JazzCash, EasyPaisa, or Bank Transfer.",
      account_security:
        "Your account is secured with advanced encryption. Always use strong passwords and never share your login details.",
      investment_plans:
        "We offer 4 categories: Budget (₨10K-50K), Medium (₨50K-200K), Premium (₨200K-500K), and VIP (₨500K+) with different profit rates.",
    },
    ur: {
      greeting: "السلام علیکم! میں آپ کا الارب کار ٹریڈ اسسٹنٹ ہوں۔ آج میں آپ کی کیسے مدد کر سکتا ہوں؟",
      platform_info:
        "الارب کار ٹریڈ ایک پریمیم انویسٹمنٹ پلیٹ فارم ہے جہاں آپ کار ٹریڈنگ میں سرمایہ کاری کر کے یقینی روزانہ منافع کما سکتے ہیں۔",
      how_to_invest:
        "سرمایہ کاری کے لیے: 1) ڈپازٹ کریں 2) انویسٹمنٹ پلان منتخب کریں 3) اپنی سرمایہ کاری کی تصدیق کریں 4) خودکار طور پر روزانہ منافع کمانا شروع کریں!",
      withdrawal_process:
        "رقم نکالنے کے لیے: 1) مائن پیج پر جائیں 2) Withdraw پر کلک کریں 3) رقم داخل کریں (کم سے کم ₨500) 4) اکاؤنٹ کی تفصیلات فراہم کریں 5) ایڈمن کی منظوری کا انتظار کریں",
      profit_calculation:
        "منافع آپ کے انویسٹمنٹ پلان کی بنیاد پر روزانہ کیلکولیٹ ہوتا ہے۔ مثال: اگر آپ ₨10,000 میں 2.5% روزانہ پلان میں سرمایہ کاری کریں تو آپ کو پلان کی مدت کے لیے روزانہ ₨250 ملیں گے۔",
      referral_program:
        "اپنے ریفرل کوڈ سے دوستوں کو مدعو کریں! انہیں ₨50 بونس ملتا ہے، آپ کو ہر کامیاب ریفرل پر ₨30 ملتے ہیں۔ کوئی حد نہیں!",
      support_hours: "ہماری سپورٹ ٹیم 24/7 دستیاب ہے۔ آپ کسی بھی وقت مدد کے لیے رابطہ کر سکتے ہیں۔",
      minimum_deposit: "کم سے کم ڈپازٹ ₨250 ہے۔ آپ JazzCash، EasyPaisa، یا بینک ٹرانسفر استعمال کر سکتے ہیں۔",
      account_security:
        "آپ کا اکاؤنٹ ایڈوانس انکرپشن سے محفوظ ہے۔ ہمیشہ مضبوط پاس ورڈ استعمال کریں اور اپنی لاگ ان تفصیلات کسی سے شیئر نہ کریں۔",
      investment_plans:
        "ہم 4 کیٹگریز پیش کرتے ہیں: بجٹ (₨10K-50K)، میڈیم (₨50K-200K)، پریمیم (₨200K-500K)، اور VIP (₨500K+) مختلف منافع کی شرح کے ساتھ۔",
    },
  }

  const handleBotMessage = async (message: string) => {
    setBotLoading(true)

    // Add user message
    const userMessage = {
      type: "user",
      message: message,
      timestamp: Date.now(),
    }

    setBotMessages((prev) => [...prev, userMessage])

    // Generate bot response
    let botResponse = ""
    const lang = botLanguage
    const responses = botResponses[lang]

    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("invest") || lowerMessage.includes("سرمایہ")) {
      botResponse = responses.how_to_invest
    } else if (lowerMessage.includes("withdraw") || lowerMessage.includes("نکال")) {
      botResponse = responses.withdrawal_process
    } else if (lowerMessage.includes("profit") || lowerMessage.includes("منافع")) {
      botResponse = responses.profit_calculation
    } else if (lowerMessage.includes("refer") || lowerMessage.includes("ریفر")) {
      botResponse = responses.referral_program
    } else if (lowerMessage.includes("deposit") || lowerMessage.includes("ڈپازٹ")) {
      botResponse = responses.minimum_deposit
    } else if (lowerMessage.includes("plan") || lowerMessage.includes("پلان")) {
      botResponse = responses.investment_plans
    } else if (lowerMessage.includes("security") || lowerMessage.includes("محفوظ")) {
      botResponse = responses.account_security
    } else if (lowerMessage.includes("support") || lowerMessage.includes("سپورٹ")) {
      botResponse = responses.support_hours
    } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("سلام")) {
      botResponse = responses.greeting
    } else {
      botResponse = responses.platform_info
    }

    setTimeout(() => {
      const botMessage = {
        type: "bot",
        message: botResponse,
        timestamp: Date.now(),
      }
      setBotMessages((prev) => [...prev, botMessage])
      setBotLoading(false)
    }, 1000)

    setBotInput("")
  }

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const database = getDatabase()
      await update(ref(database, `notifications/${user?.uid}/${notificationId}`), {
        isRead: true,
      })
      loadNotifications()
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const database = getDatabase()
      await remove(ref(database, `notifications/${user?.uid}/${notificationId}`))
      loadNotifications()
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSection />
      case "investments":
        return <UserInvestments />
      case "transactions":
        return <TransactionHistory />
      case "password":
        return <ChangePasswordSection />
      case "notifications":
        return <NotificationsSection />
      case "help":
        return <HelpSection />
      case "settings":
        return <SettingsSection />
      case "admin":
        return <AdminPanel />
      default:
        return <MainSection />
    }
  }

  const MainSection = () => (
    <div className="space-y-4">
      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user?.username || "User"}</h2>
              <p className="text-blue-100 text-sm">{user?.email}</p>
              <div className="flex items-center mt-2">
                <Crown className="h-4 w-4 text-yellow-300 mr-1" />
                <span className="text-sm">Premium Member</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-white/80 text-xs">Balance</p>
              <p className="text-lg font-bold">₨{user?.balance?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-white/80 text-xs">Total Profit</p>
              <p className="text-lg font-bold text-green-300">₨{user?.total_profit?.toLocaleString() || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
          <DialogTrigger asChild>
            <Button className="h-16 bg-green-600 hover:bg-green-700 text-white flex flex-col items-center justify-center space-y-1">
              <CreditCard className="h-6 w-6" />
              <span className="text-sm font-medium">Deposit</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Make a Deposit</DialogTitle>
            </DialogHeader>
            <DepositForm onClose={() => setShowDepositDialog(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
          <DialogTrigger asChild>
            <Button className="h-16 bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center justify-center space-y-1">
              <Wallet className="h-6 w-6" />
              <span className="text-sm font-medium">Withdraw</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Withdraw Funds</DialogTitle>
            </DialogHeader>
            <WithdrawForm onClose={() => setShowWithdrawDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Menu Items */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => setActiveSection(item.section)}
                className="w-full p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center relative`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  {item.badge && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Help Bot */}
      <Card>
        <CardContent className="p-4">
          <Button
            onClick={() => setShowBot(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            <Bot className="h-4 w-4 mr-2" />
            Help Assistant (Bot)
          </Button>
        </CardContent>
      </Card>

      {/* Admin Panel Access */}
      {user?.is_admin && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => setActiveSection("admin")}>
              <Shield className="h-4 w-4 mr-2" />
              Admin Panel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Logout */}
      <Card>
        <CardContent className="p-4">
          <Button
            onClick={logout}
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const ChangePasswordSection = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="h-5 w-5 mr-2 text-orange-600" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Current Password</label>
            <input type="password" className="w-full p-3 border rounded-lg" placeholder="Enter current password" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">New Password</label>
            <input type="password" className="w-full p-3 border rounded-lg" placeholder="Enter new password" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Confirm New Password</label>
            <input type="password" className="w-full p-3 border rounded-lg" placeholder="Confirm new password" />
          </div>
          <Button className="w-full bg-orange-600 hover:bg-orange-700">Update Password</Button>
        </CardContent>
      </Card>
    </div>
  )

  const NotificationsSection = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-red-600" />
              Notifications
            </div>
            <Badge variant="secondary">{notifications.filter((n) => !n.isRead).length} unread</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.isRead ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {notification.type === "promotion" && <Gift className="h-4 w-4 text-green-600" />}
                      {notification.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                      {notification.type === "success" && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {notification.type === "info" && <Info className="h-4 w-4 text-blue-600" />}
                      {notification.type === "general" && <Megaphone className="h-4 w-4 text-gray-600" />}
                      <h3 className="font-medium text-gray-900">{notification.title}</h3>
                      {!notification.isRead && <Badge className="bg-red-500 text-white text-xs">New</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-400">{new Date(notification.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markNotificationAsRead(notification.id)}
                        className="h-8 w-8 p-0"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteNotification(notification.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )

  const HelpSection = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="h-5 w-5 mr-2 text-teal-600" />
            Help & Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Phone className="h-4 w-4 mr-2" />
              Call Support: {supportInfo.phone}
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Mail className="h-4 w-4 mr-2" />
              Email: {supportInfo.email}
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <HelpCircle className="h-4 w-4 mr-2" />
              FAQ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const SettingsSection = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2 text-gray-600" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Dark Mode</span>
            <Button variant="outline" size="sm">
              Toggle
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span>Language</span>
            <Button variant="outline" size="sm">
              English
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span>Currency</span>
            <Button variant="outline" size="sm">
              PKR
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header with back button for non-main sections */}
        {activeSection !== "main" && (
          <div className="flex items-center space-x-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => setActiveSection("main")} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">
              {activeSection === "admin"
                ? "Admin Panel"
                : menuItems.find((item) => item.section === activeSection)?.title || "Back"}
            </h1>
          </div>
        )}

        {renderContent()}
        {/* Help Bot Dialog */}
        <Dialog open={showBot} onOpenChange={setShowBot}>
          <DialogContent className="max-w-md h-[600px] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Bot className="h-5 w-5 mr-2 text-purple-600" />
                Help Assistant
              </DialogTitle>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={botLanguage === "en" ? "default" : "outline"}
                  onClick={() => setBotLanguage("en")}
                >
                  English
                </Button>
                <Button
                  size="sm"
                  variant={botLanguage === "ur" ? "default" : "outline"}
                  onClick={() => setBotLanguage("ur")}
                >
                  اردو
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-3 p-2">
              {botMessages.length === 0 && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-purple-800">{botResponses[botLanguage].greeting}</p>
                </div>
              )}

              {botMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    msg.type === "user" ? "bg-blue-500 text-white ml-8" : "bg-gray-100 text-gray-800 mr-8"
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                </div>
              ))}

              {botLoading && (
                <div className="bg-gray-100 p-3 rounded-lg mr-8">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    <span className="text-sm text-gray-600">Typing...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-2 border-t">
              <Input
                value={botInput}
                onChange={(e) => setBotInput(e.target.value)}
                placeholder={botLanguage === "en" ? "Ask me anything..." : "کچھ بھی پوچھیں..."}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && botInput.trim()) {
                    handleBotMessage(botInput.trim())
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={() => botInput.trim() && handleBotMessage(botInput.trim())}
                disabled={!botInput.trim() || botLoading}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-2">
              <p className="text-xs text-gray-500 text-center">
                {botLanguage === "en"
                  ? "Quick questions: investment, withdrawal, profit, referral, plans"
                  : "فوری سوالات: سرمایہ کاری، رقم نکالنا، منافع، ریفرل، پلانز"}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
