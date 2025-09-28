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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpToken, setOtpToken] = useState("")
  const [mode, setMode] = useState<'otp' | 'password'>('otp')
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0) // 倒计时状态
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()

  // 如果已经登录，重定向到仪表板
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

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
        body: JSON.stringify({ email, purpose: 'login' }),
      })
      if (!res.ok) throw new Error('发送失败')
      const data = await res.json()
      setOtpSent(true)
      setCountdown(60) // 开始60秒倒计时
      setOtpToken(data?.token || "")
      toast.success('验证码已发送，请查收')
    } catch (err) {
      toast.error('发送验证码失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpLogin = async () => {
    if (!email || !otp) {
      toast.error('请填写邮箱和验证码')
      return
    }
    
    try {
      setIsLoading(true)
      // 先验证验证码
      const verifyRes = await fetch('/api/auth/send-verification-code', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp, token: otpToken }),
      })
      
      const verifyData = await verifyRes.json()
      
      if (verifyData.success) {
        // 验证码正确，登录成功
        toast.success('登录成功')
        router.push('/dashboard')
      } else {
        toast.error(verifyData.error?.message || '验证码错误')
      }
    } catch (error) {
      console.error('验证码登录失败:', error)
      toast.error('登录失败，请稍后重试')
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
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-normal text-[#2F6A53] leading-tight font-sans tracking-wide">灵感绿洲</h1>
          </div>

          <div className="mt-2 sm:mt-4 lg:mt-24">
            <p className="text-base sm:text-lg lg:text-xl text-[#2F6A53]/70 font-light leading-relaxed font-sans">唤醒团队的伟大想法</p>
          </div>
        </div>
      </div>

      {/* Bottom/Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md space-y-4 sm:space-y-6 lg:space-y-8">
          <Card className="border-none shadow-lg bg-[#FFFBF2]">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-[#2F6A53]">欢迎回来</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-8">
                <button
                  type="button"
                  className={`text-base pb-1 ${mode === 'otp' ? 'text-[#2F6A53] border-b-2 border-[#2F6A53] font-semibold' : 'text-[#2F6A53]'}`}
                  onClick={() => setMode('otp')}
                >
                  验证码登录
                </button>
                <button
                  type="button"
                  className={`text-base pb-1 ${mode === 'password' ? 'text-[#2F6A53] border-b-2 border-[#2F6A53] font-semibold' : 'text-[#2F6A53]'}`}
                  onClick={() => setMode('password')}
                >
                  密码登录
                </button>
              </div>

              {mode === 'otp' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp-email" className="text-[#2F6A53]">邮箱</Label>
                    <TouchOptimizedInput
                      id="otp-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="text-sm placeholder:text-xs placeholder:text-gray-400"
                    />
                  </div>
                <div className="space-y-2">
                  <Label className="text-[#2F6A53]">验证码</Label>
                  <div className="flex items-center gap-2">
                    <TouchOptimizedInput
                      type="text"
                      placeholder="请输入6位验证码"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      required
                      className="text-sm placeholder:text-xs placeholder:text-gray-400"
                    />
                    <Button 
                      type="button" 
                      className="bg-[#2F6A53] hover:bg-[#2F6A53]/90 text-white text-xs" 
                      onClick={sendCode} 
                      disabled={isLoading || countdown > 0}
                    >
                      {countdown > 0 ? `${countdown}秒后重发` : (otpSent ? '重新发送' : '发送验证码')}
                    </Button>
                  </div>
                </div>
                <TouchOptimizedButton
                  type="button"
                  className="w-full bg-[#2F6A53] hover:bg-[#2F6A53]/90 text-white rounded-lg h-12"
                  disabled={isLoading || !otp}
                  onClick={handleOtpLogin}
                >
                  登录
                </TouchOptimizedButton>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#2F6A53]">邮箱</Label>
                    <TouchOptimizedInput
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="text-sm placeholder:text-xs placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[#2F6A53]">密码</Label>
                    <TouchOptimizedInput
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="text-sm placeholder:text-xs placeholder:text-gray-400"
                    />
                  </div>
                  <TouchOptimizedButton
                    type="submit"
                    className="w-full bg-[#2F6A53] hover:bg-[#2F6A53]/90 text-white rounded-lg h-12"
                    disabled={isLoading}
                    onClick={() => {}}
                  >
                    {isLoading ? "登录中..." : "登录"}
                  </TouchOptimizedButton>
                </form>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#FFFBF2] px-2 text-gray-500">或</span>
                </div>
              </div>

              <TouchOptimizedButton
                type="button"
                onClick={() => router.push('/dashboard')}
                className="w-full border-[#2F6A53]/20 text-[#2F6A53] hover:bg-[#2F6A53]/5 bg-transparent font-medium h-12"
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
