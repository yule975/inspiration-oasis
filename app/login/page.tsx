"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Label } from "../../components/ui/label"
import { useAuth } from "../../contexts/AuthContext"
import { toast } from "sonner"
import { TouchOptimizedButton, TouchOptimizedInput } from "../../components/ui/mobile-touch-optimizations"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../components/ui/input-otp"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [mode, setMode] = useState<'otp' | 'password'>('otp')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()

  // 如果已经登录，重定向到仪表板
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('请填写邮箱和密码')
      return
    }

    setIsLoading(true)
    
    try {
      const success = await login(email, password)
      if (success) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendCode = async () => {
    if (!email) {
      toast.error('请先填写邮箱')
      return
    }
    try {
      setIsLoading(true)
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error('发送失败')
      setOtpSent(true)
      toast.success('验证码已发送，请查收')
    } catch (err) {
      toast.error('发送验证码失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSSOLogin = (provider: string) => {
    // Mock SSO login
    console.log(`Logging in with ${provider}`)
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col lg:flex-row">
      {/* Top/Left Side - Brand Showcase */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 min-h-[35vh] sm:min-h-[40vh] lg:min-h-screen">
        <div className="text-center max-w-lg">
          <div className="flex items-center justify-center">
            <div className="p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-[#2F6A53] to-[#1e4a3a] rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl">
              <svg className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Lightbulb body */}
                <circle cx="12" cy="9" r="5" fill="currentColor" />
                {/* Simple rectangular base */}
                <rect x="9" y="16" width="6" height="3" rx="1" fill="currentColor" />
                {/* Four-pointed star - the energized spark */}
                <path d="M12 6l1.5 2.5L16 9l-2.5 1.5L12 13l-1.5-2.5L8 9l2.5-1.5L12 6z" fill="white" />
                <circle cx="12" cy="9" r="1.5" fill="white" opacity="0.9" />
              </svg>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 lg:mt-12">
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-[#2F6A53] leading-tight font-sans tracking-wide">灵感绿洲</h1>
          </div>

          <div className="mt-2 sm:mt-4 lg:mt-24">
            <p className="text-base sm:text-lg lg:text-xl text-[#2F6A53]/70 font-light leading-relaxed font-sans">唤醒团队的伟大想法</p>
          </div>
        </div>
      </div>

      {/* Bottom/Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md space-y-4 sm:space-y-6 lg:space-y-8">
          <Card className="border-border/50 shadow-xl backdrop-blur-sm bg-card/95">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">欢迎回来</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-8">
                <button
                  type="button"
                  className={`text-base pb-1 ${mode === 'otp' ? 'text-primary border-b-2 border-primary font-semibold' : 'text-muted-foreground'}`}
                  onClick={() => setMode('otp')}
                >
                  验证码登录
                </button>
                <button
                  type="button"
                  className={`text-base pb-1 ${mode === 'password' ? 'text-primary border-b-2 border-primary font-semibold' : 'text-muted-foreground'}`}
                  onClick={() => setMode('password')}
                >
                  密码登录
                </button>
              </div>

              {mode === 'otp' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp-email">邮箱</Label>
                    <TouchOptimizedInput
                      id="otp-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>验证码</Label>
                    <div className="flex items-center gap-2">
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                      <Button type="button" variant="outline" onClick={sendCode} disabled={isLoading}>
                        {otpSent ? '重新发送' : '发送验证码'}
                      </Button>
                    </div>
                  </div>
                  <TouchOptimizedButton
                    type="button"
                    className="w-full"
                    disabled={isLoading || !otp}
                    size="lg"
                    onClick={() => router.push('/dashboard')}
                  >
                    登录
                  </TouchOptimizedButton>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱</Label>
                    <TouchOptimizedInput
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">密码</Label>
                    <TouchOptimizedInput
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <TouchOptimizedButton
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    size="lg"
                    onClick={() => {}}
                  >
                    {isLoading ? "登录中..." : "登录"}
                  </TouchOptimizedButton>
                </form>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">或</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center justify-center p-2 sm:p-3 h-10 sm:h-12 hover:bg-gray-50 border-border/30 bg-transparent touch-manipulation min-w-0"
                    onClick={() => handleSSOLogin("Google")}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center justify-center p-2 sm:p-3 h-10 sm:h-12 hover:bg-gray-50 border-border/30 bg-transparent touch-manipulation min-w-0"
                    onClick={() => handleSSOLogin("GitHub")}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center justify-center p-2 sm:p-3 h-10 sm:h-12 hover:bg-gray-50 border-border/30 bg-transparent touch-manipulation min-w-0"
                    onClick={() => handleSSOLogin("Microsoft")}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                      <path fill="#F25022" d="M1 1h10v10H1z" />
                      <path fill="#00A4EF" d="M13 1h10v10H13z" />
                      <path fill="#7FBA00" d="M1 13h10v10H1z" />
                      <path fill="#FFB900" d="M13 13h10v10H13z" />
                    </svg>
                  </Button>
                </div>

                <TouchOptimizedButton
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="w-full border-[#2F6A53]/20 text-[#2F6A53] hover:bg-[#2F6A53]/5 bg-transparent font-medium"
                  size="lg"
                  variant="outline"
                >
                  <svg className="mr-2 h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="currentColor" />
                    <path
                      d="M14.3 3.3a10 10 0 0 1 7.4 15.4c-.4 1.4-1 2.7-1.9 3.9l-.9-.6a8 8 0 0 0-11.6 0l-.9.6c-.9-.2-1.5-2.5-1.9-3.9A10 10 0 0 1 14.3 3.3z"
                      fill="white"
                    />
                  </svg>
                  先睹为快
                </TouchOptimizedButton>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs sm:text-sm text-muted-foreground px-2">
            还没有账户？{" "}
            <a href="/register" className="text-[#2F6A53] hover:underline font-medium">
              立即注册
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
