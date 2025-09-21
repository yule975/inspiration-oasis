"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Heart, MessageCircle, Search, Plus, Filter, TrendingUp, Clock, User } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface Inspiration {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  author: {
    id: string
    name: string
    avatar?: string
  }
  likes: number
  comments: number
  isLiked: boolean
  createdAt: string
  updatedAt: string
}

// 模拟数据
const mockInspirations: Inspiration[] = [
  {
    id: '1',
    title: '创新思维的力量',
    content: '在快速变化的世界中，创新思维是我们适应和成长的关键。通过跳出传统框架，我们能够发现新的可能性...',
    category: '创新',
    tags: ['思维', '创新', '成长'],
    author: {
      id: 'user1',
      name: '张三',
      avatar: '/avatars/user1.jpg'
    },
    likes: 42,
    comments: 8,
    isLiked: false,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    title: '设计中的极简主义',
    content: '极简主义不仅仅是一种设计风格，更是一种生活哲学。通过减少不必要的元素，我们能够突出真正重要的内容...',
    category: '设计',
    tags: ['极简', '设计', '哲学'],
    author: {
      id: 'user2',
      name: '李四',
      avatar: '/avatars/user2.jpg'
    },
    likes: 28,
    comments: 5,
    isLiked: true,
    createdAt: '2024-01-14T15:20:00Z',
    updatedAt: '2024-01-14T15:20:00Z'
  }
]

export default function InspirationPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [inspirations, setInspirations] = useState<Inspiration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('latest')

  // 如果未登录，重定向到登录页
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, router])

  // 获取灵感列表
  const fetchInspirations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      params.append('sort', sortBy)
      
      const response = await api.get(`/inspirations?${params.toString()}`)
      setInspirations(response.data.data || [])
    } catch (error) {
      console.error('获取灵感列表失败:', error)
      toast.error('获取灵感列表失败')
      // 使用模拟数据
      setInspirations(mockInspirations)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchInspirations()
    }
  }, [isAuthenticated, searchQuery, selectedCategory, sortBy])

  // 点赞功能
  const handleLike = async (inspirationId: string) => {
    try {
      await api.post(`/inspirations/${inspirationId}/like`)
      setInspirations(prev => prev.map(item => 
        item.id === inspirationId 
          ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 }
          : item
      ))
    } catch (error) {
      console.error('点赞失败:', error)
      toast.error('操作失败')
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            灵感广场
          </h1>
          <p className="text-gray-600">发现和分享创意灵感</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 md:p-6 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索灵感..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
                className="touch-manipulation"
              >
                全部
              </Button>
              <Button
                variant={selectedCategory === '创新' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('创新')}
                className="touch-manipulation"
              >
                创新
              </Button>
              <Button
                variant={selectedCategory === '设计' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('设计')}
                className="touch-manipulation"
              >
                设计
              </Button>
            </div>
          </div>
        </div>

        {/* 灵感列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // 加载状态
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            inspirations.map((inspiration) => (
              <Card key={inspiration.id} className="hover:shadow-lg transition-shadow duration-200 bg-white/80 backdrop-blur-sm touch-manipulation">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={inspiration.author.avatar} />
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{inspiration.author.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(inspiration.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{inspiration.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {inspiration.content}
                  </p>
                  
                  {/* 标签 */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {inspiration.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Separator className="mb-4" />

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(inspiration.id)}
                        className={`touch-manipulation ${inspiration.isLiked ? 'text-red-500' : 'text-gray-500'}`}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${inspiration.isLiked ? 'fill-current' : ''}`} />
                        {inspiration.likes}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-500 touch-manipulation">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {inspiration.comments}
                      </Button>
                    </div>
                    <Badge variant="outline">{inspiration.category}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 创建按钮 */}
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={() => router.push('/create-inspiration')}
            className="w-14 h-14 rounded-full shadow-lg touch-manipulation"
            size="icon"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}