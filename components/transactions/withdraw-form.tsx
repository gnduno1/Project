"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { getDatabase, ref, push, get, set } from "firebase/database"
import { Wallet, Plus, Trash2, CheckCircle, AlertCircle, Smartphone, Building, CreditCard } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface WithdrawFormProps {
  onClose: () => void
}

interface SavedWallet {
  id: string
  accountHolder: string
  accountNumber: string
  walletType: string
  isDefault?: boolean
}

export function WithdrawForm({ onClose }: WithdrawFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [selectedWallet, setSelectedWallet] = useState<string>("")
  const [savedWallets, setSavedWallets] = useState<SavedWallet[]>([])
  const [showAddWallet, setShowAddWallet] = useState(false)
  const [loading, setLoading] = useState(false)

  // New wallet form
  const [newWallet, setNewWallet] = useState({
    accountHolder: "",
    accountNumber: "",
    walletType: "",
  })

  const walletTypes = [
    { value: "jazzcash", label: "JazzCash", icon: Smartphone },
    { value: "easypaisa", label: "EasyPaisa", icon: Smartphone },
    { value: "bank", label: "Bank Transfer", icon: Building },
  ]

  useEffect(() => {
    loadSavedWallets()
  }, [user])

  const loadSavedWallets = async () => {
    if (!user?.uid) return

    try {
      const database = getDatabase()
      const walletsRef = ref(database, `users/${user.uid}/savedWallets`)
      const snapshot = await get(walletsRef)

      if (snapshot.exists()) {
        const walletsData = snapshot.val()
        const walletsList = Object.entries(walletsData).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }))
        setSavedWallets(walletsList)
      }
    } catch (error) {
      console.error("Error loading saved wallets:", error)
    }
  }

  const addNewWallet = async () => {
    if (!newWallet.accountHolder || !newWallet.accountNumber || !newWallet.walletType) {
      toast({
        title: "Error",
        description: "Please fill all wallet details",
        variant: "destructive",
      })
      return
    }

    try {
      const database = getDatabase()
      const walletId = Date.now().toString()
      const walletData = {
        ...newWallet,
        createdAt: Date.now(),
        isDefault: savedWallets.length === 0,
      }

      await set(ref(database, `users/${user?.uid}/savedWallets/${walletId}`), walletData)

      setSavedWallets([...savedWallets, { id: walletId, ...walletData }])
      setNewWallet({ accountHolder: "", accountNumber: "", walletType: "" })
      setShowAddWallet(false)

      toast({
        title: "Wallet Added",
        description: "New withdrawal wallet has been saved",
      })
    } catch (error) {
      console.error("Error adding wallet:", error)
      toast({
        title: "Error",
        description: "Failed to add wallet",
        variant: "destructive",
      })
    }
  }

  const deleteWallet = async (walletId: string) => {
    try {
      const database = getDatabase()
      await set(ref(database, `users/${user?.uid}/savedWallets/${walletId}`), null)

      setSavedWallets(savedWallets.filter((w) => w.id !== walletId))
      if (selectedWallet === walletId) {
        setSelectedWallet("")
      }

      toast({
        title: "Wallet Deleted",
        description: "Withdrawal wallet has been removed",
      })
    } catch (error) {
      console.error("Error deleting wallet:", error)
      toast({
        title: "Error",
        description: "Failed to delete wallet",
        variant: "destructive",
      })
    }
  }

  const handleWithdraw = async () => {
    if (!amount || !selectedWallet) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    const withdrawAmount = Number.parseFloat(amount)
    const availableBalance = user?.withdrawable_profit || 0

    if (withdrawAmount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You can only withdraw up to ₨${availableBalance}`,
        variant: "destructive",
      })
      return
    }

    if (withdrawAmount < 100) {
      toast({
        title: "Minimum Amount",
        description: "Minimum withdrawal amount is ₨100",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const database = getDatabase()
      const selectedWalletData = savedWallets.find((w) => w.id === selectedWallet)

      const withdrawalData = {
        userId: user?.uid,
        username: user?.username,
        email: user?.email,
        amount: withdrawAmount,
        accountHolder: selectedWalletData?.accountHolder,
        accountNumber: selectedWalletData?.accountNumber,
        walletType: selectedWalletData?.walletType,
        status: "pending",
        timestamp: Date.now(),
      }

      await push(ref(database, "withdrawals"), withdrawalData)

      // Deduct from withdrawable profit
      const newWithdrawableProfit = availableBalance - withdrawAmount
      await set(ref(database, `users/${user?.uid}/withdrawable_profit`), newWithdrawableProfit)

      toast({
        title: "Withdrawal Submitted!",
        description: "Your withdrawal request has been submitted for review",
      })

      onClose()
    } catch (error) {
      console.error("Error submitting withdrawal:", error)
      toast({
        title: "Error",
        description: "Failed to submit withdrawal request",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getWalletIcon = (type: string) => {
    const walletType = walletTypes.find((w) => w.value === type)
    const IconComponent = walletType?.icon || CreditCard
    return <IconComponent className="h-4 w-4" />
  }

  const quickAmounts = [100, 500, 1000, 2000]
  const availableBalance = user?.withdrawable_profit || 0

  return (
    <div className="space-y-6">
      {/* Balance Info */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Available for Withdrawal</p>
            <p className="text-2xl font-bold text-green-600">₨{availableBalance.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Amount Input */}
      <div className="space-y-3">
        <Label htmlFor="amount">Withdrawal Amount (PKR)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-lg font-semibold text-center"
        />

        <div>
          <p className="text-sm text-gray-600 mb-2">Quick Select:</p>
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="outline"
                size="sm"
                onClick={() => setAmount(quickAmount.toString())}
                disabled={quickAmount > availableBalance}
                className="text-xs"
              >
                ₨{quickAmount}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Saved Wallets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Select Withdrawal Wallet</Label>
          <Dialog open={showAddWallet} onOpenChange={setShowAddWallet}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-3 w-3 mr-1" />
                Add Wallet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Wallet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Account Holder Name</Label>
                  <Input
                    placeholder="Enter account holder name"
                    value={newWallet.accountHolder}
                    onChange={(e) => setNewWallet({ ...newWallet, accountHolder: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    placeholder="Enter account number"
                    value={newWallet.accountNumber}
                    onChange={(e) => setNewWallet({ ...newWallet, accountNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Wallet Type</Label>
                  <Select
                    value={newWallet.walletType}
                    onValueChange={(value) => setNewWallet({ ...newWallet, walletType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select wallet type" />
                    </SelectTrigger>
                    <SelectContent>
                      {walletTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <type.icon className="h-4 w-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setShowAddWallet(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={addNewWallet} className="flex-1">
                    Add Wallet
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {savedWallets.map((wallet) => (
            <div
              key={wallet.id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedWallet === wallet.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedWallet(wallet.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getWalletIcon(wallet.walletType)}
                  <div>
                    <p className="font-medium text-sm">{wallet.accountHolder}</p>
                    <p className="text-xs text-gray-600">{wallet.accountNumber}</p>
                    <p className="text-xs text-gray-500 capitalize">{wallet.walletType}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {wallet.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                  {selectedWallet === wallet.id && <CheckCircle className="h-4 w-4 text-blue-500" />}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteWallet(wallet.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {savedWallets.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No saved wallets</p>
              <p className="text-xs">Add a wallet to start withdrawing</p>
            </div>
          )}
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Important Notes:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Minimum withdrawal amount is ₨100</li>
              <li>• Processing time: 24-48 hours</li>
              <li>• Ensure account details are correct</li>
              <li>• Withdrawals are processed on business days</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex space-x-2">
        <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
          Cancel
        </Button>
        <Button
          onClick={handleWithdraw}
          disabled={loading || !amount || !selectedWallet || Number.parseFloat(amount) > availableBalance}
          className="flex-1"
        >
          {loading ? "Processing..." : "Submit Withdrawal"}
        </Button>
      </div>
    </div>
  )
}

export default WithdrawForm
