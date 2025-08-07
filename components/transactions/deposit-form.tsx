"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { getDatabase, ref, push, get } from "firebase/database"
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Building,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
} from "lucide-react"

interface DepositFormProps {
  onClose: () => void
}

interface PaymentMethod {
  enabled: boolean
  name: string
  number?: string
  details?: string
  accountHolder: string
  type?: string
}

export function DepositForm({ onClose }: DepositFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState("")
  const [selectedMethod, setSelectedMethod] = useState<string>("")
  const [transactionId, setTransactionId] = useState("")
  const [loading, setLoading] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<Record<string, PaymentMethod>>({})
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  useEffect(() => {
    if (step === 3 && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [step, timeLeft])

  const fetchPaymentMethods = async () => {
    try {
      const database = getDatabase()
      const snapshot = await get(ref(database, "settings/paymentMethods"))
      if (snapshot.exists()) {
        const methods = snapshot.val()
        // Filter only enabled methods for deposits
        const enabledMethods = Object.entries(methods).reduce(
          (acc, [key, method]: [string, any]) => {
            if (method.enabled && (method.type === "both" || method.type === "deposit")) {
              acc[key] = method
            }
            return acc
          },
          {} as Record<string, PaymentMethod>,
        )
        setPaymentMethods(enabledMethods)
      } else {
        // Set default payment methods with Jawad Ahmad
        const defaultMethods = {
          jazzcash: {
            enabled: true,
            name: "JazzCash",
            number: "03257340165",
            accountHolder: "Jawad Ahmad",
            type: "both",
          },
          easypaisa: {
            enabled: true,
            name: "EasyPaisa",
            number: "03257340165",
            accountHolder: "Jawad Ahmad",
            type: "both",
          },
          bank: {
            enabled: true,
            name: "Bank Transfer",
            details: "Account: 1234567890",
            accountHolder: "Jawad Ahmad",
            type: "both",
          },
        }
        setPaymentMethods(defaultMethods)
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error)
    }
  }

  const quickAmounts = [100, 250, 500, 1000, 2500, 5000]

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Account details copied to clipboard",
    })
  }

  const handleSubmit = async () => {
    if (!amount || !selectedMethod || !transactionId) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const database = getDatabase()
      const depositData = {
        userId: user?.uid,
        username: user?.username,
        userEmail: user?.email,
        amount: Number.parseFloat(amount),
        method: paymentMethods[selectedMethod]?.name,
        transactionId,
        status: "pending",
        timestamp: Date.now(),
        paymentDetails: paymentMethods[selectedMethod],
      }

      await push(ref(database, "deposits"), depositData)

      toast({
        title: "Deposit Request Submitted!",
        description: "Your deposit request has been submitted for review",
      })

      setStep(4)
    } catch (error) {
      console.error("Error submitting deposit:", error)
      toast({
        title: "Error",
        description: "Failed to submit deposit request",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getMethodIcon = (methodKey: string) => {
    switch (methodKey) {
      case "jazzcash":
        return <Smartphone className="h-5 w-5 text-red-500" />
      case "easypaisa":
        return <Smartphone className="h-5 w-5 text-green-500" />
      case "bank":
        return <Building className="h-5 w-5 text-blue-500" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  // Step 1: Amount Entry
  if (step === 1) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Enter Deposit Amount</h3>
          <p className="text-sm text-gray-600">Choose or enter the amount you want to deposit</p>
        </div>

        <div>
          <Label htmlFor="amount">Amount (PKR)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg font-semibold text-center"
          />
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">Quick Select:</p>
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="outline"
                onClick={() => setAmount(quickAmount.toString())}
                className="text-sm"
              >
                ₨{quickAmount}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Cancel
          </Button>
          <Button onClick={() => setStep(2)} disabled={!amount || Number.parseFloat(amount) < 100} className="flex-1">
            Continue
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    )
  }

  // Step 2: Payment Method Selection
  if (step === 2) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-lg font-semibold">Select Payment Method</h3>
            <p className="text-sm text-gray-600">Amount: ₨{amount}</p>
          </div>
        </div>

        <div className="space-y-2">
          {Object.entries(paymentMethods).map(([key, method]) => (
            <button
              key={key}
              onClick={() => setSelectedMethod(key)}
              className={`w-full p-4 border rounded-lg flex items-center space-x-3 transition-colors ${
                selectedMethod === key ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {getMethodIcon(key)}
              <div className="flex-1 text-left">
                <h4 className="font-medium">{method.name}</h4>
                <p className="text-sm text-gray-600">{method.accountHolder}</p>
              </div>
              {selectedMethod === key && <CheckCircle className="h-5 w-5 text-blue-500" />}
            </button>
          ))}
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
            Back
          </Button>
          <Button onClick={() => setStep(3)} disabled={!selectedMethod} className="flex-1">
            Continue
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    )
  }

  // Step 3: Payment Details
  if (step === 3) {
    const method = paymentMethods[selectedMethod]
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-lg font-semibold">Payment Details</h3>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-600">Time remaining: {formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getMethodIcon(selectedMethod)}
                <span className="font-medium">{method.name}</span>
              </div>
              <Badge variant="secondary">₨{amount}</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Holder:</span>
                <span className="font-medium">{method.accountHolder}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Number:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono">{method.number || method.details}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(method.number || method.details || "")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Important Instructions:</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• Send exactly ₨{amount} to the above account</li>
                <li>• Copy the transaction ID after payment</li>
                <li>• Complete this form within 15 minutes</li>
                <li>• Keep your payment receipt safe</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="transactionId">Transaction ID *</Label>
          <Input
            id="transactionId"
            placeholder="Enter transaction ID from your payment"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
          />
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !transactionId} className="flex-1">
            {loading ? "Submitting..." : "Submit Deposit"}
          </Button>
        </div>
      </div>
    )
  }

  // Step 4: Success
  return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-green-600">Deposit Submitted!</h3>
        <p className="text-sm text-gray-600">Your deposit request of ₨{amount} has been submitted successfully</p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">Your deposit will be processed within 5-10 minutes after verification</p>
      </div>
      <Button onClick={onClose} className="w-full">
        Done
      </Button>
    </div>
  )
}

export default DepositForm
