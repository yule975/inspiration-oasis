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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4 sm:p-6 lg:p-12">
      <div className="w-full max-w-2xl">
        <Card className="bg-[#FFFBF2] border border-[#EDE7DD] shadow-xl">
          <CardHeader>
            <CardTitle className="text-4xl md:text-5xl font-extrabold text-[#164B3A] text-center">创建账户</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#164B3A]">昵称</Label>
                <TouchOptimizedInput id="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="你的昵称" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#164B3A]">邮箱</Label>
                <TouchOptimizedInput id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#164B3A]">密码</Label>
                <TouchOptimizedInput id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <TouchOptimizedButton type="submit" className="w-full h-12 text-lg bg-[#2F6A53] hover:bg-[#2F6A53]/90" disabled={isLoading}>
                {isLoading ? '注册中...' : '注册'}
              </TouchOptimizedButton>
              <p className="text-center text-xs sm:text-sm text-[#164B3A]/70">
                已有账户？ <a href="/login" className="text-[#2F6A53] hover:underline font-medium">去登录</a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


