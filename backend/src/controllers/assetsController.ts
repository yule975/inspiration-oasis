import { Request, Response } from 'express'
import { prisma } from '@/config/database'
import { AppError } from '@/middleware/errorHandler'
import { cacheService } from '@/config/redis'

class AssetsController {
  // 获取资产列表
  async getAssets(req: Request, res: Response) {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      view = 'team', 
      tags, 
      search 
    } = req.query as any
    const userId = req.user?.id

    // 构建查询条件
    const where: any = {}

    // 视图筛选
    if (view === 'personal' && userId) {
      where.authorId = userId
    }

    // 分类筛选
    if (category && category !== '全部') {
      where.category = category
    }

    // 标签筛选
    if (tags) {
      const tagArray = tags.split(',').map((tag: string) => tag.trim())
      where.tags = {
        hasSome: tagArray
      }
    }

    // 搜索筛选
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          content: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    const skip = (page - 1) * limit

    try {
      // 生成缓存键
      const cacheKey = `assets:${JSON.stringify({ page, limit, category, view, tags, search, userId })}`
      
      // 尝试从缓存获取
      const cachedResult = await cacheService.get(cacheKey)
      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult
        })
      }

      // 并行查询数据和总数
      const [assets, total] = await Promise.all([
        prisma.asset.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            },
            sourceIdea: {
              select: {
                id: true,
                content: true
              }
            }
          }
        }),
        prisma.asset.count({ where })
      ])

      const result = {
        assets,
        pagination: {
          current_page: page,
          per_page: limit,
          total_pages: Math.ceil(total / limit),
          has_next: page * limit < total,
          has_prev: page > 1
        },
        total
      }

      // 缓存结果（5分钟）
      await cacheService.set(cacheKey, result, 300)

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      throw new AppError('获取资产列表失败', 500, 'FETCH_ASSETS_ERROR')
    }
  }

  // 创建新资产
  async createAsset(req: Request, res: Response) {
    const { 
      title, 
      description, 
      content, 
      category, 
      tags = [], 
      attachments = [] 
    } = req.body
    const userId = req.user!.id
    const userName = req.user!.name

    try {
      // 检查用户是否存在，不存在则创建
      let user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            name: userName
          }
        })
      }

      // 创建资产
      const asset = await prisma.asset.create({
        data: {
          title,
          description,
          content,
          category,
          tags,
          authorId: userId,
          sourceType: 'MANUAL'
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      })

      // 更新标签使用计数
      for (const tag of tags) {
        await prisma.tag.upsert({
          where: { name: tag },
          update: {
            usageCount: {
              increment: 1
            }
          },
          create: {
            name: tag,
            usageCount: 1
          }
        })
      }

      // 清除相关缓存
      await cacheService.delPattern('assets:*')

      res.status(201).json({
        success: true,
        data: asset,
        message: '资产创建成功'
      })
    } catch (error) {
      throw new AppError('创建资产失败', 500, 'CREATE_ASSET_ERROR')
    }
  }

  // 获取单个资产详情
  async getAssetById(req: Request, res: Response) {
    const { id } = req.params

    try {
      const asset = await prisma.asset.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          sourceIdea: {
            select: {
              id: true,
              content: true,
              createdAt: true
            }
          },
          attachments: {
            select: {
              id: true,
              fileName: true,
              fileType: true,
              fileUrl: true,
              fileSize: true
            }
          },
          changelogs: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      })

      if (!asset) {
        throw new AppError('资产不存在', 404, 'ASSET_NOT_FOUND')
      }

      // 增加下载计数
      await prisma.asset.update({
        where: { id },
        data: {
          downloadCount: {
            increment: 1
          }
        }
      })

      const formattedAsset = {
        ...asset,
        download_count: asset.downloadCount + 1,
        source: asset.sourceIdea ? {
          type: 'idea',
          id: asset.sourceIdea.id,
          content: asset.sourceIdea.content,
          created_at: asset.sourceIdea.createdAt
        } : null
      }

      res.json({
        success: true,
        data: formattedAsset
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('获取资产详情失败', 500, 'FETCH_ASSET_ERROR')
    }
  }

  // 更新资产
  async updateAsset(req: Request, res: Response) {
    const { id } = req.params
    const { title, description, content, category, tags } = req.body
    const userId = req.user!.id

    try {
      // 检查资产是否存在和权限
      const existingAsset = await prisma.asset.findUnique({
        where: { id },
        select: { 
          authorId: true, 
          version: true,
          title: true,
          description: true,
          content: true,
          category: true,
          tags: true
        }
      })

      if (!existingAsset) {
        throw new AppError('资产不存在', 404, 'ASSET_NOT_FOUND')
      }

      if (existingAsset.authorId !== userId) {
        throw new AppError('无权限修改此资产', 403, 'FORBIDDEN')
      }

      // 构建更新数据
      const updateData: any = {}
      const changes: string[] = []

      if (title !== undefined && title !== existingAsset.title) {
        updateData.title = title
        changes.push(`标题更新为: ${title}`)
      }

      if (description !== undefined && description !== existingAsset.description) {
        updateData.description = description
        changes.push(`描述已更新`)
      }

      if (content !== undefined && content !== existingAsset.content) {
        updateData.content = content
        changes.push(`内容已更新`)
      }

      if (category !== undefined && category !== existingAsset.category) {
        updateData.category = category
        changes.push(`分类更新为: ${category}`)
      }

      if (tags !== undefined && JSON.stringify(tags) !== JSON.stringify(existingAsset.tags)) {
        updateData.tags = tags
        changes.push(`标签已更新`)
      }

      // 如果有实际更改，则更新版本号
      if (changes.length > 0) {
        const currentVersion = existingAsset.version.split('.')
        const newPatch = parseInt(currentVersion[2]) + 1
        updateData.version = `${currentVersion[0]}.${currentVersion[1]}.${newPatch}`
      }

      // 执行更新
      const [updatedAsset] = await prisma.$transaction([
        prisma.asset.update({
          where: { id },
          data: updateData
        }),
        // 记录变更日志
        ...(changes.length > 0 ? [
          prisma.changelog.create({
            data: {
              assetId: id,
              version: updateData.version,
              changes: changes.join('; ')
            }
          })
        ] : [])
      ])

      // 清除缓存
      await cacheService.delPattern('assets:*')

      res.json({
        success: true,
        data: {
          ...updatedAsset,
          changes_made: changes
        },
        message: '资产更新成功'
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('更新资产失败', 500, 'UPDATE_ASSET_ERROR')
    }
  }

  // 删除资产
  async deleteAsset(req: Request, res: Response) {
    const { id } = req.params
    const userId = req.user!.id

    try {
      const existingAsset = await prisma.asset.findUnique({
        where: { id },
        select: { authorId: true, title: true }
      })

      if (!existingAsset) {
        throw new AppError('资产不存在', 404, 'ASSET_NOT_FOUND')
      }

      if (existingAsset.authorId !== userId) {
        throw new AppError('无权限删除此资产', 403, 'FORBIDDEN')
      }

      await prisma.asset.delete({
        where: { id }
      })

      // 清除缓存
      await cacheService.delPattern('assets:*')

      res.json({
        success: true,
        message: `资产 "${existingAsset.title}" 删除成功`
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('删除资产失败', 500, 'DELETE_ASSET_ERROR')
    }
  }

  // 获取资产分类列表
  async getCategories(req: Request, res: Response) {
    try {
      // 尝试从缓存获取
      const cacheKey = 'asset-categories'
      const cachedCategories = await cacheService.get(cacheKey)
      
      if (cachedCategories) {
        return res.json({
          success: true,
          data: cachedCategories
        })
      }

      // 从数据库聚合分类数据
      const categoryStats = await prisma.asset.groupBy({
        by: ['category'],
        _count: {
          category: true
        },
        orderBy: {
          _count: {
            category: 'desc'
          }
        }
      })

      const categories = categoryStats.map(stat => ({
        name: stat.category,
        count: stat._count.category,
        description: getCategoryDescription(stat.category)
      }))

      // 添加"全部"选项
      const totalCount = categories.reduce((sum, cat) => sum + cat.count, 0)
      const result = [
        {
          name: '全部',
          count: totalCount,
          description: '所有分类的资产'
        },
        ...categories
      ]

      // 缓存结果（30分钟）
      await cacheService.set(cacheKey, result, 1800)

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      throw new AppError('获取分类列表失败', 500, 'FETCH_CATEGORIES_ERROR')
    }
  }

  // 复制资产
  async duplicateAsset(req: Request, res: Response) {
    const { id } = req.params
    const { title } = req.body
    const userId = req.user!.id
    const userName = req.user!.name

    try {
      const originalAsset = await prisma.asset.findUnique({
        where: { id },
        include: {
          attachments: true
        }
      })

      if (!originalAsset) {
        throw new AppError('原资产不存在', 404, 'ASSET_NOT_FOUND')
      }

      // 检查用户
      let user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            name: userName
          }
        })
      }

      // 创建副本
      const duplicatedAsset = await prisma.asset.create({
        data: {
          title: title || `${originalAsset.title} - 副本`,
          description: originalAsset.description,
          content: originalAsset.content,
          category: originalAsset.category,
          tags: originalAsset.tags,
          authorId: userId,
          sourceType: 'MANUAL',
          version: '1.0.0'
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      })

      // 清除缓存
      await cacheService.delPattern('assets:*')

      res.status(201).json({
        success: true,
        data: duplicatedAsset,
        message: '资产复制成功'
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('复制资产失败', 500, 'DUPLICATE_ASSET_ERROR')
    }
  }

  // 获取热门资产
  async getPopularAssets(req: Request, res: Response) {
    const { limit = 10 } = req.query as any

    try {
      const cacheKey = `popular-assets:${limit}`
      const cachedResult = await cacheService.get(cacheKey)
      
      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult
        })
      }

      const popularAssets = await prisma.asset.findMany({
        orderBy: [
          { downloadCount: 'desc' },
          { createdAt: 'desc' }
        ],
        take: parseInt(limit),
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      })

      // 缓存结果（10分钟）
      await cacheService.set(cacheKey, popularAssets, 600)

      res.json({
        success: true,
        data: popularAssets
      })
    } catch (error) {
      throw new AppError('获取热门资产失败', 500, 'FETCH_POPULAR_ASSETS_ERROR')
    }
  }

  // 获取用户资产统计
  async getUserAssetStats(req: Request, res: Response) {
    const userId = req.user?.id

    if (!userId) {
      throw new AppError('用户身份验证失败', 401, 'UNAUTHORIZED')
    }

    try {
      const cacheKey = `user-asset-stats:${userId}`
      const cachedStats = await cacheService.get(cacheKey)
      
      if (cachedStats) {
        return res.json({
          success: true,
          data: cachedStats
        })
      }

      const [
        totalAssets,
        categoryStats,
        recentAssets,
        totalDownloads
      ] = await Promise.all([
        // 总资产数
        prisma.asset.count({
          where: { authorId: userId }
        }),
        // 分类统计
        prisma.asset.groupBy({
          where: { authorId: userId },
          by: ['category'],
          _count: {
            category: true
          }
        }),
        // 最近资产
        prisma.asset.findMany({
          where: { authorId: userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            createdAt: true,
            downloadCount: true
          }
        }),
        // 总下载数
        prisma.asset.aggregate({
          where: { authorId: userId },
          _sum: {
            downloadCount: true
          }
        })
      ])

      const stats = {
        total_assets: totalAssets,
        total_downloads: totalDownloads._sum.downloadCount || 0,
        categories: categoryStats.map(stat => ({
          category: stat.category,
          count: stat._count.category
        })),
        recent_assets: recentAssets
      }

      // 缓存结果（5分钟）
      await cacheService.set(cacheKey, stats, 300)

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      throw new AppError('获取用户资产统计失败', 500, 'FETCH_USER_STATS_ERROR')
    }
  }
}

// 分类描述映射
function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    'Prompts': 'AI提示词和模板',
    '工具技巧': '实用工具和开发技巧',
    '深度分析': '技术分析和研究报告', 
    '创意方案': '产品创意和设计方案',
    '技术方案': '技术架构和实施方案',
    '产品设计': '产品设计和用户体验',
    '创业计划': '商业计划和创业想法',
    '开源项目': '开源代码和项目',
    '研究报告': '行业研究和分析报告',
    '从灵感墙归档': '从灵感墙归档的内容'
  }

  return descriptions[category] || '其他类型资产'
}

export const assetsController = new AssetsController()
