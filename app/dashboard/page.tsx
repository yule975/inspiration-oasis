"use client"

import type React from "react"
import { useState } from "react"
import {
  Settings,
  Lightbulb,
  Bell,
  Bot,
  Sparkles,
  Gem,
  Compass,
  Grid3X3,
  List,
  User,
  Wand2,
  Tag,
  Plus,
  Clock,
  Pin,
  Database,
  Heart,
  MessageSquare,
  FileText,
  MessageCircle,
  Copy,
  Activity,
  TrendingUp,
  Zap,
  Brain,
  Target,
  PieChart,
  RefreshCw,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Button } from "../../components/ui/button"
import { Tabs, TabsContent } from "../../components/ui/tabs"
import { Textarea } from "../../components/ui/textarea"
import { Badge } from "../../components/ui/badge"
import { Card, CardContent, CardHeader } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { TouchFeedback, useSwipeGesture, MobileScrollContainer } from "../../components/ui/mobile-enhancements"
import { TouchOptimizedButton, PullToRefresh, FloatingActionButton, MobileActionBar } from "../../components/ui/mobile-touch-optimizations"

// Mock data
const mockIdeas = [
  {
    id: 1,
    content: "创建一个AI助手，可以根据用户输入的内容，自动生成文章大纲和初稿。",
    author: "张三",
    timestamp: "5分钟前",
    likes: 15,
    comments: 3,
    tags: ["AI", "写作", "效率"],
  },
  {
    id: 2,
    content: "设计一个智能推荐系统，根据用户的浏览历史和兴趣，推荐相关的学习资源和课程。",
    author: "李四",
    timestamp: "1小时前",
    likes: 8,
    comments: 1,
    tags: ["推荐系统", "学习", "AI"],
  },
  {
    id: 3,
    content: "开发一个基于区块链的版权保护平台，让原创作者可以更好地保护自己的作品。",
    author: "王五",
    timestamp: "2小时前",
    likes: 22,
    comments: 5,
    tags: ["区块链", "版权", "安全"],
  },
]

const mockAssets = [
  {
    id: 1,
    title: "AI写作助手Prompt",
    description: "一个可以生成文章大纲和初稿的Prompt。",
    category: "Prompts",
    tags: ["AI", "写作"],
    createdAt: "2023-11-15",
    author: "张三",
  },
  {
    id: 2,
    title: "智能推荐系统教程",
    description: "一个关于如何设计智能推荐系统的教程。",
    category: "工具技巧",
    tags: ["推荐系统", "学习"],
    createdAt: "2023-11-14",
    author: "李四",
  },
  {
    id: 3,
    title: "区块链版权保护方案",
    description: "一个基于区块链的版权保护方案。",
    category: "深度分析",
    tags: ["区块链", "版权"],
    createdAt: "2023-11-13",
    author: "王五",
  },
]

const mockAIBrief = {
  date: "2023年11月16日",
  news: [
    {
      id: 1,
      title: "AI技术在医疗领域的应用",
      summary: "AI技术正在改变医疗行业的方方面面，从疾病诊断到药物研发，AI都发挥着越来越重要的作用。",
      url: "https://example.com/ai-in-healthcare",
      tags: ["AI", "医疗"],
    },
    {
      id: 2,
      title: "区块链技术在金融领域的应用",
      summary: "区块链技术正在为金融行业带来革命性的变革，从支付到交易，区块链都展现出巨大的潜力。",
      url: "https://example.com/blockchain-in-finance",
      tags: ["区块链", "金融"],
    },
    {
      id: 3,
      title: "人工智能在教育领域的应用",
      summary: "人工智能正在为教育行业带来新的机遇，从个性化学习到智能辅导，AI都为学生和教师提供了更多的可能性。",
      url: "https://example.com/ai-in-education",
      tags: ["AI", "教育"],
    },
  ],
}

const mockTrendData = {
  weeklyStats: {
    totalIdeas: 125,
    totalAssets: 88,
    activeUsers: 320,
    topContributor: "李四",
  },
  hotTopics: [
    { topic: "GPT-4", count: 56, trend: "+12%" },
    { topic: "代码审查", count: 45, trend: "+8%" },
    { topic: "用户体验", count: 38, trend: "+5%" },
  ],
  emergingTrends: [
    { trend: "AI安全", growth: "+25%", description: "随着AI技术的普及，AI安全问题越来越受到关注。" },
    { trend: "Web3", growth: "+18%", description: "Web3技术正在为互联网带来新的变革。" },
    { trend: "低代码开发", growth: "+15%", description: "低代码开发正在降低软件开发的门槛。" },
  ],
}

const aiEnhancements = [
  { type: "optimize", label: "优化表达", icon: <Sparkles className="h-3 w-3" /> },
  { type: "expand", label: "扩展思路", icon: <Compass className="h-3 w-3" /> },
  { type: "tone", label: "润色语气", icon: <Wand2 className="h-3 w-3" /> },
]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("ideas")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAIEnhancement, setShowAIEnhancement] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [selectedIdea, setSelectedIdea] = useState<any>(null)
  const [showAISummary, setShowAISummary] = useState(false)
  const [aiSummaryContent, setAiSummaryContent] = useState("")
  const [inputValue, setInputValue] = useState("")
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isAIBriefExpanded, setIsAIBriefExpanded] = useState(false)
  const [showAIBriefModal, setShowAIBriefModal] = useState(false)
  const [showAIMenu, setShowAIMenu] = useState(false)
  const [aiChatMessage, setAIChatMessage] = useState("")

  const [ideas, setIdeas] = useState(mockIdeas)
  const [assets, setAssets] = useState(mockAssets)
  const [assetCategory, setAssetCategory] = useState("全部")
  const [assetView, setAssetView] = useState("团队资产")
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [sortMode, setSortMode] = useState<"latest" | "popular">("latest")

  // 滑动手势支持
  const tabs = ["ideas", "assets", "analytics"]
  const currentTabIndex = tabs.indexOf(activeTab)
  
  const swipeGesture = useSwipeGesture({
    onSwipeLeft: () => {
      const nextIndex = Math.min(currentTabIndex + 1, tabs.length - 1)
      if (nextIndex !== currentTabIndex) {
        setActiveTab(tabs[nextIndex])
      }
    },
    onSwipeRight: () => {
      const prevIndex = Math.max(currentTabIndex - 1, 0)
      if (prevIndex !== currentTabIndex) {
        setActiveTab(tabs[prevIndex])
      }
    },
    threshold: 100
  })

  const handleStartDiscussion = (newsItem: (typeof mockAIBrief.news)[0]) => {
    // Auto-fill the input with news content
    const discussionContent = `${newsItem.title}\n\n${newsItem.summary}\n\n原文链接：${newsItem.url}\n\n@同事，谈谈你的看法...`
    setInputValue(discussionContent)

    // Set suggested tags from news
    setSuggestedTags(newsItem.tags)

    // Scroll to input area and focus
    const inputArea = document.querySelector('input[placeholder*="有什么新想法"]') as HTMLInputElement
    if (inputArea) {
      inputArea.scrollIntoView({ behavior: "smooth", block: "center" })
      setTimeout(() => {
        inputArea.focus()
        // Position cursor at the beginning after the content
        const cursorPosition = discussionContent.lastIndexOf("@同事")
        inputArea.setSelectionRange(cursorPosition, cursorPosition)
      }, 500)
    }
  }

  const handleSubmitIdea = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const idea = {
      id: Date.now(),
      content: inputValue,
      author: "当前用户",
      timestamp: "刚刚",
      likes: 0,
      comments: 0,
      tags: selectedTags,
    }

    setIdeas([idea, ...ideas])
    setInputValue("")
    setSuggestedTags([])
    setSelectedTags([])
    setShowAIEnhancement(false)
  }

  const handleAIEnhancement = (type: string) => {
    // Mock AI enhancement - in real app, this would call an AI API
    let enhancedText = inputValue
    switch (type) {
      case "optimize":
        enhancedText = inputValue + " [AI优化后的版本]"
        break
      case "expand":
        enhancedText = inputValue + " 此外，这个想法还可以扩展到更多应用场景..."
        break
      case "tone":
        enhancedText = "从专业角度来看，" + inputValue
        break
    }
    setInputValue(enhancedText)
    setShowAIEnhancement(false)
  }

  const generateSuggestedTags = (content: string) => {
    // Mock tag suggestion - in real app, this would use AI
    const mockTags = ["AI", "技术", "创新", "效率", "工具"]
    setSuggestedTags(mockTags.slice(0, 3))
  }

  const handleArchiveIdea = (ideaId: number) => {
    const idea = ideas.find((i) => i.id === ideaId)
    if (idea) {
      const asset = {
        id: Date.now(),
        title: idea.content.substring(0, 50) + "...",
        description: idea.content,
        category: "从灵感墙归档",
        tags: idea.tags,
        createdAt: new Date().toISOString().split("T")[0],
        author: idea.author,
      }
      setAssets([asset, ...assets])
      setIdeas(ideas.filter((i) => i.id !== ideaId))
    }
  }

  const handleLikeIdea = (ideaId: number) => {
    setIdeas(ideas.map((idea) => (idea.id === ideaId ? { ...idea, likes: idea.likes + 1 } : idea)))
  }

  const handleRefresh = () => {
    // 模拟刷新数据
    setTimeout(() => {
      setIdeas([...mockIdeas])
      setAssets([...mockAssets])
    }, 1000)
  }

  const [isRefreshing, setIsRefreshing] = useState(false)

  const onRefresh = () => {
    setIsRefreshing(true)
    handleRefresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-[#2F6A53] rounded-lg">
                  <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-[#2F6A53]">灵感绿洲</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">团队协作空间</p>
                </div>
              </div>

              <div className="hidden lg:flex items-center space-x-1">
                <Button
                  variant={activeTab === "ideas" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("ideas")}
                  className={`flex items-center space-x-2 px-4 py-2 ${
                    activeTab === "ideas" ? "bg-[#2F6A53] text-white" : "text-gray-600 hover:text-[#2F6A53]"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>灵感墙</span>
                </Button>
                <Button
                  variant={activeTab === "assets" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("assets")}
                  className={`flex items-center space-x-2 px-4 py-2 ${
                    activeTab === "assets" ? "bg-[#2F6A53] text-white" : "text-gray-600 hover:text-[#2F6A53]"
                  }`}
                >
                  <Gem className="h-4 w-4" />
                  <span>资产库</span>
                </Button>
                <Button
                  variant={activeTab === "analytics" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("analytics")}
                  className={`flex items-center space-x-2 px-4 py-2 ${
                    activeTab === "analytics" ? "bg-[#2F6A53] text-white" : "text-gray-600 hover:text-[#2F6A53]"
                  }`}
                >
                  <Compass className="h-4 w-4" />
                  <span>趋势分析</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIBriefModal(true)}
                  className="relative hover:bg-[#2F6A53]/10 h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                >
                  <Bell className="h-4 w-4" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#2F6A53] rounded-full"></div>
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2">
                <Settings className="h-4 w-4" />
              </Button>
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback className="text-xs">用户</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto pb-2 sm:pb-0">
              <Button
                variant={activeTab === "ideas" ? "default" : "outline"}
                onClick={() => setActiveTab("ideas")}
                className={`flex-shrink-0 h-10 px-3 sm:px-4 text-sm ${activeTab === "ideas" ? "bg-[#2F6A53] hover:bg-[#2F6A53]/90" : "border-gray-200 hover:bg-gray-50"} touch-manipulation`}
              >
                <Lightbulb className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">灵感墙</span>
                <span className="xs:hidden">灵感</span>
              </Button>
              <Button
                variant={activeTab === "assets" ? "default" : "outline"}
                onClick={() => setActiveTab("assets")}
                className={`flex-shrink-0 h-10 px-3 sm:px-4 text-sm ${activeTab === "assets" ? "bg-[#2F6A53] hover:bg-[#2F6A53]/90" : "border-gray-200 hover:bg-gray-50"} touch-manipulation`}
              >
                <Gem className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">资产库</span>
                <span className="xs:hidden">资产</span>
              </Button>
              <Button
                variant={activeTab === "analytics" ? "default" : "outline"}
                onClick={() => setActiveTab("analytics")}
                className={`flex-shrink-0 h-10 px-3 sm:px-4 text-sm ${activeTab === "analytics" ? "bg-[#2F6A53] hover:bg-[#2F6A53]/90" : "border-gray-200 hover:bg-gray-50"} touch-manipulation`}
              >
                <Compass className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">趋势分析</span>
                <span className="xs:hidden">趋势</span>
              </Button>
            </div>
          </div>
        </div>
        <PullToRefresh onRefresh={onRefresh} refreshing={isRefreshing}>
          <Tabs defaultValue="ideas" className="space-y-0" value={activeTab} onValueChange={setActiveTab}>
            {activeTab === "ideas" && (
              <div className="space-y-8" {...swipeGesture}>
              <div className="max-w-6xl mx-auto">
                <div className="flex items-start space-x-3 sm:space-x-4 p-4 sm:p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-[#2F6A53]/10 flex-shrink-0">
                    <AvatarFallback className="text-sm bg-[#2F6A53]/10 text-[#2F6A53]">
                      <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <form onSubmit={handleSubmitIdea} className="space-y-4">
                      <div className="relative">
                        <Textarea
                          placeholder="有什么新想法? @同事, #话题..."
                          value={inputValue}
                          onChange={(e) => {
                            setInputValue(e.target.value)
                            if (e.target.value.trim()) {
                              generateSuggestedTags(e.target.value)
                            }
                          }}
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setIsInputFocused(false)}
                          className="w-full bg-white border-gray-200 focus:border-[#2F6A53] transition-all duration-200 resize-none min-h-[60px] sm:min-h-[80px] text-sm sm:text-base touch-manipulation"
                          rows={2}
                        />
                        {inputValue.trim() && (
                          <div className="absolute right-3 top-3">
                            <div className="relative">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAIEnhancement(!showAIEnhancement)}
                                className="p-2 h-8 w-8 text-[#2F6A53] hover:bg-[#2F6A53]/10 animate-pulse"
                              >
                                <Wand2 className="h-4 w-4" />
                              </Button>
                              {showAIEnhancement && (
                                <div className="absolute right-0 top-full mt-1 bg-gradient-to-br from-[#2F6A53]/95 to-[#2F6A53] border border-[#2F6A53]/30 rounded-lg shadow-xl p-3 space-y-2 z-10 min-w-[140px] animate-in slide-in-from-top-2">
                                  <div className="text-xs text-white/90 mb-2 font-medium">AI助手</div>
                                  {aiEnhancements.map((enhancement) => (
                                    <Button
                                      key={enhancement.type}
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleAIEnhancement(enhancement.type)}
                                      className="w-full justify-start text-xs text-white/90 hover:bg-white/20 hover:text-white h-8 transition-all duration-200"
                                    >
                                      {enhancement.icon}
                                      <span className="ml-2">{enhancement.label}</span>
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {suggestedTags.length > 0 && (
                        <div className="flex items-center space-x-2 animate-in slide-in-from-left-2 duration-300">
                          <div className="flex items-center space-x-1">
                            <Sparkles className="h-3 w-3 text-[#2F6A53]" />
                            <span className="text-sm text-[#2F6A53] font-medium">AI推荐:</span>
                          </div>
                          {suggestedTags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-[#2F6A53]/10 border-[#2F6A53]/30 text-[#2F6A53] animate-in fade-in duration-300"
                              style={{ animationDelay: `${index * 100}ms` }}
                              onClick={() => setSelectedTags([...selectedTags, tag])}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {inputValue.trim() && (
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-2 space-y-2 sm:space-y-0">
                          <Button type="button" variant="outline" size="sm" className="text-gray-600 bg-transparent h-10 touch-manipulation">
                            <Tag className="h-4 w-4 mr-2" />
                            <span className="hidden xs:inline">添加标签</span>
                            <span className="xs:hidden">标签</span>
                          </Button>
                          <Button
                            type="submit"
                            disabled={!inputValue.trim()}
                            className="px-4 sm:px-6 h-10 bg-[#2F6A53] hover:bg-[#2F6A53]/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="hidden xs:inline">发布灵感</span>
                            <span className="xs:hidden">发布</span>
                          </Button>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>

              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">最新灵感</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                    <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto pb-2 sm:pb-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSortMode("latest")}
                        className={`text-xs sm:text-sm transition-all duration-200 flex-shrink-0 h-8 px-3 touch-manipulation ${
                          sortMode === "latest"
                            ? "text-[#2F6A53] font-semibold border-b-2 border-[#2F6A53] pb-1"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <span className="hidden xs:inline">按最新排序</span>
                        <span className="xs:hidden">最新</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSortMode("popular")}
                        className={`text-xs sm:text-sm transition-all duration-200 flex-shrink-0 h-8 px-3 touch-manipulation ${
                          sortMode === "popular"
                            ? "text-[#2F6A53] font-semibold border-b-2 border-[#2F6A53] pb-1"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <span className="hidden xs:inline">按热度排序</span>
                        <span className="xs:hidden">热度</span>
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2 border-l border-gray-200 pl-4 sm:pl-6">
                      <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className={`h-8 w-8 p-0 touch-manipulation ${viewMode === "grid" ? "bg-[#2F6A53] text-white" : ""}`}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className={`h-8 w-8 p-0 touch-manipulation ${viewMode === "list" ? "bg-[#2F6A53] text-white" : ""}`}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div
                  className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" : "space-y-4"}
                >
                  {ideas.map((idea, index) => (
                    <TouchFeedback key={idea.id}>
                      <Card
                        className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/30 group relative touch-manipulation"
                      >
                      <CardContent className="p-8">
                        <div className="space-y-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10 ring-2 ring-[#2F6A53]/10">
                                <AvatarFallback className="text-sm bg-[#2F6A53]/10 text-[#2F6A53]">
                                  {idea.author[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-sm text-gray-900">{idea.author}</p>
                                <p className="text-xs text-gray-500 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {idea.timestamp}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {index === 0 && <Pin className="h-4 w-4 text-[#2F6A53] fill-current" />}
                              <TouchFeedback>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleArchiveIdea(idea.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#2F6A53] hover:bg-[#2F6A53]/10 p-2 touch-manipulation"
                                >
                                <Database className="h-4 w-4" />
                                 </Button>
                               </TouchFeedback>
                            </div>
                          </div>

                          <p className="text-gray-800 leading-relaxed text-base">{idea.content}</p>

                          {idea.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {idea.tags.map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs bg-[#2F6A53]/10 text-[#2F6A53] hover:bg-[#2F6A53]/20 px-3 py-1"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-sm hover:text-red-500 p-2"
                                onClick={() => handleLikeIdea(idea.id)}
                              >
                                <Heart className="h-4 w-4 mr-1" />
                                {idea.likes}
                              </Button>
                              <Button variant="ghost" size="sm" className="text-sm p-2">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                {idea.comments}
                              </Button>
                            </div>

                            <div className="relative">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-sm text-[#2F6A53] hover:bg-[#2F6A53]/10 border-[#2F6A53]/20 hover:border-[#2F6A53]/40 bg-transparent"
                                onClick={() => {
                                  setSelectedIdea(idea)
                                  setShowAIMenu(!showAIMenu)
                                }}
                              >
                                <Bot className="h-4 w-4 mr-1" />
                                AI助手
                              </Button>
                              {showAIMenu && selectedIdea === idea && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-3 space-y-2 z-10 min-w-[120px] animate-in slide-in-from-top-2">
                                  <div className="text-xs text-gray-500 mb-2 font-medium">选择功能</div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setShowAISummary(true)
                                      setShowAIMenu(false)
                                    }}
                                    className="w-full justify-start text-xs hover:bg-[#2F6A53]/10 h-8"
                                  >
                                    <FileText className="h-3 w-3 mr-2" />
                                    智能总结
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setShowAIChat(true)
                                      setShowAIMenu(false)
                                    }}
                                    className="w-full justify-start text-xs hover:bg-[#2F6A53]/10 h-8"
                                  >
                                    <MessageCircle className="h-3 w-3 mr-2" />
                                    深度对话
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {showAISummary && selectedIdea === idea && (
                            <div className="mt-6 p-4 bg-gradient-to-r from-[#2F6A53]/5 to-blue-50/50 rounded-lg border border-[#2F6A53]/20 animate-in slide-in-from-top-2">
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="p-1 bg-[#2F6A53]/10 rounded-full">
                                  <Bot className="h-4 w-4 text-[#2F6A53]" />
                                </div>
                                <span className="text-sm font-semibold text-[#2F6A53]">AI智能总结</span>
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                                  GPT-4
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowAISummary(false)}
                                  className="ml-auto p-1 h-6 w-6 hover:bg-red-100"
                                >
                                  ×
                                </Button>
                              </div>
                              <div className="bg-white/80 p-3 rounded border border-[#2F6A53]/10">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  <span className="font-medium text-[#2F6A53]">核心观点：</span>
                                  {idea.content.split("。")[0]}。
                                  <br />
                                  <span className="font-medium text-[#2F6A53]">关键洞察：</span>
                                  这个想法强调了AI在提升工作效率方面的重要作用，具有很强的实用价值。
                                </p>
                              </div>
                            </div>
                          )}

                          {showAIChat && selectedIdea === idea && (
                            <div className="mt-6 p-4 bg-gradient-to-r from-[#2F6A53]/5 to-purple-50/50 rounded-lg border border-[#2F6A53]/20 animate-in slide-in-from-top-2">
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="p-1 bg-[#2F6A53]/10 rounded-full">
                                  <MessageCircle className="h-4 w-4 text-[#2F6A53]" />
                                </div>
                                <span className="text-sm font-semibold text-[#2F6A53]">AI深度对话</span>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-purple-50 text-purple-600 border-purple-200"
                                >
                                  智能问答
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowAIChat(false)}
                                  className="ml-auto p-1 h-6 w-6 hover:bg-red-100"
                                >
                                  ×
                                </Button>
                              </div>
                              <div className="space-y-3">
                                <div className="bg-white/80 p-3 rounded border border-[#2F6A53]/10">
                                  <div className="flex items-start space-x-2">
                                    <Bot className="h-4 w-4 text-[#2F6A53] mt-0.5" />
                                    <p className="text-sm text-gray-700">
                                      我可以帮您深入分析这个想法，或者回答相关问题。请告诉我您想了解什么？
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Input
                                    placeholder="针对这个灵感提问..."
                                    value={aiChatMessage}
                                    onChange={(e) => setAIChatMessage(e.target.value)}
                                    className="text-sm flex-1"
                                  />
                                  <Button
                                    size="sm"
                                    className="bg-[#2F6A53] hover:bg-[#2F6A53]/90 text-white px-4"
                                    onClick={() => {
                                      // Mock AI response
                                      setAIChatMessage("")
                                    }}
                                  >
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    发送
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      </Card>
                    </TouchFeedback>
                  ))}
                </div>
              </div>
            </div>
          )}

          <TabsContent value="assets" className="space-y-6 mt-0">
            <div className="bg-gray-50/30 border border-border/20 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {["全部", "Prompts", "工具技巧", "深度分析"].map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={
                        selectedCategory === category
                          ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                          : "hover:bg-gray-100"
                      }
                    >
                      {category}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center bg-white border border-border/30 rounded-lg p-1">
                  {["团队资产", "我的资产"].map((view) => (
                    <Button
                      key={view}
                      variant="ghost"
                      size="sm"
                      onClick={() => setAssetView(view)}
                      className={
                        assetView === view
                          ? "bg-[#2F6A53] text-white hover:bg-[#2F6A53]/90 shadow-sm"
                          : "hover:bg-gray-50"
                      }
                    >
                      {view}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4 max-w-6xl mx-auto"
              }
            >
              {assets.map((asset) => (
                <TouchFeedback key={asset.id}>
                  <Card
                    className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/80 group cursor-pointer touch-manipulation"
                  >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                        {asset.category}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <span className="text-xs text-muted-foreground">{asset.createdAt}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
                        {asset.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{asset.description}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">by {asset.author}</p>
                      </div>
                      {asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {asset.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-primary/5 text-primary/80">
                              {tag}
                            </Badge>
                          ))}
                          {asset.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs bg-primary/5 text-primary/80">
                              +{asset.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  </Card>
                </TouchFeedback>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weekly Stats */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-[#2F6A53]" />
                    <h3 className="font-semibold">本周数据</h3>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">新增灵感</span>
                      <span className="font-semibold text-lg">{mockTrendData.weeklyStats.totalIdeas}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">资产入库</span>
                      <span className="font-semibold text-lg">{mockTrendData.weeklyStats.totalAssets}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">活跃用户</span>
                      <span className="font-semibold text-lg">{mockTrendData.weeklyStats.activeUsers}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">贡献之星</span>
                        <Badge variant="outline" className="bg-[#2F6A53]/10 text-[#2F6A53] border-[#2F6A53]/20">
                          {mockTrendData.weeklyStats.topContributor}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hot Topics */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-[#2F6A53]" />
                    <h3 className="font-semibold">热议话题</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockTrendData.hotTopics.map((topic, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#2F6A53]/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-[#2F6A53]">{index + 1}</span>
                          </div>
                          <span className="font-medium">{topic.topic}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{topic.count}次提及</span>
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            {topic.trend}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Emerging Trends */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-[#2F6A53]" />
                  <h3 className="font-semibold">新兴趋势发现</h3>
                  <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                    AI分析
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mockTrendData.emergingTrends.map((trend, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-br from-[#2F6A53]/5 to-[#2F6A53]/10 rounded-lg border border-[#2F6A53]/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{trend.trend}</h4>
                        <Badge variant="outline" className="text-[#2F6A53] border-[#2F6A53]/30 bg-white">
                          {trend.growth}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{trend.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-[#2F6A53]" />
                  <h3 className="font-semibold">AI洞察报告</h3>
                  <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                    每周更新
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                    <div className="flex items-start space-x-3">
                      <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">关联发现</h4>
                        <p className="text-sm text-muted-foreground">
                          经常讨论"GPT-4"的用户，也频繁提及"代码审查"和"安全"话题，显示出AI在软件开发质量保证方面的重要应用趋势。
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-green-50/50 rounded-lg border border-green-200/50">
                    <div className="flex items-start space-x-3">
                      <PieChart className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">内容质量分析</h4>
                        <p className="text-sm text-muted-foreground">
                          本周高质量内容（获得5+点赞）主要集中在"实用工具"和"技术深度解析"类别，建议团队继续关注这些方向。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </PullToRefresh>
      </div>

      {/* 浮动操作按钮 */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3">
        <TouchOptimizedButton
          onClick={() => setActiveTab('ideas')}
          className="w-14 h-14 rounded-full bg-[#2F6A53] hover:bg-[#2F6A53]/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-6 w-6" />
        </TouchOptimizedButton>
        <TouchOptimizedButton
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-12 h-12 rounded-full bg-white hover:bg-gray-50 text-[#2F6A53] shadow-md hover:shadow-lg border border-gray-200 transition-all duration-200"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </TouchOptimizedButton>
      </div>

      {showAIBriefModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#2F6A53]/10 rounded-lg">
                    <Bell className="h-5 w-5 text-[#2F6A53]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">AI简报</h2>
                    <p className="text-sm text-gray-500">{mockAIBrief.date}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIBriefModal(false)}
                  className="hover:bg-gray-100"
                >
                  ×
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {mockAIBrief.news.map((newsItem) => (
                  <div key={newsItem.id} className="p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 flex-1">{newsItem.title}</h3>
                        <div className="flex flex-wrap gap-1 ml-4">
                          {newsItem.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs bg-[#2F6A53]/10 text-[#2F6A53] border-[#2F6A53]/20"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{newsItem.summary}</p>
                      <div className="flex items-center justify-between pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleStartDiscussion(newsItem)
                            setShowAIBriefModal(false)
                          }}
                          className="text-[#2F6A53] border-[#2F6A53]/30 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:border-blue-300 transition-all duration-200"
                        >
                          了解详情 ↗
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
