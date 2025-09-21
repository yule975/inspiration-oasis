import { Request, Response } from 'express'
import { prisma } from '@/config/database'
import { AppError } from '@/middleware/errorHandler'
import { cacheService } from '@/config/redis'

class AnalyticsController {
  // 获取仪表板统计数据
  async getDashboardStats(req: Request, res: Response) {
    const { period = 'week' } = req.query as any

    try {
      const cacheKey = `dashboard-stats:${period}`
      
      // 尝试从缓存获取
      const cachedStats = await cacheService.get(cacheKey)
      if (cachedStats) {
        return res.json({
          success: true,
          data: cachedStats
        })
      }

      // 计算时间范围
      const timeRange = this.getTimeRange(period)
      const previousTimeRange = this.getPreviousTimeRange(period)

      // 并行查询当前和上期数据
      const [
        currentStats,
        previousStats,
        topContributor,
        recentActivities
      ] = await Promise.all([
        this.getStatsForPeriod(timeRange.start, timeRange.end),
        this.getStatsForPeriod(previousTimeRange.start, previousTimeRange.end),
        this.getTopContributor(timeRange.start, timeRange.end),
        this.getRecentActivities(10)
      ])

      // 计算增长率
      const growthStats = {
        ideas_growth: this.calculateGrowth(currentStats.ideas, previousStats.ideas),
        assets_growth: this.calculateGrowth(currentStats.assets, previousStats.assets),
        users_growth: this.calculateGrowth(currentStats.users, previousStats.users)
      }

      const result = {
        total_ideas: currentStats.ideas,
        total_assets: currentStats.assets,
        active_users: currentStats.users,
        total_comments: currentStats.comments,
        total_likes: currentStats.likes,
        top_contributor: topContributor?.name || '暂无数据',
        growth_stats: growthStats,
        recent_activities: recentActivities,
        period: period,
        time_range: {
          start: timeRange.start.toISOString(),
          end: timeRange.end.toISOString()
        }
      }

      // 缓存结果（5分钟）
      await cacheService.set(cacheKey, result, 300)

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      throw new AppError('获取仪表板数据失败', 500, 'FETCH_DASHBOARD_ERROR')
    }
  }

  // 获取趋势分析数据
  async getTrendsData(req: Request, res: Response) {
    const { 
      period = 'week', 
      type = 'all' 
    } = req.query as any

    try {
      const cacheKey = `trends-data:${period}:${type}`
      
      // 尝试从缓存获取
      const cachedTrends = await cacheService.get(cacheKey)
      if (cachedTrends) {
        return res.json({
          success: true,
          data: cachedTrends
        })
      }

      const timeRange = this.getTimeRange(period)
      
      const [hotTopics, emergingTrends, tagTrends] = await Promise.all([
        type === 'all' || type === 'hot_topics' ? this.getHotTopics(timeRange.start, timeRange.end) : [],
        type === 'all' || type === 'emerging_trends' ? this.getEmergingTrends(timeRange.start, timeRange.end) : [],
        this.getTagTrends(timeRange.start, timeRange.end)
      ])

      const result = {
        hot_topics: hotTopics,
        emerging_trends: emergingTrends,
        tag_trends: tagTrends,
        period: period,
        generated_at: new Date().toISOString()
      }

      // 缓存结果（10分钟）
      await cacheService.set(cacheKey, result, 600)

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      throw new AppError('获取趋势数据失败', 500, 'FETCH_TRENDS_ERROR')
    }
  }

  // 获取AI洞察报告
  async getInsights(req: Request, res: Response) {
    const { type = 'content_quality' } = req.query as any

    try {
      const cacheKey = `insights:${type}`
      
      // 尝试从缓存获取
      const cachedInsights = await cacheService.get(cacheKey)
      if (cachedInsights) {
        return res.json({
          success: true,
          data: cachedInsights
        })
      }

      let insights: any[] = []

      switch (type) {
        case 'content_quality':
          insights = await this.getContentQualityInsights()
          break
        case 'user_behavior':
          insights = await this.getUserBehaviorInsights()
          break
        case 'trend_prediction':
          insights = await this.getTrendPredictionInsights()
          break
        default:
          insights = await this.getContentQualityInsights()
      }

      const result = {
        insights,
        type,
        generated_at: new Date().toISOString()
      }

      // 缓存结果（30分钟）
      await cacheService.set(cacheKey, result, 1800)

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      throw new AppError('获取洞察报告失败', 500, 'FETCH_INSIGHTS_ERROR')
    }
  }

  // 获取用户活动统计
  async getUserActivity(req: Request, res: Response) {
    const { 
      period = 'week',
      user_id 
    } = req.query as any

    try {
      const timeRange = this.getTimeRange(period)
      const userId = user_id || req.user?.id

      if (!userId) {
        throw new AppError('需要用户ID参数', 400, 'MISSING_USER_ID')
      }

      const cacheKey = `user-activity:${userId}:${period}`
      
      // 尝试从缓存获取
      const cachedActivity = await cacheService.get(cacheKey)
      if (cachedActivity) {
        return res.json({
          success: true,
          data: cachedActivity
        })
      }

      const [
        ideasCount,
        assetsCount,
        commentsCount,
        likesGiven,
        likesReceived,
        recentIdeas,
        recentAssets
      ] = await Promise.all([
        // 发布的灵感数
        prisma.idea.count({
          where: {
            authorId: userId,
            createdAt: {
              gte: timeRange.start,
              lte: timeRange.end
            }
          }
        }),
        // 创建的资产数
        prisma.asset.count({
          where: {
            authorId: userId,
            createdAt: {
              gte: timeRange.start,
              lte: timeRange.end
            }
          }
        }),
        // 发布的评论数
        prisma.comment.count({
          where: {
            authorId: userId,
            createdAt: {
              gte: timeRange.start,
              lte: timeRange.end
            }
          }
        }),
        // 给出的点赞数
        prisma.like.count({
          where: {
            userId: userId,
            createdAt: {
              gte: timeRange.start,
              lte: timeRange.end
            }
          }
        }),
        // 收到的点赞数
        prisma.like.count({
          where: {
            idea: {
              authorId: userId
            },
            createdAt: {
              gte: timeRange.start,
              lte: timeRange.end
            }
          }
        }),
        // 最近的灵感
        prisma.idea.findMany({
          where: {
            authorId: userId,
            createdAt: {
              gte: timeRange.start,
              lte: timeRange.end
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            content: true,
            likesCount: true,
            commentsCount: true,
            createdAt: true
          }
        }),
        // 最近的资产
        prisma.asset.findMany({
          where: {
            authorId: userId,
            createdAt: {
              gte: timeRange.start,
              lte: timeRange.end
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            downloadCount: true,
            createdAt: true
          }
        })
      ])

      const result = {
        summary: {
          ideas_published: ideasCount,
          assets_created: assetsCount,
          comments_posted: commentsCount,
          likes_given: likesGiven,
          likes_received: likesReceived
        },
        recent_ideas: recentIdeas,
        recent_assets: recentAssets,
        period,
        user_id: userId
      }

      // 缓存结果（10分钟）
      await cacheService.set(cacheKey, result, 600)

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('获取用户活动数据失败', 500, 'FETCH_USER_ACTIVITY_ERROR')
    }
  }

  // 获取数据趋势图表数据
  async getChartData(req: Request, res: Response) {
    const { 
      metric = 'ideas', 
      period = 'week',
      granularity = 'day'
    } = req.query as any

    try {
      const cacheKey = `chart-data:${metric}:${period}:${granularity}`
      
      // 尝试从缓存获取
      const cachedData = await cacheService.get(cacheKey)
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData
        })
      }

      const timeRange = this.getTimeRange(period)
      const dataPoints = await this.generateChartData(metric, timeRange, granularity)

      const result = {
        metric,
        period,
        granularity,
        data_points: dataPoints,
        total: dataPoints.reduce((sum: number, point: any) => sum + point.value, 0)
      }

      // 缓存结果（15分钟）
      await cacheService.set(cacheKey, result, 900)

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      throw new AppError('获取图表数据失败', 500, 'FETCH_CHART_DATA_ERROR')
    }
  }

  // 私有辅助方法

  private getTimeRange(period: string) {
    const now = new Date()
    const start = new Date()

    switch (period) {
      case 'day':
        start.setDate(now.getDate() - 1)
        break
      case 'week':
        start.setDate(now.getDate() - 7)
        break
      case 'month':
        start.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        start.setMonth(now.getMonth() - 3)
        break
      case 'year':
        start.setFullYear(now.getFullYear() - 1)
        break
      default:
        start.setDate(now.getDate() - 7)
    }

    return { start, end: now }
  }

  private getPreviousTimeRange(period: string) {
    const current = this.getTimeRange(period)
    const diff = current.end.getTime() - current.start.getTime()
    
    return {
      start: new Date(current.start.getTime() - diff),
      end: current.start
    }
  }

  private async getStatsForPeriod(start: Date, end: Date) {
    const [ideas, assets, users, comments, likes] = await Promise.all([
      prisma.idea.count({
        where: {
          createdAt: { gte: start, lte: end }
        }
      }),
      prisma.asset.count({
        where: {
          createdAt: { gte: start, lte: end }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: start, lte: end }
        }
      }),
      prisma.comment.count({
        where: {
          createdAt: { gte: start, lte: end }
        }
      }),
      prisma.like.count({
        where: {
          createdAt: { gte: start, lte: end }
        }
      })
    ])

    return { ideas, assets, users, comments, likes }
  }

  private async getTopContributor(start: Date, end: Date) {
    const topContributor = await prisma.user.findFirst({
      where: {
        OR: [
          {
            ideas: {
              some: {
                createdAt: { gte: start, lte: end }
              }
            }
          },
          {
            assets: {
              some: {
                createdAt: { gte: start, lte: end }
              }
            }
          }
        ]
      },
      include: {
        _count: {
          select: {
            ideas: {
              where: {
                createdAt: { gte: start, lte: end }
              }
            },
            assets: {
              where: {
                createdAt: { gte: start, lte: end }
              }
            }
          }
        }
      },
      orderBy: {
        ideas: {
          _count: 'desc'
        }
      }
    })

    return topContributor
  }

  private async getRecentActivities(limit: number) {
    // 获取最近的活动（灵感、资产、评论）
    const [recentIdeas, recentAssets, recentComments] = await Promise.all([
      prisma.idea.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { name: true }
          }
        }
      }),
      prisma.asset.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { name: true }
          }
        }
      }),
      prisma.comment.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { name: true }
          },
          idea: {
            select: { content: true }
          }
        }
      })
    ])

    // 合并并按时间排序
    const activities = [
      ...recentIdeas.map(idea => ({
        type: 'idea',
        id: idea.id,
        content: idea.content.substring(0, 100) + '...',
        author: idea.author.name,
        created_at: idea.createdAt
      })),
      ...recentAssets.map(asset => ({
        type: 'asset',
        id: asset.id,
        content: asset.title,
        author: asset.author.name,
        created_at: asset.createdAt
      })),
      ...recentComments.map(comment => ({
        type: 'comment',
        id: comment.id,
        content: `回复: ${comment.idea.content.substring(0, 50)}...`,
        author: comment.author.name,
        created_at: comment.createdAt
      }))
    ].sort((a, b) => b.created_at.getTime() - a.created_at.getTime()).slice(0, limit)

    return activities
  }

  private async getHotTopics(start: Date, end: Date) {
    // 统计最热门的标签
    const hotTags = await prisma.tag.findMany({
      orderBy: { usageCount: 'desc' },
      take: 10
    })

    // 模拟趋势数据（在实际应用中，这里应该是真实的趋势计算）
    return hotTags.map((tag, index) => ({
      topic: tag.name,
      count: tag.usageCount,
      trend: `+${Math.floor(Math.random() * 20) + 5}%`,
      sentiment: 'positive' as const,
      rank: index + 1
    }))
  }

  private async getEmergingTrends(start: Date, end: Date) {
    // 获取新兴标签（最近创建的）
    const emergingTags = await prisma.tag.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        usageCount: { gte: 3 }
      },
      orderBy: { usageCount: 'desc' },
      take: 5
    })

    return emergingTags.map(tag => ({
      trend: tag.name,
      growth: `+${Math.floor(tag.usageCount * 20)}%`,
      description: `"${tag.name}" 成为新兴热点话题，受到越来越多关注。`,
      related_tags: [], // 可以扩展为相关标签分析
      confidence: 0.8 + Math.random() * 0.2
    }))
  }

  private async getTagTrends(start: Date, end: Date) {
    const tagStats = await prisma.tag.findMany({
      orderBy: { usageCount: 'desc' },
      take: 20
    })

    return tagStats.map(tag => ({
      tag: tag.name,
      usage_count: tag.usageCount,
      growth_rate: Math.floor(Math.random() * 30) - 10, // -10% 到 +20%
      category: this.categorizeTag(tag.name)
    }))
  }

  private async getContentQualityInsights() {
    const highQualityIdeas = await prisma.idea.findMany({
      where: {
        likesCount: { gte: 5 }
      },
      include: {
        _count: {
          select: { comments: true }
        }
      }
    })

    const insights = [
      {
        type: 'content_quality',
        title: '高质量内容分析',
        description: `发现 ${highQualityIdeas.length} 条高质量灵感（5+点赞），主要集中在技术和创新领域。`,
        data: {
          high_quality_count: highQualityIdeas.length,
          avg_engagement: highQualityIdeas.reduce((sum, idea) => sum + idea.likesCount + idea._count.comments, 0) / highQualityIdeas.length
        },
        recommendations: [
          '建议团队继续关注技术创新方向',
          '高质量内容通常包含具体的实施细节',
          '增加案例分析和数据支撑能提升内容质量'
        ]
      }
    ]

    return insights
  }

  private async getUserBehaviorInsights() {
    const activeUsers = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            ideas: true,
            assets: true,
            comments: true
          }
        }
      }
    })

    const insights = [
      {
        type: 'user_behavior',
        title: '用户行为分析',
        description: '用户主要在工作日发布内容，周末更多进行点赞和评论互动。',
        data: {
          active_users: activeUsers.filter(u => u._count.ideas > 0 || u._count.assets > 0).length,
          power_users: activeUsers.filter(u => u._count.ideas >= 5).length
        },
        recommendations: [
          '工作日推送创作提醒效果更好',
          '周末可以重点推荐优质内容',
          '识别和培养核心贡献者'
        ]
      }
    ]

    return insights
  }

  private async getTrendPredictionInsights() {
    const recentTags = await prisma.tag.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const insights = [
      {
        type: 'trend_prediction',
        title: '趋势预测分析',
        description: '基于最近标签使用情况，预测未来热点方向。',
        data: {
          emerging_topics: recentTags.slice(0, 5).map(tag => tag.name),
          prediction_confidence: 0.75
        },
        recommendations: [
          '关注AI安全和隐私保护话题',
          'Web3和区块链应用持续升温',
          '可持续发展技术值得重点投入'
        ]
      }
    ]

    return insights
  }

  private calculateGrowth(current: number, previous: number): string {
    if (previous === 0) return current > 0 ? '+100%' : '0%'
    const growth = ((current - previous) / previous) * 100
    const sign = growth >= 0 ? '+' : ''
    return `${sign}${Math.round(growth)}%`
  }

  private categorizeTag(tagName: string): string {
    const categories: Record<string, string[]> = {
      '技术': ['AI', '机器学习', '深度学习', 'React', 'Vue', 'Node.js', 'Python'],
      '设计': ['UI/UX', '交互设计', '产品设计'],
      '商业': ['创业', '商业模式', '融资', '市场营销'],
      '区块链': ['区块链', '加密货币', 'NFT', 'DeFi', 'Web3'],
      '其他': []
    }

    for (const [category, tags] of Object.entries(categories)) {
      if (tags.some(tag => tagName.includes(tag))) {
        return category
      }
    }

    return '其他'
  }

  private async generateChartData(metric: string, timeRange: { start: Date, end: Date }, granularity: string) {
    // 生成时间点
    const points: Date[] = []
    const current = new Date(timeRange.start)
    
    while (current <= timeRange.end) {
      points.push(new Date(current))
      
      switch (granularity) {
        case 'hour':
          current.setHours(current.getHours() + 1)
          break
        case 'day':
          current.setDate(current.getDate() + 1)
          break
        case 'week':
          current.setDate(current.getDate() + 7)
          break
        case 'month':
          current.setMonth(current.getMonth() + 1)
          break
      }
    }

    // 查询每个时间点的数据
    const data = await Promise.all(
      points.slice(0, -1).map(async (point, index) => {
        const nextPoint = points[index + 1] || timeRange.end
        let count = 0

        switch (metric) {
          case 'ideas':
            count = await prisma.idea.count({
              where: {
                createdAt: { gte: point, lt: nextPoint }
              }
            })
            break
          case 'assets':
            count = await prisma.asset.count({
              where: {
                createdAt: { gte: point, lt: nextPoint }
              }
            })
            break
          case 'users':
            count = await prisma.user.count({
              where: {
                createdAt: { gte: point, lt: nextPoint }
              }
            })
            break
          case 'comments':
            count = await prisma.comment.count({
              where: {
                createdAt: { gte: point, lt: nextPoint }
              }
            })
            break
          case 'likes':
            count = await prisma.like.count({
              where: {
                createdAt: { gte: point, lt: nextPoint }
              }
            })
            break
        }

        return {
          timestamp: point.toISOString(),
          value: count,
          label: this.formatTimeLabel(point, granularity)
        }
      })
    )

    return data
  }

  private formatTimeLabel(date: Date, granularity: string): string {
    switch (granularity) {
      case 'hour':
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      case 'day':
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      case 'week':
        return `第${Math.ceil(date.getDate() / 7)}周`
      case 'month':
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' })
      default:
        return date.toLocaleDateString('zh-CN')
    }
  }
}

export const analyticsController = new AnalyticsController()
