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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4 sm:p-6 lg:p-12">
      <div className="w-full max-w-2xl">
        <Card className="bg-[#FFFBF2] border border-[#EDE7DD] shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-4xl md:text-5xl font-extrabold text-[#164B3A] text-center">欢迎回来</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center gap-8">
              <button
                type="button"
                className={`text-base md:text-lg pb-1 ${mode === 'otp' ? 'text-[#164B3A] border-b-2 border-[#164B3A] font-semibold' : 'text-[#164B3A]/60'}`}
                onClick={() => setMode('otp')}
              >
                验证码登录
              </button>
              <button
                type="button"
                className={`text-base md:text-lg pb-1 ${mode === 'password' ? 'text-[#164B3A] border-b-2 border-[#164B3A] font-semibold' : 'text-[#164B3A]/60'}`}
                onClick={() => setMode('password')}
              >
                密码登录
              </button>
            </div>

            {mode === 'otp' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp-email" className="text-[#164B3A]">邮箱</Label>
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
                  <Label className="text-[#164B3A]">验证码</Label>
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
                  className="w-full h-12 text-lg bg-[#2F6A53] hover:bg-[#2F6A53]/90"
                  disabled={isLoading || !otp}
                  onClick={() => router.push('/dashboard')}
                >
                  登录
                </TouchOptimizedButton>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#164B3A]">邮箱</Label>
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
                  <Label htmlFor="password" className="text-[#164B3A]">密码</Label>
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
                  className="w-full h-12 text-lg bg-[#2F6A53] hover:bg-[#2F6A53]/90"
                  disabled={isLoading}
                >
                  {isLoading ? '登录中...' : '登录'}
                </TouchOptimizedButton>
              </form>
            )}
            <p className="text-center text-xs sm:text-sm text-[#164B3A]/70">
              还没有账户？ <a href="/register" className="text-[#2F6A53] hover:underline font-medium">立即注册</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
