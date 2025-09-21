import { prisma } from '@/config/database'
import { supabase } from '@/config/supabase'

interface GetIdeasParams {
  page: number
  limit: number
  sort?: string
  tags?: string
  author?: string
  search?: string
  userId?: string
}

// 获取灵感列表
const getIdeas = async (params: GetIdeasParams) => {
  const { page = 1, limit = 20, sort, tags, author, search, userId } = params

  try {
    // 首先尝试使用Prisma
    if (prisma) {
      // 构建查询条件
      const where: any = {
        isArchived: false
      }

      if (tags) {
        const tagArray = tags.split(',').map((tag: string) => tag.trim())
        where.tags = {
          hasSome: tagArray
        }
      }

      if (author) {
        where.author = {
          name: {
            contains: author,
            mode: 'insensitive'
          }
        }
      }

      if (search) {
        where.content = {
          contains: search,
          mode: 'insensitive'
        }
      }

      // 排序设置
      let orderBy: any = { createdAt: 'desc' }
      if (sort === 'popular') {
        orderBy = { likesCount: 'desc' }
      } else if (sort === 'likes') {
        orderBy = { likesCount: 'desc' }
      }

      // 计算偏移量
      const skip = (page - 1) * limit

      // 并行查询数据和总数
      const [ideas, total] = await Promise.all([
        prisma.idea.findMany({
          where,
          orderBy,
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
            likes: userId ? {
              where: { userId },
              select: { id: true }
            } : false,
            _count: {
              select: {
                comments: true,
                likes: true
              }
            }
          }
        }),
        prisma.idea.count({ where })
      ])

      // 格式化返回数据
      const formattedIdeas = ideas.map(idea => ({
        id: idea.id,
        content: idea.content,
        author: idea.author,
        tags: idea.tags,
        likes_count: idea._count.likes,
        comments_count: idea._count.comments,
        is_liked: userId ? idea.likes.length > 0 : false,
        is_archived: idea.isArchived,
        created_at: idea.createdAt,
        updated_at: idea.updatedAt
      }))

      return {
        ideas: formattedIdeas,
        pagination: {
          current_page: page,
          per_page: limit,
          total_pages: Math.ceil(total / limit),
          has_next: page * limit < total,
          has_prev: page > 1
        },
        total
      }
    }
  } catch (error) {
    console.log('Prisma查询失败，尝试使用Supabase:', error)
  }

  // 使用Supabase查询
  let query = supabase
    .from('ideas')
    .select(`
      id,
      content,
      tags,
      likes_count,
      comments_count,
      view_count,
      is_archived,
      created_at,
      updated_at,
      author:users!ideas_author_id_fkey(
        id,
        name,
        avatar
      )
    `, { count: 'exact' })
    .eq('is_archived', false)

  // 添加筛选条件
  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim())
    query = query.overlaps('tags', tagArray)
  }

  if (author) {
    // 这里需要通过关联查询来筛选作者
    query = query.ilike('users.name', `%${author}%`)
  }

  if (search) {
    query = query.ilike('content', `%${search}%`)
  }

  // 排序
  if (sort === 'popular' || sort === 'likes') {
    query = query.order('likes_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  // 分页
  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data: ideas, error, count } = await query

  if (error) {
    throw new Error(`获取灵感失败: ${error.message}`)
  }

  // 如果有用户ID，检查点赞状态
  let formattedIdeas = ideas || []
  if (userId && formattedIdeas.length > 0) {
    const ideaIds = formattedIdeas.map(idea => idea.id)
    const { data: likes } = await supabase
      .from('likes')
      .select('idea_id')
      .eq('user_id', userId)
      .in('idea_id', ideaIds)

    const likedIdeaIds = new Set(likes?.map(like => like.idea_id) || [])
    
    formattedIdeas = formattedIdeas.map(idea => ({
      ...idea,
      is_liked: likedIdeaIds.has(idea.id)
    }))
  } else {
    formattedIdeas = formattedIdeas.map(idea => ({
      ...idea,
      is_liked: false
    }))
  }

  const total = count || 0

  return {
    ideas: formattedIdeas,
    pagination: {
      current_page: page,
      per_page: limit,
      total_pages: Math.ceil(total / limit),
      has_next: page * limit < total,
      has_prev: page > 1
    },
    total
  }
}

// 获取单个灵感详情
const getIdeaById = async (ideaId: string, userId?: string) => {
  try {
    // 首先尝试使用Prisma
    if (prisma) {
      const idea = await prisma.idea.findUnique({
        where: { id: ideaId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          likes: userId ? {
            where: { userId },
            select: { id: true }
          } : false,
          attachments: {
            select: {
              id: true,
              fileName: true,
              fileType: true,
              fileUrl: true
            }
          },
          aiEnhancements: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              enhancementType: true,
              enhancedContent: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              comments: true,
              likes: true
            }
          }
        }
      })

      if (idea) {
        // 增加查看次数
        await prisma.idea.update({
          where: { id: ideaId },
          data: {
            viewCount: {
              increment: 1
            }
          }
        })

        return {
          id: idea.id,
          content: idea.content,
          author: idea.author,
          tags: idea.tags,
          likes_count: idea._count.likes,
          comments_count: idea._count.comments,
          view_count: idea.viewCount + 1,
          is_liked: userId ? idea.likes.length > 0 : false,
          is_archived: idea.isArchived,
          attachments: idea.attachments,
          ai_enhancements: idea.aiEnhancements,
          created_at: idea.createdAt,
          updated_at: idea.updatedAt
        }
      }
    }
  } catch (error) {
    console.log('Prisma查询失败，尝试使用Supabase:', error)
  }

  // 使用Supabase查询
  const { data: idea, error } = await supabase
    .from('ideas')
    .select(`
      id,
      content,
      tags,
      likes_count,
      comments_count,
      view_count,
      is_archived,
      created_at,
      updated_at,
      author:users!ideas_author_id_fkey(
        id,
        name,
        avatar
      )
    `)
    .eq('id', ideaId)
    .eq('is_archived', false)
    .single()

  if (error) {
    console.error('Supabase查询错误:', error)
    throw new Error('获取灵感详情失败')
  }

  if (!idea) {
    throw new Error('灵感不存在')
  }

  // 增加查看次数
  await supabase
    .from('ideas')
    .update({ view_count: (idea.view_count || 0) + 1 })
    .eq('id', ideaId)

  // 检查用户是否点赞
  let isLiked = false
  if (userId) {
    const { data: like } = await supabase
      .from('likes')
      .select('id')
      .eq('idea_id', ideaId)
      .eq('user_id', userId)
      .single()
    
    isLiked = !!like
  }

  return {
    id: idea.id,
    content: idea.content,
    author: idea.author,
    tags: idea.tags,
    likes_count: idea.likes_count || 0,
    comments_count: idea.comments_count || 0,
    view_count: (idea.view_count || 0) + 1,
    is_liked: isLiked,
    is_archived: idea.is_archived,
    attachments: [], // Supabase暂时不支持附件
    ai_enhancements: [], // Supabase暂时不支持AI增强
    created_at: idea.created_at,
    updated_at: idea.updated_at
  }
}

export const ideasService = {
  getIdeas,
  getIdeaById
}