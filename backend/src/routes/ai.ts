import { Router } from 'express'
import { z } from 'zod'
import { aiController } from '@/controllers/aiController'
import { authenticateUser, optionalAuth } from '@/middleware/auth'

const router = Router()

// 验证schemas
const enhanceSchema = z.object({
  content: z.string().min(1, '内容不能为空').max(5000, '内容不能超过5000字'),
  type: z.enum(['optimize', 'expand', 'tone'], { 
    errorMap: () => ({ message: '增强类型必须是 optimize、expand 或 tone' })
  }),
  context: z.string().optional()
})

const summarizeSchema = z.object({
  content: z.string().min(1, '内容不能为空').max(10000, '内容不能超过10000字'),
  summary_type: z.enum(['brief', 'detailed', 'key_points']).default('brief')
})

const chatSchema = z.object({
  message: z.string().min(1, '消息不能为空').max(1000, '消息不能超过1000字'),
  context: z.string().optional(),
  conversation_id: z.string().optional()
})

const tagsSchema = z.object({
  content: z.string().min(1, '内容不能为空').max(2000, '内容不能超过2000字'),
  max_tags: z.number().min(1).max(10).default(5)
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

// AI内容增强
router.post('/enhance', 
  authenticateUser,
  validateBody(enhanceSchema),
  aiController.enhanceContent
)

// 智能总结
router.post('/summarize', 
  authenticateUser,
  validateBody(summarizeSchema),
  aiController.summarizeContent
)

// AI对话
router.post('/chat', 
  authenticateUser,
  validateBody(chatSchema),
  aiController.chatWithAI
)

// 标签推荐
router.post('/tags/suggest', 
  authenticateUser,
  validateBody(tagsSchema),
  aiController.suggestTags
)

// 每日AI简报
router.get('/brief/daily', 
  optionalAuth,
  aiController.getDailyBrief
)

export { router as aiRouter }
