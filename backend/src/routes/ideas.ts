import { Router } from 'express'
import { z } from 'zod'
import { ideasController } from '@/controllers/ideasController'
import { authenticateUser, optionalAuth } from '@/middleware/auth'

const router = Router()

// 验证schemas
const createIdeaSchema = z.object({
  content: z.string().min(1, '灵感内容不能为空').max(2000, '灵感内容不能超过2000字'),
  tags: z.array(z.string()).optional().default([]),
  attachments: z.array(z.string()).optional().default([])
})

const updateIdeaSchema = z.object({
  content: z.string().min(1).max(2000).optional(),
  tags: z.array(z.string()).optional()
})

const commentSchema = z.object({
  content: z.string().min(1, '评论内容不能为空').max(500, '评论内容不能超过500字'),
  parent_id: z.string().optional()
})

const archiveSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题不能超过100字'),
  description: z.string().optional(),
  category: z.string().min(1, '分类不能为空')
})

// 查询参数验证
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['latest', 'popular', 'likes']).default('latest'),
  tags: z.string().optional(),
  author: z.string().optional(),
  search: z.string().optional()
})

// 验证中间件
function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      next(error)
    }
  }
}

function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      req.query = schema.parse(req.query)
      next()
    } catch (error) {
      next(error)
    }
  }
}

// 路由定义
router.get('/', 
  optionalAuth,
  validateQuery(querySchema),
  ideasController.getIdeas
)

router.post('/', 
  authenticateUser,
  validateBody(createIdeaSchema),
  ideasController.createIdea
)

router.get('/:id', 
  optionalAuth,
  ideasController.getIdeaById
)

router.put('/:id', 
  authenticateUser,
  validateBody(updateIdeaSchema),
  ideasController.updateIdea
)

router.delete('/:id', 
  authenticateUser,
  ideasController.deleteIdea
)

router.post('/:id/like', 
  authenticateUser,
  ideasController.toggleLike
)

router.get('/:id/comments', 
  optionalAuth,
  validateQuery(z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20)
  })),
  ideasController.getComments
)

router.post('/:id/comments', 
  authenticateUser,
  validateBody(commentSchema),
  ideasController.addComment
)

router.post('/:id/archive', 
  authenticateUser,
  validateBody(archiveSchema),
  ideasController.archiveToAssets
)

export { router as ideasRouter }
