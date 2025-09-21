import { Request, Response } from 'express'
import { prisma } from '@/config/database'
import { AppError } from '@/middleware/errorHandler'
import { cacheService } from '@/config/redis'
import { notificationService } from '@/services/notificationService'
import { getSocketService } from '@/config/socket'
import { ideasService } from '@/services/ideasService'

class IdeasController {
  // 获取灵感列表
  async getIdeas(req: Request, res: Response) {
    const { page, limit, sort, tags, author, search } = req.query as any
    const userId = req.user?.id

    try {
      // 生成缓存键
      const cacheKey = `ideas:${JSON.stringify({ page, limit, sort, tags, author, search })}`
      
      // 尝试从缓存获取
      let cachedResult = await cacheService.get(cacheKey)
      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult
        })
      }

      // 使用ideasService获取数据
      const result = await ideasService.getIdeas({
        page,
        limit,
        sort,
        tags,
        author,
        search,
        userId
      })

      // 缓存结果（5分钟）
      await cacheService.set(cacheKey, result, 300)

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('获取灵感列表错误:', error)
      throw new AppError('获取灵感列表失败', 500, 'FETCH_IDEAS_ERROR')
    }
  }

  // 创建新灵感
  async createIdea(req: Request, res: Response) {
    const { content, tags, attachments } = req.body
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

      // 创建灵感
      const idea = await prisma.idea.create({
        data: {
          content,
          tags,
          authorId: userId
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
      await cacheService.delPattern('ideas:*')

      // 发送实时数据更新
      const socketService = getSocketService()
      socketService.broadcastDataUpdate('idea_created', {
        id: idea.id,
        author: idea.author,
        preview: content.substring(0, 100) + '...'
      })

      res.status(201).json({
        success: true,
        data: {
          id: idea.id,
          content: idea.content,
          author: idea.author,
          tags: idea.tags,
          likes_count: 0,
          comments_count: 0,
          is_liked: false,
          created_at: idea.createdAt,
          updated_at: idea.updatedAt
        },
        message: '灵感发布成功'
      })
    } catch (error) {
      throw new AppError('创建灵感失败', 500, 'CREATE_IDEA_ERROR')
    }
  }

  // 获取单个灵感详情
  async getIdeaById(req: Request, res: Response) {
    const { id } = req.params
    const userId = req.user?.id

    try {
      const idea = await ideasService.getIdeaById(id, userId)
      
      if (!idea) {
        throw new AppError('灵感不存在', 404, 'IDEA_NOT_FOUND')
      }

      res.json({
        success: true,
        data: idea
      })
    } catch (error) {
      console.error('获取灵感详情错误:', error)
      if (error instanceof AppError) throw error
      throw new AppError('获取灵感详情失败', 500, 'FETCH_IDEA_ERROR')
    }
  }

  // 更新灵感
  async updateIdea(req: Request, res: Response) {
    const { id } = req.params
    const { content, tags } = req.body
    const userId = req.user!.id

    try {
      // 检查灵感是否存在和权限
      const existingIdea = await prisma.idea.findUnique({
        where: { id },
        select: { authorId: true }
      })

      if (!existingIdea) {
        throw new AppError('灵感不存在', 404, 'IDEA_NOT_FOUND')
      }

      if (existingIdea.authorId !== userId) {
        throw new AppError('无权限修改此灵感', 403, 'FORBIDDEN')
      }

      // 更新数据
      const updateData: any = {}
      if (content !== undefined) updateData.content = content
      if (tags !== undefined) updateData.tags = tags

      await prisma.idea.update({
        where: { id },
        data: updateData
      })

      // 清除缓存
      await cacheService.delPattern('ideas:*')

      res.json({
        success: true,
        message: '灵感更新成功'
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('更新灵感失败', 500, 'UPDATE_IDEA_ERROR')
    }
  }

  // 删除灵感
  async deleteIdea(req: Request, res: Response) {
    const { id } = req.params
    const userId = req.user!.id

    try {
      const existingIdea = await prisma.idea.findUnique({
        where: { id },
        select: { authorId: true }
      })

      if (!existingIdea) {
        throw new AppError('灵感不存在', 404, 'IDEA_NOT_FOUND')
      }

      if (existingIdea.authorId !== userId) {
        throw new AppError('无权限删除此灵感', 403, 'FORBIDDEN')
      }

      await prisma.idea.delete({
        where: { id }
      })

      // 清除缓存
      await cacheService.delPattern('ideas:*')

      res.json({
        success: true,
        message: '灵感删除成功'
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('删除灵感失败', 500, 'DELETE_IDEA_ERROR')
    }
  }

  // 点赞/取消点赞
  async toggleLike(req: Request, res: Response) {
    const { id } = req.params
    const userId = req.user!.id

    try {
      // 检查灵感是否存在
      const idea = await prisma.idea.findUnique({
        where: { id },
        select: { id: true, content: true, authorId: true }
      })

      if (!idea) {
        throw new AppError('灵感不存在', 404, 'IDEA_NOT_FOUND')
      }

      // 检查是否已点赞
      const existingLike = await prisma.like.findUnique({
        where: {
          ideaId_userId: {
            ideaId: id,
            userId
          }
        }
      })

      let liked: boolean
      let likesCount: number

      if (existingLike) {
        // 取消点赞
        await prisma.$transaction([
          prisma.like.delete({
            where: { id: existingLike.id }
          }),
          prisma.idea.update({
            where: { id },
            data: {
              likesCount: {
                decrement: 1
              }
            }
          })
        ])
        liked = false
      } else {
        // 添加点赞
        await prisma.$transaction([
          prisma.like.create({
            data: {
              ideaId: id,
              userId
            }
          }),
          prisma.idea.update({
            where: { id },
            data: {
              likesCount: {
                increment: 1
              }
            }
          })
        ])
        liked = true
      }

      // 获取最新点赞数
      const updatedIdea = await prisma.idea.findUnique({
        where: { id },
        select: { likesCount: true }
      })
      likesCount = updatedIdea!.likesCount

      // 清除缓存
      await cacheService.delPattern('ideas:*')

      // 发送通知给灵感作者（如果不是自己点赞）
      if (liked && userId !== idea.authorId) {
        try {
          await notificationService.notifyIdeaLiked(
            id,
            idea.content,
            userId,
            req.user!.name,
            idea.authorId
          )
        } catch (notificationError) {
          console.error('发送点赞通知失败:', notificationError)
        }
      }

      // 发送实时数据更新
      const socketService = getSocketService()
      socketService.broadcastDataUpdate('idea_liked', {
        ideaId: id,
        liked,
        likes_count: likesCount,
        user_id: userId
      })

      res.json({
        success: true,
        data: {
          liked,
          likes_count: likesCount
        }
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('点赞操作失败', 500, 'LIKE_ERROR')
    }
  }

  // 获取评论列表
  async getComments(req: Request, res: Response) {
    const { id } = req.params
    const { page, limit } = req.query as any

    try {
      const skip = (page - 1) * limit

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: { ideaId: id },
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
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true
                  }
                }
              }
            }
          }
        }),
        prisma.comment.count({
          where: { ideaId: id }
        })
      ])

      res.json({
        success: true,
        data: {
          comments,
          pagination: {
            current_page: page,
            per_page: limit,
            total_pages: Math.ceil(total / limit),
            has_next: page * limit < total,
            has_prev: page > 1
          }
        }
      })
    } catch (error) {
      throw new AppError('获取评论列表失败', 500, 'FETCH_COMMENTS_ERROR')
    }
  }

  // 添加评论
  async addComment(req: Request, res: Response) {
    const { id } = req.params
    const { content, parent_id } = req.body
    const userId = req.user!.id
    const userName = req.user!.name

    try {
      // 检查灵感是否存在
      const idea = await prisma.idea.findUnique({
        where: { id },
        select: { id: true }
      })

      if (!idea) {
        throw new AppError('灵感不存在', 404, 'IDEA_NOT_FOUND')
      }

      // 检查用户是否存在
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

      // 创建评论
      const comment = await prisma.$transaction(async (tx) => {
        const newComment = await tx.comment.create({
          data: {
            content,
            ideaId: id,
            authorId: userId,
            parentId: parent_id || null
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

        // 更新灵感的评论计数
        await tx.idea.update({
          where: { id },
          data: {
            commentsCount: {
              increment: 1
            }
          }
        })

        return newComment
      })

      // 清除缓存
      await cacheService.delPattern('ideas:*')

      // 发送通知给灵感作者（如果不是自己评论）
      if (userId !== idea.authorId) {
        try {
          await notificationService.notifyIdeaCommented(
            id,
            idea.content,
            content,
            userId,
            userName,
            idea.authorId
          )
        } catch (notificationError) {
          console.error('发送评论通知失败:', notificationError)
        }
      }

      // 发送实时数据更新
      const socketService = getSocketService()
      socketService.broadcastDataUpdate('idea_commented', {
        ideaId: id,
        comment: {
          id: comment.id,
          content: comment.content,
          author: comment.author
        }
      })

      res.status(201).json({
        success: true,
        data: comment,
        message: '评论添加成功'
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('添加评论失败', 500, 'ADD_COMMENT_ERROR')
    }
  }

  // 归档到资产库
  async archiveToAssets(req: Request, res: Response) {
    const { id } = req.params
    const { title, description, category } = req.body
    const userId = req.user!.id

    try {
      // 检查灵感是否存在
      const idea = await prisma.idea.findUnique({
        where: { id },
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

      if (!idea) {
        throw new AppError('灵感不存在', 404, 'IDEA_NOT_FOUND')
      }

      if (idea.authorId !== userId) {
        throw new AppError('只能归档自己的灵感', 403, 'FORBIDDEN')
      }

      // 创建资产并更新灵感状态
      const asset = await prisma.$transaction(async (tx) => {
        const newAsset = await tx.asset.create({
          data: {
            title,
            description: description || idea.content,
            content: idea.content,
            category,
            tags: idea.tags,
            sourceType: 'IDEA',
            sourceId: id,
            authorId: userId
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

        // 标记灵感为已归档
        await tx.idea.update({
          where: { id },
          data: {
            isArchived: true
          }
        })

        return newAsset
      })

      // 清除缓存
      await cacheService.delPattern('ideas:*')
      await cacheService.delPattern('assets:*')

      // 发送归档通知给用户
      try {
        await notificationService.notifyIdeaArchived(
          id,
          idea.content,
          title,
          userId
        )
      } catch (notificationError) {
        console.error('发送归档通知失败:', notificationError)
      }

      // 发送实时数据更新
      const socketService = getSocketService()
      socketService.broadcastDataUpdate('idea_archived', {
        ideaId: id,
        asset: {
          id: asset.id,
          title: asset.title,
          author: asset.author
        }
      })

      res.status(201).json({
        success: true,
        data: asset,
        message: '归档成功'
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('归档失败', 500, 'ARCHIVE_ERROR')
    }
  }
}

export const ideasController = new IdeasController()
