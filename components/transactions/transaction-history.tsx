"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  DollarSign,
  Calendar,
  Eye,
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { getDatabase, ref, onValue, off } from "firebase/database"

interface Transaction {
  id: string
  type: "deposit" | "withdrawal" | "investment" | "profit"
  amount: number
  status: "pending" | "completed" | "failed" | "cancelled"
  timestamp: number
  description?: string
  method?: string
  planName?: string
  accountNumber?: string
  walletType?: string
  accountHolder?: string
}

export function TransactionHistory() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [summary, setSummary] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalInvestments: 0,
    pendingAmount: 0,
  })

  useEffect(() => {
    if (user?.uid) {
      setupRealTimeTransactionTracking()
    }

    return () => {
      cleanupListeners()
    }
  }, [user])

  useEffect(() => {
    calculateSummary()
  }, [transactions])

  const setupRealTimeTransactionTracking = async () => {
    if (!user?.uid) return

    setLoading(true)
    const database = getDatabase()
    const allTransactions: Transaction[] = []

    try {
      // Load deposits
      const depositsRef = ref(database, "deposits")
      onValue(depositsRef, (snapshot) => {
        if (snapshot.exists()) {
          const depositsData = Object.entries(snapshot.val())
            .filter(([_, deposit]: [string, any]) => deposit.userId === user.uid)
            .map(([id, deposit]: [string, any]) => ({
              id,
              type: "deposit" as const,
              amount: deposit.amount,
              status: deposit.status,
              timestamp: deposit.timestamp,
              method: deposit.method,
              description: `Deposit via ${deposit.method}`,
            }))
          updateTransactionsList("deposits", depositsData)
        }
      })

      // Load withdrawals
      const withdrawalsRef = ref(database, "withdrawals")
      onValue(withdrawalsRef, (snapshot) => {
        if (snapshot.exists()) {
          const withdrawalsData = Object.entries(snapshot.val())
            .filter(([_, withdrawal]: [string, any]) => withdrawal.userId === user.uid)
            .map(([id, withdrawal]: [string, any]) => ({
              id,
              type: "withdrawal" as const,
              amount: withdrawal.amount,
              status: withdrawal.status,
              timestamp: withdrawal.timestamp,
              method: withdrawal.method,
              walletType: withdrawal.walletType,
              accountNumber: withdrawal.accountNumber,
              accountHolder: withdrawal.accountHolder,
              description: `Withdrawal to ${withdrawal.walletType}`,
            }))
          updateTransactionsList("withdrawals", withdrawalsData)
        }
      })

      // Load investments
      const investmentsRef = ref(database, `investments/${user.uid}`)
      onValue(investmentsRef, (snapshot) => {
        if (snapshot.exists()) {
          const investmentsData = Object.entries(snapshot.val()).map(([id, investment]: [string, any]) => ({
            id,
            type: "investment" as const,
            amount: investment.amount,
            status: "completed" as const,
            timestamp: investment.startDate,
            planName: investment.planName,
            description: `Investment in ${investment.planName} plan`,
          }))
          updateTransactionsList("investments", investmentsData)
        }
      })

      // Load profit claims (if any)
      const profitsRef = ref(database, `profits/${user.uid}`)
      onValue(profitsRef, (snapshot) => {
        if (snapshot.exists()) {
          const profitsData = Object.entries(snapshot.val()).map(([id, profit]: [string, any]) => ({
            id,
            type: "profit" as const,
            amount: profit.amount,
            status: "completed" as const,
            timestamp: profit.timestamp,
            planName: profit.planName,
            description: `Profit from ${profit.planName}`,
          }))
          updateTransactionsList("profits", profitsData)
        }
      })
    } catch (error) {
      console.error("Error setting up real-time tracking:", error)
    } finally {
      setLoading(false)
    }
  }

  const transactionStore: { [key: string]: Transaction[] } = {}

  const updateTransactionsList = (type: string, data: Transaction[]) => {
    transactionStore[type] = data
    const allTransactions = Object.values(transactionStore)
      .flat()
      .sort((a, b) => b.timestamp - a.timestamp)
    setTransactions(allTransactions)
  }

  const cleanupListeners = () => {
    if (!user?.uid) return
    const database = getDatabase()
    off(ref(database, "deposits"))
    off(ref(database, "withdrawals"))
    off(ref(database, `investments/${user.uid}`))
    off(ref(database, `profits/${user.uid}`))
  }

  const calculateSummary = () => {
    const summary = transactions.reduce(
      (acc, transaction) => {
        switch (transaction.type) {
          case "deposit":
            if (transaction.status === "completed") {
              acc.totalDeposits += transaction.amount
            } else if (transaction.status === "pending") {
              acc.pendingAmount += transaction.amount
            }
            break
          case "withdrawal":
            if (transaction.status === "completed") {
              acc.totalWithdrawals += transaction.amount
            } else if (transaction.status === "pending") {
              acc.pendingAmount += transaction.amount
            }
            break
          case "investment":
            acc.totalInvestments += transaction.amount
            break
        }
        return acc
      },
      { totalDeposits: 0, totalWithdrawals: 0, totalInvestments: 0, pendingAmount: 0 },
    )
    setSummary(summary)
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.planName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.method?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter
    const matchesType = typeFilter === "all" || transaction.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownCircle className="h-4 w-4 text-green-500" />
      case "withdrawal":
        return <ArrowUpCircle className="h-4 w-4 text-red-500" />
      case "investment":
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      case "profit":
        return <DollarSign className="h-4 w-4 text-purple-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const refreshTransactions = () => {
    if (user?.uid) {
      setupRealTimeTransactionTracking()
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Transaction History</h2>
          <p className="text-xs text-gray-600">Loading transactions...</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-1">📊 Transaction History</h2>
        <p className="text-xs text-gray-600">Real-time transaction tracking</p>
        <Button onClick={refreshTransactions} size="sm" variant="outline" className="mt-2 text-xs bg-transparent">
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <ArrowDownCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-green-700">Total Deposits</p>
                <p className="text-sm font-bold text-green-800">₨{summary.totalDeposits.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <ArrowUpCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs text-red-700">Total Withdrawals</p>
                <p className="text-sm font-bold text-red-800">₨{summary.totalWithdrawals.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-blue-700">Total Investments</p>
                <p className="text-sm font-bold text-blue-800">₨{summary.totalInvestments.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-xs text-yellow-700">Pending Amount</p>
                <p className="text-sm font-bold text-yellow-800">₨{summary.pendingAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-8 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposits</SelectItem>
              <SelectItem value="withdrawal">Withdrawals</SelectItem>
              <SelectItem value="investment">Investments</SelectItem>
              <SelectItem value="profit">Profits</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Eye className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No transactions found</p>
              <p className="text-xs text-gray-500 mt-1">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Start investing to see transactions"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(transaction.type)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 capitalize">{transaction.type}</p>
                        <Badge className={`text-xs ${getStatusBadgeColor(transaction.status)}`}>
                          {getStatusIcon(transaction.status)}
                          <span className="ml-1">{transaction.status}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{transaction.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <p className="text-xs text-gray-500">{formatDate(transaction.timestamp)}</p>
                      </div>
                      {transaction.planName && (
                        <p className="text-xs text-blue-600 font-medium">Plan: {transaction.planName}</p>
                      )}
                      {transaction.method && <p className="text-xs text-gray-500">Method: {transaction.method}</p>}
                      {transaction.walletType && (
                        <p className="text-xs text-gray-500">
                          {transaction.walletType}: {transaction.accountNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        transaction.type === "deposit" || transaction.type === "profit"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "deposit" || transaction.type === "profit" ? "+" : "-"}₨
                      {transaction.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Transaction Stats */}
      {filteredTransactions.length > 0 && (
        <Card className="bg-gray-50">
          <CardContent className="p-3">
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>Total Transactions: {filteredTransactions.length}</span>
              <span>
                Last Updated: {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default TransactionHistory
