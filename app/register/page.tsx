"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'
import { TouchOptimizedButton, TouchOptimizedInput } from '../../components/ui/mobile-touch-optimizations'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0) // 倒计时状态
  const router = useRouter()
  const { register, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard')
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

  const sendOtp = async () => {
    if (!email) {
      toast.error('请先填写邮箱')
      return
    }
    try {
      setIsLoading(true)
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'register' }),
      })
      if (!res.ok) throw new Error('发送失败')
      setOtpSent(true)
      setCountdown(60) // 开始60秒倒计时
      toast.success('验证码已发送，请查收')
    } catch (err) {
      toast.error('发送验证码失败')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('请输入6位验证码')
      return
    }
    
    try {
      setIsLoading(true)
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        setOtpVerified(true)
        toast.success('验证码验证成功')
      } else {
        toast.error(data.error?.message || '验证码错误')
      }
    } catch (err) {
      toast.error('验证码验证失败')
    } finally {
      setIsLoading(false)
    }
  }

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return '密码至少需要8位字符'
    if (!/(?=.*[a-z])/.test(pwd)) return '密码需要包含至少一个小写字母'
    if (!/(?=.*[A-Z])/.test(pwd)) return '密码需要包含至少一个大写字母'
    if (!/(?=.*\d)/.test(pwd)) return '密码需要包含至少一个数字'
    return null
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !email || !password) {
      toast.error('请填写完整信息')
      return
    }
    if (!otpVerified) {
      toast.error('请先验证邮箱')
      return
    }
    const pwdError = validatePassword(password)
    if (pwdError) {
      toast.error(pwdError)
      return
    }
    try {
      setIsLoading(true)
      const ok = await register(username, email, password)
      if (ok) router.push('/login')
    } finally {
      setIsLoading(false)
    }
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

      {/* Bottom/Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md space-y-4 sm:space-y-6 lg:space-y-8">
          <Card className="border-none shadow-lg bg-[#FFFBF2]">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-[#2F6A53]">创建账户</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[#2F6A53]">昵称</Label>
                  <TouchOptimizedInput 
                    id="username" 
                    value={username} 
                    onChange={e=>setUsername(e.target.value)} 
                    placeholder="你的昵称" 
                    required 
                    className="text-sm placeholder:text-xs placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#2F6A53]">邮箱</Label>
                  <div className="flex items-center gap-2">
                    <TouchOptimizedInput 
                      id="email" 
                      type="email" 
                      value={email} 
                      onChange={e=>setEmail(e.target.value)} 
                      placeholder="your@email.com" 
                      required 
                      disabled={otpVerified}
                      className="text-sm placeholder:text-xs placeholder:text-gray-400"
                    />
                    {!otpVerified && (
                      <Button 
                        type="button" 
                        className="bg-[#2F6A53] hover:bg-[#2F6A53]/90 text-white text-xs"
                        onClick={sendOtp} 
                        disabled={isLoading || !email || countdown > 0}
                        size="sm"
                      >
                        {countdown > 0 ? `${countdown}秒后重发` : (otpSent ? '重新发送' : '发送验证码')}
                      </Button>
                    )}
                  </div>
                  {otpVerified && (
                    <p className="text-sm text-green-600">✓ 邮箱验证成功</p>
                  )}
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
                      disabled={otpVerified}
                      className="text-sm placeholder:text-xs placeholder:text-gray-400"
                    />
                    {!otpVerified && (
                      <Button 
                        type="button" 
                        className="bg-[#2F6A53] hover:bg-[#2F6A53]/90 text-white text-xs"
                        onClick={verifyOtp} 
                        disabled={isLoading || otp.length !== 6}
                        size="sm"
                      >
                        {isLoading ? '验证中...' : '验证'}
                      </Button>
                    )}
                  </div>
                  {otpVerified && (
                    <p className="text-sm text-green-600">✓ 验证码验证成功</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#2F6A53]">密码</Label>
                  <TouchOptimizedInput 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={e=>setPassword(e.target.value)} 
                    placeholder="至少8位，包含大小写字母和数字" 
                    required 
                    className="text-sm placeholder:text-xs placeholder:text-gray-400"
                  />
                </div>
                <TouchOptimizedButton 
                  type="submit" 
                  className="w-full bg-[#2F6A53] hover:bg-[#2F6A53]/90 text-white rounded-lg h-12" 
                  disabled={isLoading || !otpVerified}
                >
                  {isLoading ? '注册中...' : '注册'}
                </TouchOptimizedButton>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs sm:text-sm text-muted-foreground px-2">
            已有账户？{" "}
            <a href="/login" className="text-[#2F6A53] hover:underline font-medium">
              去登录
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}


