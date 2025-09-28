"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { TouchOptimizedButton, TouchOptimizedInput } from '../../components/ui/mobile-touch-optimizations'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { register, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard')
  }, [isAuthenticated, router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !email || !password) {
      toast.error('请填写完整信息')
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
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-[#2F6A53] leading-tight font-sans tracking-wide">灵感绿洲</h1>
          </div>

          <div className="mt-2 sm:mt-4 lg:mt-24">
            <p className="text-base sm:text-lg lg:text-xl text-[#2F6A53]/70 font-light leading-relaxed font-sans">唤醒团队的伟大想法</p>
          </div>
        </div>
      </div>

      {/* Bottom/Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md space-y-4 sm:space-y-6 lg:space-y-8">
          <Card className="border-border/50 shadow-xl backdrop-blur-sm bg-card/95">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">创建账户</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">昵称</Label>
                  <TouchOptimizedInput 
                    id="username" 
                    value={username} 
                    onChange={e=>setUsername(e.target.value)} 
                    placeholder="你的昵称" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <TouchOptimizedInput 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={e=>setEmail(e.target.value)} 
                    placeholder="your@email.com" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <TouchOptimizedInput 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={e=>setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
                <TouchOptimizedButton 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  size="lg"
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


