"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Eye,
  EyeOff,
  CreditCard,
  Settings,
  Smartphone,
  Building,
  Wallet,
  Globe,
  Shield,
  Database,
  BarChart3,
  FileText,
  Menu,
  X,
  Bell,
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { getDatabase, ref, get, update, push, remove } from "firebase/database"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface User {
  uid: string
  email: string
  username: string
  balance: number
  total_invested: number
  total_earned: number
  withdrawable_profit: number
  status: string
  created_at: number
  referral_code: string
  referred_by?: string
}

interface Deposit {
  id: string
  userId: string
  username: string
  email: string
  amount: number
  status: string
  timestamp: number
  method: string
  screenshot?: string
}

interface Withdrawal {
  id: string
  userId: string
  username: string
  email: string
  amount: number
  status: string
  timestamp: number
  method: string
  accountNumber: string
  accountHolder: string
}

interface InvestmentPlan {
  id: string
  name: string
  minAmount: number
  maxAmount: number
  dailyProfit: number
  duration: number
  description: string
  carImage: string
  carName: string
  category: string
  isActive: boolean
}

interface PaymentMethod {
  id: string
  name: string
  type: string
  accountNumber: string
  accountHolder: string
  isActive: boolean
  instructions: string
  qrCode?: string
}

interface AppSettings {
  appName: string
  appVersion: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  minDeposit: number
  minWithdraw: number
  referralBonus: number
  welcomeMessage: string
  supportEmail: string
  supportPhone: string
}

const carImages = {
  budget: [
    {
      name: "Honda City",
      url: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&h=300&fit=crop",
      description: "Perfect starter car for budget investments",
    },
    {
      name: "Suzuki Alto",
      url: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop",
      description: "Reliable and economical choice",
    },
    {
      name: "Toyota Vitz",
      url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop",
      description: "Compact and efficient",
    },
  ],
  medium: [
    {
      name: "Toyota Corolla",
      url: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop",
      description: "Most trusted sedan in Pakistan",
    },
    {
      name: "Honda Civic",
      url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop",
      description: "Premium performance and comfort",
    },
  ],
  premium: [
    {
      name: "BMW 3 Series",
      url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop",
      description: "Ultimate driving machine",
    },
    {
      name: "Mercedes C-Class",
      url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop",
      description: "Luxury redefined",
    },
  ],
  vip: [
    {
      name: "Mercedes S-Class",
      url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop",
      description: "The pinnacle of luxury",
    },
    {
      name: "Rolls Royce Ghost",
      url: "https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=400&h=300&fit=crop",
      description: "Ultimate luxury experience",
    },
  ],
}

export function AdminPanel() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [investmentPlans, setInvestmentPlans] = useState<InvestmentPlan[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [appSettings, setAppSettings] = useState<AppSettings>({
    appName: "Al-Arab Car Trade",
    appVersion: "1.0.0",
    maintenanceMode: false,
    registrationEnabled: true,
    minDeposit: 250,
    minWithdraw: 500,
    referralBonus: 50,
    welcomeMessage: "Welcome to Al-Arab Car Trade Investment Platform",
    supportEmail: "support@abcartrade.com",
    supportPhone: "+92-300-1234567",
  })
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [balanceUpdate, setBalanceUpdate] = useState("")
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null)
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null)
  const [selectedCarCategory, setSelectedCarCategory] = useState("budget")
  const [selectedCarIndex, setSelectedCarIndex] = useState(0)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const [showNotificationDialog, setShowNotificationDialog] = useState(false)
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "general",
    targetUsers: "all",
    template: "",
  })

  const notificationTemplates = {
    discount: {
      title: "🎉 Special Discount Offer!",
      message:
        "Get 20% extra profit on your next investment! Limited time offer. Invest now and maximize your returns.",
      type: "promotion",
    },
    withdrawal_restriction: {
      title: "⚠️ Withdrawal Restriction Notice",
      message:
        "Due to system maintenance, withdrawals will be temporarily restricted from [DATE] to [DATE]. We apologize for any inconvenience.",
      type: "warning",
    },
    bonus: {
      title: "💰 Bonus Credit Added!",
      message:
        "Congratulations! A bonus of ₨[AMOUNT] has been added to your account. Start investing to multiply your earnings!",
      type: "success",
    },
    maintenance: {
      title: "🔧 System Maintenance",
      message:
        "Our platform will undergo scheduled maintenance on [DATE] from [TIME] to [TIME]. Services may be temporarily unavailable.",
      type: "info",
    },
    investment_reminder: {
      title: "📈 Investment Opportunity",
      message:
        "Don't miss out! Your account balance is ready for investment. Check out our latest car trading plans with guaranteed returns.",
      type: "reminder",
    },
  }

  // Plan form state
  const [planForm, setPlanForm] = useState({
    name: "",
    minAmount: "",
    maxAmount: "",
    dailyProfit: "",
    duration: "",
    description: "",
    category: "budget",
    carName: "",
    carImage: "",
    isActive: true,
  })

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    name: "",
    type: "bank",
    accountNumber: "",
    accountHolder: "",
    instructions: "",
    isActive: true,
  })

  useEffect(() => {
    if (user?.is_admin) {
      loadAdminData()
    }
  }, [user])

  const loadAdminData = async () => {
    try {
      const database = getDatabase()

      // Load users
      const usersSnapshot = await get(ref(database, "users"))
      if (usersSnapshot.exists()) {
        const usersData = Object.entries(usersSnapshot.val()).map(([uid, data]: [string, any]) => ({
          uid,
          ...data,
        }))
        setUsers(usersData)
      }

      // Load deposits
      const depositsSnapshot = await get(ref(database, "deposits"))
      if (depositsSnapshot.exists()) {
        const depositsData = Object.entries(depositsSnapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }))
        setDeposits(depositsData.sort((a, b) => b.timestamp - a.timestamp))
      }

      // Load withdrawals
      const withdrawalsSnapshot = await get(ref(database, "withdrawals"))
      if (withdrawalsSnapshot.exists()) {
        const withdrawalsData = Object.entries(withdrawalsSnapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }))
        setWithdrawals(withdrawalsData.sort((a, b) => b.timestamp - a.timestamp))
      }

      // Load investment plans
      const plansSnapshot = await get(ref(database, "investmentPlans"))
      if (plansSnapshot.exists()) {
        const plansData = Object.entries(plansSnapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }))
        setInvestmentPlans(plansData)
      }

      // Load payment methods
      const paymentsSnapshot = await get(ref(database, "paymentMethods"))
      if (paymentsSnapshot.exists()) {
        const paymentsData = Object.entries(paymentsSnapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }))
        setPaymentMethods(paymentsData)
      }

      // Load app settings
      const settingsSnapshot = await get(ref(database, "appSettings"))
      if (settingsSnapshot.exists()) {
        setAppSettings({ ...appSettings, ...settingsSnapshot.val() })
      }
    } catch (error) {
      console.error("Error loading admin data:", error)
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDepositAction = async (depositId: string, action: "approve" | "reject") => {
    try {
      const database = getDatabase()
      const deposit = deposits.find((d) => d.id === depositId)
      if (!deposit) return

      await update(ref(database, `deposits/${depositId}`), {
        status: action === "approve" ? "approved" : "rejected",
      })

      if (action === "approve") {
        const userRef = ref(database, `users/${deposit.userId}`)
        const userSnapshot = await get(userRef)
        if (userSnapshot.exists()) {
          const userData = userSnapshot.val()
          await update(userRef, {
            balance: (userData.balance || 0) + deposit.amount,
          })
        }
      }

      toast({
        title: "Success",
        description: `Deposit ${action}d successfully`,
      })
      loadAdminData()
    } catch (error) {
      console.error("Error updating deposit:", error)
      toast({
        title: "Error",
        description: "Failed to update deposit",
        variant: "destructive",
      })
    }
  }

  const handleWithdrawalAction = async (withdrawalId: string, action: "approve" | "reject") => {
    try {
      const database = getDatabase()
      await update(ref(database, `withdrawals/${withdrawalId}`), {
        status: action === "approve" ? "approved" : "rejected",
      })

      toast({
        title: "Success",
        description: `Withdrawal ${action}d successfully`,
      })
      loadAdminData()
    } catch (error) {
      console.error("Error updating withdrawal:", error)
      toast({
        title: "Error",
        description: "Failed to update withdrawal",
        variant: "destructive",
      })
    }
  }

  const handleUserStatusToggle = async (userId: string, currentStatus: string) => {
    try {
      const database = getDatabase()
      const newStatus = currentStatus === "active" ? "suspended" : "active"
      await update(ref(database, `users/${userId}`), {
        status: newStatus,
      })

      toast({
        title: "Success",
        description: `User ${newStatus} successfully`,
      })
      loadAdminData()
    } catch (error) {
      console.error("Error updating user status:", error)
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      })
    }
  }

  const handleBalanceUpdate = async () => {
    if (!selectedUser || !balanceUpdate) return

    try {
      const database = getDatabase()
      const amount = Number.parseFloat(balanceUpdate)
      await update(ref(database, `users/${selectedUser.uid}`), {
        balance: amount,
      })

      toast({
        title: "Success",
        description: "Balance updated successfully",
      })
      setBalanceUpdate("")
      setSelectedUser(null)
      loadAdminData()
    } catch (error) {
      console.error("Error updating balance:", error)
      toast({
        title: "Error",
        description: "Failed to update balance",
        variant: "destructive",
      })
    }
  }

  const handlePlanSubmit = async () => {
    try {
      const database = getDatabase()
      const selectedCar = carImages[selectedCarCategory as keyof typeof carImages][selectedCarIndex]

      const planData = {
        name: planForm.name,
        minAmount: Number.parseFloat(planForm.minAmount),
        maxAmount: Number.parseFloat(planForm.maxAmount),
        dailyProfit: Number.parseFloat(planForm.dailyProfit),
        duration: Number.parseInt(planForm.duration),
        description: planForm.description,
        category: selectedCarCategory,
        carName: selectedCar.name,
        carImage: selectedCar.url,
        isActive: planForm.isActive,
        createdAt: Date.now(),
      }

      if (editingPlan) {
        await update(ref(database, `investmentPlans/${editingPlan.id}`), planData)
        toast({
          title: "Success",
          description: "Investment plan updated successfully",
        })
      } else {
        await push(ref(database, "investmentPlans"), planData)
        toast({
          title: "Success",
          description: "Investment plan created successfully",
        })
      }

      setShowPlanDialog(false)
      setEditingPlan(null)
      resetPlanForm()
      loadAdminData()
    } catch (error) {
      console.error("Error saving plan:", error)
      toast({
        title: "Error",
        description: "Failed to save investment plan",
        variant: "destructive",
      })
    }
  }

  const handlePaymentSubmit = async () => {
    try {
      const database = getDatabase()

      const paymentData = {
        name: paymentForm.name,
        type: paymentForm.type,
        accountNumber: paymentForm.accountNumber,
        accountHolder: paymentForm.accountHolder,
        instructions: paymentForm.instructions,
        isActive: paymentForm.isActive,
        createdAt: Date.now(),
      }

      if (editingPayment) {
        await update(ref(database, `paymentMethods/${editingPayment.id}`), paymentData)
        toast({
          title: "Success",
          description: "Payment method updated successfully",
        })
      } else {
        await push(ref(database, "paymentMethods"), paymentData)
        toast({
          title: "Success",
          description: "Payment method created successfully",
        })
      }

      setShowPaymentDialog(false)
      setEditingPayment(null)
      resetPaymentForm()
      loadAdminData()
    } catch (error) {
      console.error("Error saving payment method:", error)
      toast({
        title: "Error",
        description: "Failed to save payment method",
        variant: "destructive",
      })
    }
  }

  const handleSettingsUpdate = async () => {
    try {
      const database = getDatabase()
      await update(ref(database, "appSettings"), appSettings)
      toast({
        title: "Success",
        description: "Settings updated successfully",
      })
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
    }
  }

  const handlePlanDelete = async (planId: string) => {
    try {
      const database = getDatabase()
      await remove(ref(database, `investmentPlans/${planId}`))
      toast({
        title: "Success",
        description: "Investment plan deleted successfully",
      })
      loadAdminData()
    } catch (error) {
      console.error("Error deleting plan:", error)
      toast({
        title: "Error",
        description: "Failed to delete investment plan",
        variant: "destructive",
      })
    }
  }

  const handlePaymentDelete = async (paymentId: string) => {
    try {
      const database = getDatabase()
      await remove(ref(database, `paymentMethods/${paymentId}`))
      toast({
        title: "Success",
        description: "Payment method deleted successfully",
      })
      loadAdminData()
    } catch (error) {
      console.error("Error deleting payment method:", error)
      toast({
        title: "Error",
        description: "Failed to delete payment method",
        variant: "destructive",
      })
    }
  }

  const handlePlanToggle = async (planId: string, currentStatus: boolean) => {
    try {
      const database = getDatabase()
      await update(ref(database, `investmentPlans/${planId}`), {
        isActive: !currentStatus,
      })
      toast({
        title: "Success",
        description: `Plan ${!currentStatus ? "activated" : "deactivated"} successfully`,
      })
      loadAdminData()
    } catch (error) {
      console.error("Error toggling plan:", error)
      toast({
        title: "Error",
        description: "Failed to toggle plan status",
        variant: "destructive",
      })
    }
  }

  const handlePaymentToggle = async (paymentId: string, currentStatus: boolean) => {
    try {
      const database = getDatabase()
      await update(ref(database, `paymentMethods/${paymentId}`), {
        isActive: !currentStatus,
      })
      toast({
        title: "Success",
        description: `Payment method ${!currentStatus ? "activated" : "deactivated"} successfully`,
      })
      loadAdminData()
    } catch (error) {
      console.error("Error toggling payment method:", error)
      toast({
        title: "Error",
        description: "Failed to toggle payment method status",
        variant: "destructive",
      })
    }
  }

  const resetPlanForm = () => {
    setPlanForm({
      name: "",
      minAmount: "",
      maxAmount: "",
      dailyProfit: "",
      duration: "",
      description: "",
      category: "budget",
      carName: "",
      carImage: "",
      isActive: true,
    })
    setSelectedCarCategory("budget")
    setSelectedCarIndex(0)
  }

  const resetPaymentForm = () => {
    setPaymentForm({
      name: "",
      type: "bank",
      accountNumber: "",
      accountHolder: "",
      instructions: "",
      isActive: true,
    })
  }

  const openEditPayment = (payment: PaymentMethod) => {
    setEditingPayment(payment)
    setPaymentForm({
      name: payment.name,
      type: payment.type,
      accountNumber: payment.accountNumber,
      accountHolder: payment.accountHolder,
      instructions: payment.instructions,
      isActive: payment.isActive,
    })
    setShowPaymentDialog(true)
  }

  const openEditPlan = (plan: InvestmentPlan) => {
    setEditingPlan(plan)
    setPlanForm({
      name: plan.name,
      minAmount: plan.minAmount.toString(),
      maxAmount: plan.maxAmount.toString(),
      dailyProfit: plan.dailyProfit.toString(),
      duration: plan.duration.toString(),
      description: plan.description,
      category: plan.category,
      carName: plan.carName,
      carImage: plan.carImage,
      isActive: plan.isActive,
    })
    setSelectedCarCategory(plan.category)

    // Find the correct car index based on the plan's car name
    const categoryCars = carImages[plan.category as keyof typeof carImages]
    const carIndex = categoryCars.findIndex((car) => car.name === plan.carName)
    setSelectedCarIndex(carIndex >= 0 ? carIndex : 0)

    setShowPlanDialog(true)
  }

  const handleNotificationSubmit = async () => {
    try {
      const database = getDatabase()

      const notificationData = {
        title: notificationForm.title,
        message: notificationForm.message,
        type: notificationForm.type,
        targetUsers: notificationForm.targetUsers,
        timestamp: Date.now(),
        isRead: false,
        sentBy: user.uid,
        sentByName: user.username,
      }

      if (notificationForm.targetUsers === "all") {
        // Send to all users
        const usersSnapshot = await get(ref(database, "users"))
        if (usersSnapshot.exists()) {
          const promises = Object.keys(usersSnapshot.val()).map((userId) =>
            push(ref(database, `notifications/${userId}`), notificationData),
          )
          await Promise.all(promises)
        }
      } else {
        // Send to specific user
        await push(ref(database, `notifications/${notificationForm.targetUsers}`), notificationData)
      }

      toast({
        title: "Success",
        description: "Notification sent successfully",
      })

      setShowNotificationDialog(false)
      setNotificationForm({
        title: "",
        message: "",
        type: "general",
        targetUsers: "all",
        template: "",
      })
    } catch (error) {
      console.error("Error sending notification:", error)
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      })
    }
  }

  const applyNotificationTemplate = (templateKey: string) => {
    const template = notificationTemplates[templateKey as keyof typeof notificationTemplates]
    if (template) {
      setNotificationForm({
        ...notificationForm,
        title: template.title,
        message: template.message,
        type: template.type,
        template: templateKey,
      })
    }
  }

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center">
        <Alert className="max-w-md bg-red-500/20 border-red-400/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-200">Access denied. Admin privileges required.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center">
        <div className="text-white text-xl">Loading admin panel...</div>
      </div>
    )
  }

  const totalUsers = users.length
  const totalDeposits = deposits.reduce((sum, d) => sum + (d.status === "approved" ? d.amount : 0), 0)
  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + (w.status === "approved" ? w.amount : 0), 0)
  const pendingDeposits = deposits.filter((d) => d.status === "pending").length
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending").length

  const adminMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "deposits", label: "Deposits", icon: TrendingUp },
    { id: "withdrawals", label: "Withdrawals", icon: DollarSign },
    { id: "plans", label: "Investment Plans", icon: FileText },
    { id: "payments", label: "Payment Methods", icon: CreditCard },
    { id: "settings", label: "App Settings", icon: Settings },
    { id: "analytics", label: "Analytics", icon: Database },
    { id: "notifications", label: "Send Notifications", icon: Bell },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-purple-700">
      {/* Mobile Header */}
      <div className="lg:hidden bg-black/20 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Shield className="w-4 h-4 text-black" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            <p className="text-xs text-gray-300">Management Dashboard</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowMobileMenu(!showMobileMenu)} className="text-white">
          {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50">
          <div className="bg-gradient-to-b from-red-600 to-purple-700 w-64 h-full shadow-lg overflow-y-auto">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Admin Panel</h2>
                  <p className="text-sm text-gray-300">{user.username}</p>
                </div>
              </div>
            </div>

            <div className="p-2">
              {adminMenuItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start mb-1 text-white hover:bg-white/10"
                  onClick={() => {
                    // Handle menu item click
                    setShowMobileMenu(false)
                  }}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col bg-black/20 backdrop-blur-md border-r border-white/10">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <h2 className="font-bold text-white">Admin Panel</h2>
                <p className="text-sm text-gray-300">Management Dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              {adminMenuItems.map((item) => (
                <Button key={item.id} variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-white">🔧 Admin Panel</h1>
              <p className="text-gray-200">Manage users, transactions, and investment plans</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-black/40 backdrop-blur-md border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="text-gray-300 text-sm">Total Users</p>
                      <p className="text-white text-xl font-bold">{totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-md border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-gray-300 text-sm">Total Deposits</p>
                      <p className="text-white text-xl font-bold">₨{totalDeposits.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-md border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-8 h-8 text-red-400" />
                    <div>
                      <p className="text-gray-300 text-sm">Total Withdrawals</p>
                      <p className="text-white text-xl font-bold">₨{totalWithdrawals.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="users" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 bg-black/40 backdrop-blur-md">
                <TabsTrigger
                  value="users"
                  className="text-white data-[state=active]:bg-white/20"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Users
                </TabsTrigger>
                <TabsTrigger
                  value="deposits"
                  className="text-white data-[state=active]:bg-white/20"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Deposits ({pendingDeposits})
                </TabsTrigger>
                <TabsTrigger
                  value="withdrawals"
                  className="text-white data-[state=active]:bg-white/20"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Withdrawals ({pendingWithdrawals})
                </TabsTrigger>
                <TabsTrigger
                  value="plans"
                  className="text-white data-[state=active]:bg-white/20"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Plans
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="text-white data-[state=active]:bg-white/20"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Payments
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="text-white data-[state=active]:bg-white/20"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Settings
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="text-white data-[state=active]:bg-white/20"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Notifications
                </TabsTrigger>
              </TabsList>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-4">
                <div className="grid gap-4">
                  {users.map((user) => (
                    <Card key={user.uid} className="bg-black/40 backdrop-blur-md border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-white font-medium">{user.username}</h3>
                              <Badge
                                variant={user.status === "active" ? "default" : "destructive"}
                                className={
                                  user.status === "active"
                                    ? "bg-green-500/20 text-green-400 border-green-400/30"
                                    : "bg-red-500/20 text-red-400 border-red-400/30"
                                }
                              >
                                {user.status}
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm">{user.email}</p>
                            <div className="flex space-x-4 text-sm">
                              <span className="text-gray-300">Balance: ₨{user.balance?.toLocaleString() || "0"}</span>
                              <span className="text-gray-300">
                                Invested: ₨{user.total_invested?.toLocaleString() || "0"}
                              </span>
                              <span className="text-gray-300">
                                Earned: ₨{user.total_earned?.toLocaleString() || "0"}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUser(user)}
                              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={user.status === "active" ? "destructive" : "default"}
                              onClick={() => handleUserStatusToggle(user.uid, user.status)}
                              className={
                                user.status === "active"
                                  ? "bg-red-500/20 text-red-400 border-red-400/30 hover:bg-red-500/30"
                                  : "bg-green-500/20 text-green-400 border-green-400/30 hover:bg-green-500/30"
                              }
                            >
                              {user.status === "active" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Deposits Tab */}
              <TabsContent value="deposits" className="space-y-4">
                <div className="grid gap-4">
                  {deposits.map((deposit) => (
                    <Card key={deposit.id} className="bg-black/40 backdrop-blur-md border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-white font-medium">{deposit.username}</h3>
                              <Badge
                                variant={
                                  deposit.status === "approved"
                                    ? "default"
                                    : deposit.status === "rejected"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className={
                                  deposit.status === "approved"
                                    ? "bg-green-500/20 text-green-400 border-green-400/30"
                                    : deposit.status === "rejected"
                                      ? "bg-red-500/20 text-red-400 border-red-400/30"
                                      : "bg-yellow-500/20 text-yellow-400 border-yellow-400/30"
                                }
                              >
                                {deposit.status}
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm">{deposit.email}</p>
                            <div className="flex space-x-4 text-sm">
                              <span className="text-gray-300">Amount: ₨{deposit.amount.toLocaleString()}</span>
                              <span className="text-gray-300">Method: {deposit.method}</span>
                              <span className="text-gray-300">
                                Date: {new Date(deposit.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {deposit.status === "pending" && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleDepositAction(deposit.id, "approve")}
                                className="bg-green-500/20 text-green-400 border-green-400/30 hover:bg-green-500/30"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDepositAction(deposit.id, "reject")}
                                className="bg-red-500/20 text-red-400 border-red-400/30 hover:bg-red-500/30"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Withdrawals Tab */}
              <TabsContent value="withdrawals" className="space-y-4">
                <div className="grid gap-4">
                  {withdrawals.map((withdrawal) => (
                    <Card key={withdrawal.id} className="bg-black/40 backdrop-blur-md border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-white font-medium">{withdrawal.username}</h3>
                              <Badge
                                variant={
                                  withdrawal.status === "approved"
                                    ? "default"
                                    : withdrawal.status === "rejected"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className={
                                  withdrawal.status === "approved"
                                    ? "bg-green-500/20 text-green-400 border-green-400/30"
                                    : withdrawal.status === "rejected"
                                      ? "bg-red-500/20 text-red-400 border-red-400/30"
                                      : "bg-yellow-500/20 text-yellow-400 border-yellow-400/30"
                                }
                              >
                                {withdrawal.status}
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm">{withdrawal.email}</p>
                            <div className="flex space-x-4 text-sm">
                              <span className="text-gray-300">Amount: ₨{withdrawal.amount.toLocaleString()}</span>
                              <span className="text-gray-300">Account: {withdrawal.accountNumber}</span>
                              <span className="text-gray-300">Holder: {withdrawal.accountHolder}</span>
                            </div>
                          </div>
                          {withdrawal.status === "pending" && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleWithdrawalAction(withdrawal.id, "approve")}
                                className="bg-green-500/20 text-green-400 border-green-400/30 hover:bg-green-500/30"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleWithdrawalAction(withdrawal.id, "reject")}
                                className="bg-red-500/20 text-red-400 border-red-400/30 hover:bg-red-500/30"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Investment Plans Tab */}
              <TabsContent value="plans" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Investment Plans</h2>
                  <Button
                    onClick={() => {
                      resetPlanForm()
                      setShowPlanDialog(true)
                    }}
                    className="bg-gradient-to-r from-green-400 to-green-500 text-black"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Plan
                  </Button>
                </div>

                <div className="grid gap-4">
                  {investmentPlans.map((plan) => (
                    <Card key={plan.id} className="bg-black/40 backdrop-blur-md border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <div className="relative w-20 h-16 rounded-lg overflow-hidden">
                            <Image
                              src={plan.carImage || "/placeholder.svg"}
                              alt={plan.carName}
                              fill
                              className="object-cover"
                              sizes="(max-width: 80px) 100vw, 80px"
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-white font-medium">{plan.name}</h3>
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">{plan.category}</Badge>
                              <Badge
                                variant={plan.isActive ? "default" : "destructive"}
                                className={
                                  plan.isActive
                                    ? "bg-green-500/20 text-green-400 border-green-400/30"
                                    : "bg-red-500/20 text-red-400 border-red-400/30"
                                }
                              >
                                {plan.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm">{plan.carName}</p>
                            <div className="flex space-x-4 text-sm">
                              <span className="text-gray-300">
                                Range: ₨{plan.minAmount.toLocaleString()} - ₨{plan.maxAmount.toLocaleString()}
                              </span>
                              <span className="text-gray-300">Daily: {plan.dailyProfit}%</span>
                              <span className="text-gray-300">Duration: {plan.duration} days</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditPlan(plan)}
                              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={plan.isActive ? "destructive" : "default"}
                              onClick={() => handlePlanToggle(plan.id, plan.isActive)}
                              className={
                                plan.isActive
                                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-400/30 hover:bg-yellow-500/30"
                                  : "bg-green-500/20 text-green-400 border-green-400/30 hover:bg-green-500/30"
                              }
                            >
                              {plan.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handlePlanDelete(plan.id)}
                              className="bg-red-500/20 text-red-400 border-red-400/30 hover:bg-red-500/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Payment Methods Tab */}
              <TabsContent value="payments" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Payment Methods</h2>
                  <Button
                    onClick={() => {
                      resetPaymentForm()
                      setShowPaymentDialog(true)
                    }}
                    className="bg-gradient-to-r from-blue-400 to-blue-500 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>

                <div className="grid gap-4">
                  {paymentMethods.map((payment) => (
                    <Card key={payment.id} className="bg-black/40 backdrop-blur-md border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                {payment.type === "bank" && <Building className="w-4 h-4 text-white" />}
                                {payment.type === "mobile" && <Smartphone className="w-4 h-4 text-white" />}
                                {payment.type === "wallet" && <Wallet className="w-4 h-4 text-white" />}
                                {payment.type === "crypto" && <Globe className="w-4 h-4 text-white" />}
                              </div>
                              <h3 className="text-white font-medium">{payment.name}</h3>
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/30">
                                {payment.type}
                              </Badge>
                              <Badge
                                variant={payment.isActive ? "default" : "destructive"}
                                className={
                                  payment.isActive
                                    ? "bg-green-500/20 text-green-400 border-green-400/30"
                                    : "bg-red-500/20 text-red-400 border-red-400/30"
                                }
                              >
                                {payment.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm">Account: {payment.accountNumber}</p>
                            <p className="text-gray-400 text-sm">Holder: {payment.accountHolder}</p>
                            <p className="text-gray-300 text-sm">{payment.instructions}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditPayment(payment)}
                              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={payment.isActive ? "destructive" : "default"}
                              onClick={() => handlePaymentToggle(payment.id, payment.isActive)}
                              className={
                                payment.isActive
                                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-400/30 hover:bg-yellow-500/30"
                                  : "bg-green-500/20 text-green-400 border-green-400/30 hover:bg-green-500/30"
                              }
                            >
                              {payment.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handlePaymentDelete(payment.id)}
                              className="bg-red-500/20 text-red-400 border-red-400/30 hover:bg-red-500/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <Card className="bg-black/40 backdrop-blur-md border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>App Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">App Name</Label>
                        <Input
                          value={appSettings.appName}
                          onChange={(e) => setAppSettings({ ...appSettings, appName: e.target.value })}
                          className="mt-1 bg-black/40 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">App Version</Label>
                        <Input
                          value={appSettings.appVersion}
                          onChange={(e) => setAppSettings({ ...appSettings, appVersion: e.target.value })}
                          className="mt-1 bg-black/40 border-gray-600 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-300">Min Deposit (₨)</Label>
                        <Input
                          type="number"
                          value={appSettings.minDeposit}
                          onChange={(e) => setAppSettings({ ...appSettings, minDeposit: Number(e.target.value) })}
                          className="mt-1 bg-black/40 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Min Withdraw (₨)</Label>
                        <Input
                          type="number"
                          value={appSettings.minWithdraw}
                          onChange={(e) => setAppSettings({ ...appSettings, minWithdraw: Number(e.target.value) })}
                          className="mt-1 bg-black/40 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Referral Bonus (₨)</Label>
                        <Input
                          type="number"
                          value={appSettings.referralBonus}
                          onChange={(e) => setAppSettings({ ...appSettings, referralBonus: Number(e.target.value) })}
                          className="mt-1 bg-black/40 border-gray-600 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Support Email</Label>
                        <Input
                          type="email"
                          value={appSettings.supportEmail}
                          onChange={(e) => setAppSettings({ ...appSettings, supportEmail: e.target.value })}
                          className="mt-1 bg-black/40 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Support Phone</Label>
                        <Input
                          value={appSettings.supportPhone}
                          onChange={(e) => setAppSettings({ ...appSettings, supportPhone: e.target.value })}
                          className="mt-1 bg-black/40 border-gray-600 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-300">Welcome Message</Label>
                      <Textarea
                        value={appSettings.welcomeMessage}
                        onChange={(e) => setAppSettings({ ...appSettings, welcomeMessage: e.target.value })}
                        className="mt-1 bg-black/40 border-gray-600 text-white"
                        rows={3}
                      />
                    </div>

                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">Maintenance Mode</Label>
                          <p className="text-sm text-gray-400">Enable to put app in maintenance mode</p>
                        </div>
                        <Switch
                          checked={appSettings.maintenanceMode}
                          onCheckedChange={(checked) => setAppSettings({ ...appSettings, maintenanceMode: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">Registration Enabled</Label>
                          <p className="text-sm text-gray-400">Allow new user registrations</p>
                        </div>
                        <Switch
                          checked={appSettings.registrationEnabled}
                          onCheckedChange={(checked) =>
                            setAppSettings({ ...appSettings, registrationEnabled: checked })
                          }
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSettingsUpdate}
                      className="bg-gradient-to-r from-green-400 to-green-500 text-black"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Update Settings
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Send Notifications</h2>
                  <Button
                    onClick={() => setShowNotificationDialog(true)}
                    className="bg-gradient-to-r from-purple-400 to-purple-500 text-white"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Send Notification
                  </Button>
                </div>

                <div className="grid gap-4">
                  <Card className="bg-black/40 backdrop-blur-md border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Quick Templates</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(notificationTemplates).map(([key, template]) => (
                        <Button
                          key={key}
                          variant="outline"
                          onClick={() => {
                            applyNotificationTemplate(key)
                            setShowNotificationDialog(true)
                          }}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-left h-auto p-3"
                        >
                          <div>
                            <div className="font-medium text-sm">{template.title}</div>
                            <div className="text-xs text-gray-300 mt-1 line-clamp-2">{template.message}</div>
                          </div>
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Balance Update Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
              <DialogContent className="max-w-md bg-gray-900 border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle>Update User Balance</DialogTitle>
                </DialogHeader>
                {selectedUser && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400">User: {selectedUser.username}</p>
                      <p className="text-sm text-gray-400">
                        Current Balance: ₨{selectedUser.balance?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-300">New Balance</Label>
                      <Input
                        type="number"
                        value={balanceUpdate}
                        onChange={(e) => setBalanceUpdate(e.target.value)}
                        placeholder="Enter new balance"
                        className="mt-1 bg-black/40 border-gray-600 text-white"
                      />
                    </div>
                    <Button
                      onClick={handleBalanceUpdate}
                      className="w-full bg-gradient-to-r from-green-400 to-green-500"
                    >
                      Update Balance
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Investment Plan Dialog */}
            <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
              <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingPlan ? "Edit" : "Create"} Investment Plan</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-300">Plan Name</Label>
                      <Input
                        value={planForm.name}
                        onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                        placeholder="e.g., Budget Car Plan"
                        className="mt-1 bg-black/40 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-300">Category</Label>
                      <Select
                        value={selectedCarCategory}
                        onValueChange={(value) => {
                          setSelectedCarCategory(value)
                          setSelectedCarIndex(0)
                        }}
                      >
                        <SelectTrigger className="mt-1 bg-black/40 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="budget">Budget (₨10K-50K)</SelectItem>
                          <SelectItem value="medium">Medium (₨50K-200K)</SelectItem>
                          <SelectItem value="premium">Premium (₨200K-500K)</SelectItem>
                          <SelectItem value="vip">VIP (₨500K+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-300">Min Amount (₨)</Label>
                      <Input
                        type="number"
                        value={planForm.minAmount}
                        onChange={(e) => setPlanForm({ ...planForm, minAmount: e.target.value })}
                        placeholder="10000"
                        className="mt-1 bg-black/40 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-300">Max Amount (₨)</Label>
                      <Input
                        type="number"
                        value={planForm.maxAmount}
                        onChange={(e) => setPlanForm({ ...planForm, maxAmount: e.target.value })}
                        placeholder="50000"
                        className="mt-1 bg-black/40 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-300">Daily Profit (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={planForm.dailyProfit}
                        onChange={(e) => setPlanForm({ ...planForm, dailyProfit: e.target.value })}
                        placeholder="2.5"
                        className="mt-1 bg-black/40 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-300">Duration (Days)</Label>
                      <Input
                        type="number"
                        value={planForm.duration}
                        onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })}
                        placeholder="30"
                        className="mt-1 bg-black/40 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-300">Description</Label>
                    <Textarea
                      value={planForm.description}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      placeholder="Describe the investment plan..."
                      className="mt-1 bg-black/40 border-gray-600 text-white"
                      rows={3}
                    />
                  </div>

                  {/* Car Selection */}
                  <div>
                    <Label className="text-sm font-medium text-gray-300 mb-3 block">Select Car</Label>
                    <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                      {carImages[selectedCarCategory as keyof typeof carImages].map((car, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedCarIndex(index)}
                          className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            selectedCarIndex === index
                              ? "border-green-400 ring-2 ring-green-400/50"
                              : "border-gray-600 hover:border-gray-500"
                          }`}
                        >
                          <div className="relative h-24">
                            <Image
                              src={car.url || "/placeholder.svg"}
                              alt={car.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 200px) 100vw, 200px"
                            />
                            {selectedCarIndex === index && (
                              <div className="absolute inset-0 bg-green-400/20 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-400" />
                              </div>
                            )}
                          </div>
                          <div className="p-2 bg-black/60">
                            <p className="text-white text-sm font-medium">{car.name}</p>
                            <p className="text-gray-400 text-xs">{car.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowPlanDialog(false)}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePlanSubmit}
                      className="bg-gradient-to-r from-green-400 to-green-500 text-black"
                    >
                      {editingPlan ? "Update" : "Create"} Plan
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Payment Method Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogContent className="max-w-md bg-gray-900 border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle>{editingPayment ? "Edit" : "Create"} Payment Method</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Payment Name</Label>
                    <Input
                      value={paymentForm.name}
                      onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })}
                      placeholder="e.g., JazzCash, EasyPaisa, Bank Transfer"
                      className="mt-1 bg-black/40 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-300">Payment Type</Label>
                    <Select
                      value={paymentForm.type}
                      onValueChange={(value) => setPaymentForm({ ...paymentForm, type: value })}
                    >
                      <SelectTrigger className="mt-1 bg-black/40 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="mobile">Mobile Wallet</SelectItem>
                        <SelectItem value="wallet">Digital Wallet</SelectItem>
                        <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-300">Account Number</Label>
                    <Input
                      value={paymentForm.accountNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })}
                      placeholder="Account number or wallet ID"
                      className="mt-1 bg-black/40 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-300">Account Holder</Label>
                    <Input
                      value={paymentForm.accountHolder}
                      onChange={(e) => setPaymentForm({ ...paymentForm, accountHolder: e.target.value })}
                      placeholder="Account holder name"
                      className="mt-1 bg-black/40 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-300">Instructions</Label>
                    <Textarea
                      value={paymentForm.instructions}
                      onChange={(e) => setPaymentForm({ ...paymentForm, instructions: e.target.value })}
                      placeholder="Payment instructions for users..."
                      className="mt-1 bg-black/40 border-gray-600 text-white"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={paymentForm.isActive}
                      onCheckedChange={(checked) => setPaymentForm({ ...paymentForm, isActive: checked })}
                    />
                    <Label className="text-sm text-gray-300">Active</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowPaymentDialog(false)}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePaymentSubmit}
                      className="bg-gradient-to-r from-blue-400 to-blue-500 text-white"
                    >
                      {editingPayment ? "Update" : "Create"} Payment Method
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Notification Dialog */}
            <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
              <DialogContent className="max-w-md bg-gray-900 border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle>Send Notification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Template</Label>
                    <Select
                      value={notificationForm.template}
                      onValueChange={(value) => applyNotificationTemplate(value)}
                    >
                      <SelectTrigger className="mt-1 bg-black/40 border-gray-600 text-white">
                        <SelectValue placeholder="Choose template (optional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="">Custom Message</SelectItem>
                        {Object.entries(notificationTemplates).map(([key, template]) => (
                          <SelectItem key={key} value={key}>
                            {template.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-300">Title</Label>
                    <Input
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                      placeholder="Notification title"
                      className="mt-1 bg-black/40 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-300">Message</Label>
                    <Textarea
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                      placeholder="Notification message"
                      className="mt-1 bg-black/40 border-gray-600 text-white"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-300">Type</Label>
                    <Select
                      value={notificationForm.type}
                      onValueChange={(value) => setNotificationForm({ ...notificationForm, type: value })}
                    >
                      <SelectTrigger className="mt-1 bg-black/40 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-300">Send To</Label>
                    <Select
                      value={notificationForm.targetUsers}
                      onValueChange={(value) => setNotificationForm({ ...notificationForm, targetUsers: value })}
                    >
                      <SelectTrigger className="mt-1 bg-black/40 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="all">All Users</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.uid} value={user.uid}>
                            {user.username} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowNotificationDialog(false)}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleNotificationSubmit}
                      className="bg-gradient-to-r from-purple-400 to-purple-500 text-white"
                    >
                      Send Notification
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
