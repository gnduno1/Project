"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { getDatabase, ref, get, update } from "firebase/database"
import { useToast } from "@/hooks/use-toast"

export function ProfitClaimSystem() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!user?.uid) return

    const checkAndClaimProfits = async () => {
      if (isProcessing) return

      try {
        setIsProcessing(true)
        const database = getDatabase()

        // Get user's investments
        const investmentsRef = ref(database, `investments/${user.uid}`)
        const investmentsSnapshot = await get(investmentsRef)

        if (!investmentsSnapshot.exists()) {
          setIsProcessing(false)
          return
        }

        const investments = investmentsSnapshot.val()
        let totalProfitToClaim = 0
        const updates = {}

        // Process each investment
        Object.entries(investments).forEach(([investmentId, investment]: [string, any]) => {
          if (investment.status !== "active") return

          const now = Date.now()
          const startDate = new Date(investment.startDate).getTime()
          const endDate = new Date(investment.endDate).getTime()

          // Check if investment period has ended
          if (now >= endDate) {
            // Investment completed, mark as completed and add final profit
            const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24))
            const totalProfit = totalDays * investment.dailyProfit

            updates[`investments/${user.uid}/${investmentId}/status`] = "completed"
            updates[`investments/${user.uid}/${investmentId}/completedAt`] = now
            updates[`investments/${user.uid}/${investmentId}/totalProfitEarned`] = totalProfit

            totalProfitToClaim += totalProfit

            console.log(`Investment ${investmentId} completed. Total profit: ₨${totalProfit}`)
          } else {
            // Calculate daily profit for active investments
            const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24))
            const lastClaimDay = investment.lastClaimDay || 0

            if (daysSinceStart > lastClaimDay) {
              const newDaysToProcess = daysSinceStart - lastClaimDay
              const dailyProfitToClaim = newDaysToProcess * investment.dailyProfit

              updates[`investments/${user.uid}/${investmentId}/lastClaimDay`] = daysSinceStart
              updates[`investments/${user.uid}/${investmentId}/totalClaimed`] =
                (investment.totalClaimed || 0) + dailyProfitToClaim

              totalProfitToClaim += dailyProfitToClaim

              console.log(`Investment ${investmentId}: ${newDaysToProcess} days profit = ₨${dailyProfitToClaim}`)
            }
          }
        })

        // If there's profit to claim, update user's withdrawable_profit
        if (totalProfitToClaim > 0) {
          // Get current user data
          const userRef = ref(database, `users/${user.uid}`)
          const userSnapshot = await get(userRef)
          const userData = userSnapshot.val()

          const currentWithdrawableProfit = userData?.withdrawable_profit || 0
          const newWithdrawableProfit = currentWithdrawableProfit + totalProfitToClaim

          // Update user's withdrawable profit
          updates[`users/${user.uid}/withdrawable_profit`] = newWithdrawableProfit
          updates[`users/${user.uid}/lastProfitClaim`] = now

          // Apply all updates
          await update(ref(database), updates)

          console.log(`✅ Profit claimed: ₨${totalProfitToClaim} added to withdrawable amount`)

          // Show success toast
          toast({
            title: "Profit Claimed! 💰",
            description: `₨${totalProfitToClaim} has been added to your withdrawable amount`,
          })
        }
      } catch (error) {
        console.error("Error in profit claiming system:", error)
      } finally {
        setIsProcessing(false)
      }
    }

    // Check for profits every 3 seconds
    const interval = setInterval(checkAndClaimProfits, 3000)

    // Initial check
    checkAndClaimProfits()

    return () => clearInterval(interval)
  }, [user?.uid, isProcessing, toast])

  return null // This component runs in background
}

export default ProfitClaimSystem
