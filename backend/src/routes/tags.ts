import { Router } from 'express'
import { prisma } from '@/config/database'
import { optionalAuth } from '@/middleware/auth'

const router = Router()

// 获取标签列表
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { sort = 'usage', limit = 50 } = req.query as any

    let orderBy: any = { usageCount: 'desc' }
    
    if (sort === 'alphabetical') {
      orderBy = { name: 'asc' }
    } else if (sort === 'recent') {
      orderBy = { createdAt: 'desc' }
    }

    const tags = await prisma.tag.findMany({
      orderBy,
      take: parseInt(limit)
    })

    res.json({
      success: true,
      data: tags
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_TAGS_ERROR',
        message: '获取标签列表失败'
      }
    })
  }
})

export { router as tagsRouter }
