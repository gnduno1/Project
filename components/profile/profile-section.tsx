"use client"

import { Badge } from "@/components/ui/badge"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import {
  User,
  Lock,
  Bell,
  Shield,
  Upload,
  CheckCircle,
  AlertCircle,
  Copy,
  Users,
  Gift,
  Share2,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react"
import { getDatabase, ref, get, update } from "firebase/database"
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"
import { getAuth } from "firebase/auth"

export function ProfileSection() {
  const { user, refreshUser, logout } = useAuth()
  const { toast } = useToast()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [userReferCode, setUserReferCode] = useState("")
  const [referralStats, setReferralStats] = useState({
    referral_count: 0,
    referral_earnings: 0,
  })

  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    date_of_birth: user?.date_of_birth || "",
    nationality: user?.nationality || "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    loginAlerts: true,
    investmentUpdates: true,
    marketingEmails: false,
  })

  // Load user refer code and stats
  useEffect(() => {
    if (user?.uid) {
      loadUserReferData()
      // Update profile data when user changes
      setProfileData({
        username: user?.username || "",
        email: user?.email || "",
        phone: user?.phone || "",
        address: user?.address || "",
        date_of_birth: user?.date_of_birth || "",
        nationality: user?.nationality || "",
      })
    }
  }, [user])

  const loadUserReferData = async () => {
    try {
      const database = getDatabase()
      const userRef = ref(database, `users/${user?.uid}`)
      const userSnapshot = await get(userRef)

      if (userSnapshot.exists()) {
        const userData = userSnapshot.val()

        // Generate refer code if not exists
        if (!userData.refer_code) {
          const newReferCode = generateReferCode()
          await update(userRef, { refer_code: newReferCode })
          setUserReferCode(newReferCode)
        } else {
          setUserReferCode(userData.refer_code)
        }

        // Set referral stats
        setReferralStats({
          referral_count: userData.referral_count || 0,
          referral_earnings: userData.referral_earnings || 0,
        })
      }
    } catch (error) {
      console.error("Error loading refer data:", error)
    }
  }

  const generateReferCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const copyReferCode = () => {
    if (userReferCode) {
      navigator.clipboard.writeText(userReferCode)
      toast({
        title: "Copied!",
        description: "Refer code copied to clipboard",
      })
    }
  }

  const shareReferCode = () => {
    if (navigator.share && userReferCode) {
      navigator.share({
        title: "Join Al-Arab Car Trade",
        text: `Use my refer code ${userReferCode} and get ₨50 bonus on signup!`,
        url: window.location.origin,
      })
    } else {
      copyReferCode()
    }
  }

  const refreshReferData = async () => {
    setLoading(true)
    await loadUserReferData()
    await refreshUser()
    setLoading(false)
    toast({
      title: "Refreshed!",
      description: "Referral data updated successfully",
    })
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!user?.uid) {
        throw new Error("User not found")
      }

      // Validate required fields
      if (!profileData.username.trim()) {
        throw new Error("Username is required")
      }

      const database = getDatabase()
      const userRef = ref(database, `users/${user.uid}`)

      // Update user data in Firebase
      await update(userRef, {
        username: profileData.username.trim(),
        phone: profileData.phone.trim(),
        address: profileData.address.trim(),
        date_of_birth: profileData.date_of_birth,
        nationality: profileData.nationality.trim(),
        updated_at: Date.now(),
      })

      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      })

      setSuccess("Profile updated successfully!")
      await refreshUser()
    } catch (err: any) {
      console.error("Profile update error:", err)
      setError(err.message || "Failed to update profile")
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setError("")

    try {
      // Validate passwords
      if (!passwordData.currentPassword) {
        throw new Error("Current password is required")
      }

      if (!passwordData.newPassword) {
        throw new Error("New password is required")
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error("New passwords do not match")
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long")
      }

      if (passwordData.newPassword === passwordData.currentPassword) {
        throw new Error("New password must be different from current password")
      }

      const auth = getAuth()
      const currentUser = auth.currentUser

      if (!currentUser || !currentUser.email) {
        throw new Error("User not authenticated")
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(currentUser.email, passwordData.currentPassword)
      await reauthenticateWithCredential(currentUser, credential)

      // Update password
      await updatePassword(currentUser, passwordData.newPassword)

      // Update last password change in database
      const database = getDatabase()
      const userRef = ref(database, `users/${user?.uid}`)
      await update(userRef, {
        last_password_change: Date.now(),
      })

      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      })

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      setSuccess("Password changed successfully!")
    } catch (err: any) {
      console.error("Password change error:", err)
      let errorMessage = "Failed to change password"

      if (err.code === "auth/wrong-password") {
        errorMessage = "Current password is incorrect"
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password is too weak"
      } else if (err.code === "auth/requires-recent-login") {
        errorMessage = "Please log out and log back in, then try again"
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      toast({
        title: "Password Change Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleNotificationUpdate = async (setting: string, value: boolean) => {
    try {
      setNotificationSettings((prev) => ({ ...prev, [setting]: value }))

      // Save to Firebase
      const database = getDatabase()
      const userRef = ref(database, `users/${user?.uid}`)
      await update(userRef, {
        [`notification_settings.${setting}`]: value,
        updated_at: Date.now(),
      })

      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been updated.",
      })
    } catch (error) {
      console.error("Error updating notification settings:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update notification settings",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Please login to view your profile</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl lg:text-2xl">My Profile</CardTitle>
          <CardDescription className="text-sm lg:text-base">
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24 lg:h-32 lg:w-32">
                <AvatarImage src={user.profile_picture || ""} alt={user.username} />
                <AvatarFallback className="text-2xl lg:text-4xl bg-primary/10">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 touch-target"
                onClick={() =>
                  toast({ title: "Coming Soon", description: "Profile picture upload will be available soon." })
                }
              >
                <Upload className="h-4 w-4" />
                Change Picture
              </Button>
              <div className="text-center">
                <h3 className="font-medium text-lg">{user.username}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>

                {/* Enhanced Refer Code Section */}
                <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl border-2 border-blue-200 shadow-lg">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-base font-bold text-blue-800">Your Refer Code</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={refreshReferData}
                      disabled={loading}
                      className="h-6 w-6 p-0"
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>

                  {userReferCode ? (
                    <>
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <code className="bg-white px-4 py-2 rounded-lg border-2 border-blue-300 text-2xl font-bold text-blue-600 shadow-sm">
                          {userReferCode}
                        </code>
                        <Button size="sm" variant="outline" onClick={copyReferCode} className="touch-target">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={shareReferCode} className="touch-target">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white/70 rounded-lg p-2 border">
                          <div className="font-bold text-lg text-green-600">{referralStats.referral_count}</div>
                          <div className="text-xs text-gray-600">Total Referrals</div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2 border">
                          <div className="font-bold text-lg text-purple-600">₨{referralStats.referral_earnings}</div>
                          <div className="text-xs text-gray-600">Earned</div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-gray-600 bg-white/50 rounded-lg p-2">
                        <p className="font-semibold mb-1">How it works:</p>
                        <p>• Share your code with friends</p>
                        <p>• They get ₨50 bonus on signup</p>
                        <p>• You earn ₨30 for each referral</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Loading refer code...</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center mt-2 gap-1">
                  {user.status === "active" ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-500 font-medium">Active Account</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-xs text-yellow-500 font-medium">{user.status} Account</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="personal" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
                    <User className="h-3 w-3 lg:h-4 lg:w-4" />
                    <span className="hidden sm:inline">Personal Info</span>
                    <span className="sm:hidden">Personal</span>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
                    <Shield className="h-3 w-3 lg:h-4 lg:w-4" />
                    <span>Security</span>
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
                    <Bell className="h-3 w-3 lg:h-4 lg:w-4" />
                    <span className="hidden sm:inline">Notifications</span>
                    <span className="sm:hidden">Notify</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4 pt-4">
                  <form onSubmit={handleProfileUpdate}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm lg:text-base">
                          Username *
                        </Label>
                        <Input
                          id="username"
                          value={profileData.username}
                          onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                          className="h-10 lg:h-12"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm lg:text-base">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          disabled
                          className="h-10 lg:h-12 bg-gray-100"
                        />
                        <p className="text-xs text-gray-500">Email cannot be changed</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm lg:text-base">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="h-10 lg:h-12"
                          placeholder="03001234567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nationality" className="text-sm lg:text-base">
                          Nationality
                        </Label>
                        <Input
                          id="nationality"
                          value={profileData.nationality}
                          onChange={(e) => setProfileData({ ...profileData, nationality: e.target.value })}
                          className="h-10 lg:h-12"
                          placeholder="Pakistani"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dob" className="text-sm lg:text-base">
                          Date of Birth
                        </Label>
                        <Input
                          id="dob"
                          type="date"
                          value={profileData.date_of_birth}
                          onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                          className="h-10 lg:h-12"
                        />
                      </div>
                      <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="address" className="text-sm lg:text-base">
                          Address
                        </Label>
                        <Input
                          id="address"
                          value={profileData.address}
                          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                          className="h-10 lg:h-12"
                          placeholder="Your complete address"
                        />
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </Alert>
                    )}

                    {success && (
                      <Alert className="mt-4 border-green-200 bg-green-50 text-green-800">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-sm">{success}</AlertDescription>
                      </Alert>
                    )}

                    <div className="mt-6 flex justify-end">
                      <Button type="submit" disabled={profileLoading} className="touch-target">
                        {profileLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving...</span>
                          </div>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="security" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    {/* Password Change Form */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm lg:text-base flex items-center">
                          <Lock className="h-4 w-4 mr-2" />
                          Change Password
                        </CardTitle>
                        <CardDescription className="text-xs lg:text-sm">
                          Update your account password for better security
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword" className="text-sm">
                              Current Password *
                            </Label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                type={showCurrentPassword ? "text" : "password"}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="h-10 pr-10"
                                placeholder="Enter current password"
                                required
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-10 w-10 px-3"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              >
                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-sm">
                              New Password *
                            </Label>
                            <div className="relative">
                              <Input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="h-10 pr-10"
                                placeholder="Enter new password (min 6 characters)"
                                required
                                minLength={6}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-10 w-10 px-3"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm">
                              Confirm New Password *
                            </Label>
                            <div className="relative">
                              <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="h-10 pr-10"
                                placeholder="Confirm new password"
                                required
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-10 w-10 px-3"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          {/* Password strength indicator */}
                          {passwordData.newPassword && (
                            <div className="space-y-2">
                              <div className="text-xs text-gray-600">Password Strength:</div>
                              <div className="flex space-x-1">
                                <div
                                  className={`h-2 w-1/4 rounded ${
                                    passwordData.newPassword.length >= 6 ? "bg-red-500" : "bg-gray-200"
                                  }`}
                                />
                                <div
                                  className={`h-2 w-1/4 rounded ${
                                    passwordData.newPassword.length >= 8 ? "bg-yellow-500" : "bg-gray-200"
                                  }`}
                                />
                                <div
                                  className={`h-2 w-1/4 rounded ${
                                    passwordData.newPassword.length >= 10 &&
                                    /[A-Z]/.test(passwordData.newPassword) &&
                                    /[0-9]/.test(passwordData.newPassword)
                                      ? "bg-blue-500"
                                      : "bg-gray-200"
                                  }`}
                                />
                                <div
                                  className={`h-2 w-1/4 rounded ${
                                    passwordData.newPassword.length >= 12 &&
                                    /[A-Z]/.test(passwordData.newPassword) &&
                                    /[0-9]/.test(passwordData.newPassword) &&
                                    /[!@#$%^&*]/.test(passwordData.newPassword)
                                      ? "bg-green-500"
                                      : "bg-gray-200"
                                  }`}
                                />
                              </div>
                              <div className="text-xs text-gray-500">
                                Use 8+ characters with uppercase, numbers, and symbols for strong password
                              </div>
                            </div>
                          )}

                          {error && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-sm">{error}</AlertDescription>
                            </Alert>
                          )}

                          {success && (
                            <Alert className="border-green-200 bg-green-50 text-green-800">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <AlertDescription className="text-sm">{success}</AlertDescription>
                            </Alert>
                          )}

                          <Button type="submit" disabled={passwordLoading} className="w-full">
                            {passwordLoading ? (
                              <div className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Changing Password...</span>
                              </div>
                            ) : (
                              "Change Password"
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    {/* Account Information */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border rounded-lg space-y-2 sm:space-y-0">
                      <div>
                        <h3 className="font-medium text-sm lg:text-base">Account Status</h3>
                        <p className="text-xs lg:text-sm text-muted-foreground">
                          Your account is currently {user.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.status === "active" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                        )}
                        <span className="text-sm font-medium capitalize">{user.status}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border rounded-lg space-y-2 sm:space-y-0">
                      <div>
                        <h3 className="font-medium text-sm lg:text-base">Account Created</h3>
                        <p className="text-xs lg:text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border rounded-lg space-y-2 sm:space-y-0">
                      <div>
                        <h3 className="font-medium text-sm lg:text-base">Last Login</h3>
                        <p className="text-xs lg:text-sm text-muted-foreground">
                          {user.last_login ? new Date(user.last_login).toLocaleString() : "Never"}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium text-sm lg:text-base">Email Notifications</h3>
                        <p className="text-xs lg:text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => handleNotificationUpdate("emailNotifications", checked)}
                      />
                    </div>

                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium text-sm lg:text-base">SMS Notifications</h3>
                        <p className="text-xs lg:text-sm text-muted-foreground">Receive notifications via SMS</p>
                      </div>
                      <Switch
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) => handleNotificationUpdate("smsNotifications", checked)}
                      />
                    </div>

                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium text-sm lg:text-base">Login Alerts</h3>
                        <p className="text-xs lg:text-sm text-muted-foreground">Get notified of new login attempts</p>
                      </div>
                      <Switch
                        checked={notificationSettings.loginAlerts}
                        onCheckedChange={(checked) => handleNotificationUpdate("loginAlerts", checked)}
                      />
                    </div>

                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium text-sm lg:text-base">Investment Updates</h3>
                        <p className="text-xs lg:text-sm text-muted-foreground">
                          Receive updates about your investments
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.investmentUpdates}
                        onCheckedChange={(checked) => handleNotificationUpdate("investmentUpdates", checked)}
                      />
                    </div>

                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium text-sm lg:text-base">Marketing Emails</h3>
                        <p className="text-xs lg:text-sm text-muted-foreground">
                          Receive promotional emails and offers
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.marketingEmails}
                        onCheckedChange={(checked) => handleNotificationUpdate("marketingEmails", checked)}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
        <Card>
          <CardContent className="p-3 lg:p-4 text-center">
            <div className="text-lg lg:text-2xl font-bold text-green-600">₨{user.balance?.toLocaleString() || 0}</div>
            <div className="text-xs lg:text-sm text-muted-foreground">Current Balance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 lg:p-4 text-center">
            <div className="text-lg lg:text-2xl font-bold text-blue-600">
              ₨{user.total_deposited?.toLocaleString() || 0}
            </div>
            <div className="text-xs lg:text-sm text-muted-foreground">Total Deposited</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 lg:p-4 text-center">
            <div className="text-lg lg:text-2xl font-bold text-purple-600">
              ₨{user.total_invested?.toLocaleString() || 0}
            </div>
            <div className="text-xs lg:text-sm text-muted-foreground">Total Invested</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 lg:p-4 text-center">
            <div className="text-lg lg:text-2xl font-bold text-orange-600">
              ₨{user.total_earned?.toLocaleString() || 0}
            </div>
            <div className="text-xs lg:text-sm text-muted-foreground">Total Earned</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Referral Section */}
      <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 border-2 border-purple-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg lg:text-xl flex items-center">
            <Gift className="h-6 w-6 mr-3 text-purple-600" />
            Referral Program
            <Badge className="ml-3 bg-purple-100 text-purple-800">Active</Badge>
          </CardTitle>
          <CardDescription className="text-sm lg:text-base">
            Invite friends and earn ₨30 for each successful referral! They get ₨50 bonus instead of ₨20.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-white/70 rounded-xl border-2 border-purple-100 shadow-sm">
              <div className="text-3xl font-bold text-purple-600">{referralStats.referral_count}</div>
              <div className="text-sm text-gray-600 font-medium">Total Referrals</div>
            </div>
            <div className="text-center p-4 bg-white/70 rounded-xl border-2 border-green-100 shadow-sm">
              <div className="text-3xl font-bold text-green-600">₨{referralStats.referral_earnings}</div>
              <div className="text-sm text-gray-600 font-medium">Referral Earnings</div>
            </div>
            <div className="text-center p-4 bg-white/70 rounded-xl border-2 border-blue-100 shadow-sm">
              <div className="text-3xl font-bold text-blue-600">₨30</div>
              <div className="text-sm text-gray-600 font-medium">Per Referral</div>
            </div>
          </div>

          <div className="bg-white/70 rounded-xl p-6 border-2 border-blue-100">
            <h4 className="font-bold mb-4 text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              How Referral Program Works:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <span>Share your unique refer code with friends</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <span>They sign up using your code</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <span>They get ₨50 bonus (instead of ₨20)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  <span>You earn ₨30 for each successful referral</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg border">
              <p className="text-sm font-semibold text-center text-gray-700">
                🎉 No limit on referrals! Invite unlimited friends and keep earning! 🎉
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
