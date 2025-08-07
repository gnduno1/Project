"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/components/providers/auth-provider"
import { Car, Eye, EyeOff, CheckCircle, AlertCircle, Sparkles, Shield, TrendingUp } from "lucide-react"

export function AuthForm() {
  const { signIn, signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [captcha, setCaptcha] = useState(generateCaptcha())

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    captcha: "",
  })

  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
    captcha: "",
    referCode: "",
  })

  function generateCaptcha() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (loginData.captcha !== captcha) {
      setError("Invalid CAPTCHA. Please try again.")
      setCaptcha(generateCaptcha())
      setLoginData({ ...loginData, captcha: "" })
      return
    }

    if (!loginData.email || !loginData.password) {
      setError("Please fill in all required fields.")
      return
    }

    setLoading(true)
    try {
      await signIn(loginData.email, loginData.password)
      setSuccess("Login successful! Redirecting to dashboard...")
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.")
      setCaptcha(generateCaptcha())
      setLoginData({ ...loginData, captcha: "" })
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (signupData.captcha !== captcha) {
      setError("Invalid CAPTCHA. Please try again.")
      setCaptcha(generateCaptcha())
      setSignupData({ ...signupData, captcha: "" })
      return
    }

    if (!signupData.username || !signupData.email || !signupData.password) {
      setError("Please fill in all required fields.")
      return
    }

    if (signupData.password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    setLoading(true)
    try {
      const referralCode = signupData.referCode.trim() || ""
      await signUp(signupData.email, signupData.password, signupData.username, referralCode)
      setSuccess("Account created successfully! Welcome to Al-Arab Car Trade!")
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.")
      setCaptcha(generateCaptcha())
      setSignupData({ ...signupData, captcha: "" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-30"></div>
              <div className="relative p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
                <Car className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Al-Arab Car Trade</h1>
          <p className="text-gray-600">Pakistan's Premier Investment Platform</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 bg-white rounded-xl shadow-sm border">
            <Shield className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs font-medium text-gray-700">Secure</p>
          </div>
          <div className="text-center p-3 bg-white rounded-xl shadow-sm border">
            <TrendingUp className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xs font-medium text-gray-700">High ROI</p>
          </div>
          <div className="text-center p-3 bg-white rounded-xl shadow-sm border">
            <Sparkles className="h-5 w-5 text-purple-500 mx-auto mb-1" />
            <p className="text-xs font-medium text-gray-700">Trusted</p>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 rounded-xl p-1">
                <TabsTrigger
                  value="login"
                  className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
                  <p className="text-sm text-gray-600">Sign in to your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      className="mt-1 h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 rounded-md"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Security Code</Label>
                    <div className="flex space-x-3 mt-1">
                      <div className="flex-1 bg-gray-100 p-3 rounded-xl border-2 border-dashed border-gray-300">
                        <div className="text-center text-lg font-bold tracking-wider text-gray-800 font-mono">
                          {captcha}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setCaptcha(generateCaptcha())
                          setLoginData({ ...loginData, captcha: "" })
                        }}
                        className="h-11 px-3 rounded-xl"
                        disabled={loading}
                      >
                        🔄
                      </Button>
                    </div>
                    <Input
                      placeholder="Enter the code above"
                      value={loginData.captcha}
                      onChange={(e) => setLoginData({ ...loginData, captcha: e.target.value })}
                      required
                      className="mt-2 h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="rounded-xl border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700">{success}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Create Account</h2>
                  <p className="text-sm text-gray-600">Join thousands of investors</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-username" className="text-sm font-medium text-gray-700">
                      Username
                    </Label>
                    <Input
                      id="signup-username"
                      placeholder="Choose a username"
                      value={signupData.username}
                      onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                      required
                      className="mt-1 h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                      className="mt-1 h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password (min 6 characters)"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                        minLength={6}
                        className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 rounded-md"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-refer" className="text-sm font-medium text-gray-700">
                      Referral Code (Optional)
                    </Label>
                    <Input
                      id="signup-refer"
                      placeholder="Enter referral code for bonus"
                      value={signupData.referCode}
                      onChange={(e) => setSignupData({ ...signupData, referCode: e.target.value.toUpperCase() })}
                      className="mt-1 h-11 rounded-xl border-gray-200 focus:border-yellow-500 focus:ring-yellow-500"
                      disabled={loading}
                    />
                    <div className="mt-2 p-3 bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl border border-green-200">
                      <p className="text-xs text-center font-medium text-green-700">
                        💰 Get ₨20 signup bonus + ₨30 extra with referral code!
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Security Code</Label>
                    <div className="flex space-x-3 mt-1">
                      <div className="flex-1 bg-gray-100 p-3 rounded-xl border-2 border-dashed border-gray-300">
                        <div className="text-center text-lg font-bold tracking-wider text-gray-800 font-mono">
                          {captcha}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setCaptcha(generateCaptcha())
                          setSignupData({ ...signupData, captcha: "" })
                        }}
                        className="h-11 px-3 rounded-xl"
                        disabled={loading}
                      >
                        🔄
                      </Button>
                    </div>
                    <Input
                      placeholder="Enter the code above"
                      value={signupData.captcha}
                      onChange={(e) => setSignupData({ ...signupData, captcha: e.target.value })}
                      required
                      className="mt-2 h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="rounded-xl border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700">{success}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating account...</span>
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  )
}

export default AuthForm
