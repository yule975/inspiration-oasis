"use client"

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Separator } from '../../components/ui/separator'
import { Heart, MessageCircle, Search, Plus, Filter, TrendingUp, Clock, User, X } from 'lucide-react'
import { api } from '../../lib/api'
import { toast } from 'sonner'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'

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

function InspirationPageContent() {
  const { user, isAuthenticated } = useAuth()
  const searchParams = useSearchParams()
  const preview = searchParams?.get('preview') === '1'
  const router = useRouter()
  const [inspirations, setInspirations] = useState<Inspiration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('latest')
  const [showStructuredModal, setShowStructuredModal] = useState(false)
  const [ideaTitle, setIdeaTitle] = useState('')
  const [problem, setProblem] = useState('')
  const [businessTags, setBusinessTags] = useState<string[]>([])
  const [businessInput, setBusinessInput] = useState('')
  const [aiSolution, setAiSolution] = useState('')
  const [impact, setImpact] = useState('')
  const [techTags, setTechTags] = useState<string[]>([])
  const [techInput, setTechInput] = useState('')
  const [creating, setCreating] = useState(false)

  // 不再强制登录拦截：未登录也可浏览正式页面

  // 获取灵感列表
  const fetchInspirations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      params.append('sort', sortBy)
      
      const response = await api.get(`/ideas?${params.toString()}`)
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
    fetchInspirations()
  }, [searchQuery, selectedCategory, sortBy])

  // 点赞功能
  const handleLike = async (inspirationId: string) => {
    try {
      await api.post(`/ideas/${inspirationId}/like`)
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

  const addBusinessTag = () => {
    const v = businessInput.trim()
    if (!v) return
    if (!businessTags.includes(v)) setBusinessTags([...businessTags, v])
    setBusinessInput('')
  }
  const removeBusinessTag = (t: string) => setBusinessTags(businessTags.filter(x => x !== t))
  const addTechTag = () => {
    const v = techInput.trim()
    if (!v) return
    if (!techTags.includes(v)) setTechTags([...techTags, v])
    setTechInput('')
  }
  const removeTechTag = (t: string) => setTechTags(techTags.filter(x => x !== t))

  const handleStructuredCreate = async () => {
    if (!problem.trim()) {
      toast.error('请填写痛点/需求描述')
      return
    }
    try {
      setCreating(true)
      const title = ideaTitle || problem.substring(0, 50)
      const content = `【痛点/需求】\n${problem}\n\n【AI解决方案构想】\n${aiSolution}\n\n【预期价值/ROI】\n${impact}`
      const tags = [...businessTags, ...techTags]
      const res = await api.post('/ideas', { title, content, category: '结构化发布', tags })
      if (res?.data?.success === false) throw new Error(res.data.error || '创建失败')
      toast.success('已创建结构化灵感')
      setShowStructuredModal(false)
      setIdeaTitle(''); setProblem(''); setAiSolution(''); setImpact(''); setBusinessTags([]); setTechTags([])
      fetchInspirations()
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || '创建失败')
    } finally {
      setCreating(false)
    }
  }

  // 未登录也渲染页面（创建入口会在下游校验）

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#2F6A53] mb-2">
            灵感绿洲
          </h1>
          <p className="text-[#2F6A53]/70">发现和分享创意灵感</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-[#FFFBF2] rounded-xl p-4 md:p-6 mb-6 shadow-lg border-none">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索灵感..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm placeholder:text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
                className={`touch-manipulation ${selectedCategory === 'all' ? 'bg-[#2F6A53] hover:bg-[#2F6A53]/90 text-white' : 'border-[#2F6A53]/20 text-[#2F6A53] hover:bg-[#2F6A53]/5'}`}
              >
                全部
              </Button>
              <Button
                variant={selectedCategory === '结构化发布' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('结构化发布')}
                className={`touch-manipulation ${selectedCategory === '结构化发布' ? 'bg-[#2F6A53] hover:bg-[#2F6A53]/90 text-white' : 'border-[#2F6A53]/20 text-[#2F6A53] hover:bg-[#2F6A53]/5'}`}
              >
                结构化
              </Button>
              <Button
                variant={selectedCategory === '创新' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('创新')}
                className={`touch-manipulation ${selectedCategory === '创新' ? 'bg-[#2F6A53] hover:bg-[#2F6A53]/90 text-white' : 'border-[#2F6A53]/20 text-[#2F6A53] hover:bg-[#2F6A53]/5'}`}
              >
                创新
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
              <Card key={inspiration.id} className="hover:shadow-xl transition-shadow duration-200 bg-[#FFFBF2] border-none shadow-lg touch-manipulation">
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
                  <CardTitle className="text-lg text-[#2F6A53]">{inspiration.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {inspiration.content}
                  </p>
                  
                  {/* 标签 */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {inspiration.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-[#2F6A53]/10 text-[#2F6A53]">
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
                    <Badge variant="outline" className="border-[#2F6A53]/20 text-[#2F6A53]">{inspiration.category}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 创建按钮 */}
        <div className="fixed bottom-6 right-6">
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setShowStructuredModal(true)}
              className="w-14 h-14 rounded-full shadow-lg touch-manipulation bg-[#2F6A53] hover:bg-[#2F6A53]/90 text-white"
              size="icon"
              title="结构化发布"
            >
              <Plus className="w-6 h-6" />
            </Button>
            <Button
              onClick={() => router.push('/create-inspiration')}
              variant="outline"
              className="w-14 h-14 rounded-full shadow-lg touch-manipulation"
              size="icon"
              title="快速创建"
            >
              +
            </Button>
          </div>
        </div>

        {/* 结构化发布弹窗 */}
        {showStructuredModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-[#FFFBF2] rounded-xl shadow-2xl border border-border/10">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-[#2F6A53]">发布结构化灵感</h3>
                <button className="p-1 text-gray-500 hover:text-gray-700" onClick={() => setShowStructuredModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-[#2F6A53]">灵感标题（可选）</Label>
                  <Input value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)} placeholder="给这个灵感起个名字" className="text-sm placeholder:text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2F6A53]">痛点/需求描述（What's the problem?）</Label>
                  <Textarea value={problem} onChange={(e) => setProblem(e.target.value)} rows={4} placeholder="例：每周销售团队要花10小时手动整理客户反馈报告…" className="text-sm placeholder:text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2F6A53]">所属业务/场景（Who benefits?）</Label>
                  <div className="flex gap-2">
                    <Input value={businessInput} onChange={(e) => setBusinessInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBusinessTag() }}} placeholder="#市场部 #客户分析… 回车添加" className="text-sm" />
                    <Button type="button" variant="outline" onClick={addBusinessTag}>添加</Button>
                  </div>
                  {businessTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {businessTags.map(t => (
                        <Badge key={t} variant="secondary" className="text-xs cursor-pointer" onClick={() => removeBusinessTag(t)}>
                          {t} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2F6A53]">AI解决方案构想（How can AI help?）</Label>
                  <Textarea value={aiSolution} onChange={(e) => setAiSolution(e.target.value)} rows={4} placeholder="例：利用GPT-4分析原始反馈文本，自动提取关键议题、情感倾向，并生成摘要…" className="text-sm placeholder:text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2F6A53]">预期价值/ROI（What's the impact?）</Label>
                  <Textarea value={impact} onChange={(e) => setImpact(e.target.value)} rows={3} placeholder="例：预计节省工时10小时/周，提升报告洞察质量30%…" className="text-sm placeholder:text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2F6A53]">关联工具/技术（What to use?）</Label>
                  <div className="flex gap-2">
                    <Input value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTechTag() }}} placeholder="#GPT-4 #Python #LangChain… 回车添加" className="text-sm" />
                    <Button type="button" variant="outline" onClick={addTechTag}>添加</Button>
                  </div>
                  {techTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {techTags.map(t => (
                        <Badge key={t} variant="secondary" className="text-xs cursor-pointer" onClick={() => removeTechTag(t)}>
                          {t} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowStructuredModal(false)}>取消</Button>
                <Button onClick={handleStructuredCreate} disabled={creating} className="bg-[#2F6A53] hover:bg-[#2F6A53]/90 text-white">{creating ? '提交中…' : '结构化发布'}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function InspirationPage() {
  return (
    <Suspense fallback={null}>
      <InspirationPageContent />
    </Suspense>
  )
}