import { Router } from 'express'
import { z } from 'zod'
import { assetsController } from '@/controllers/assetsController'
import { authenticateUser, optionalAuth } from '@/middleware/auth'

const router = Router()

// 验证schemas
const createAssetSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题不能超过100字'),
  description: z.string().min(1, '描述不能为空').max(500, '描述不能超过500字'),
  content: z.string().optional(),
  category: z.string().min(1, '分类不能为空'),
  tags: z.array(z.string()).optional().default([]),
  attachments: z.array(z.string()).optional().default([])
})

const updateAssetSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  category: z.string().min(1).optional(),
  tags: z.array(z.string()).optional()
})

const duplicateAssetSchema = z.object({
  title: z.string().min(1).max(100).optional()
})

// 查询参数验证
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional(),
  view: z.enum(['team', 'personal']).default('team'),
  tags: z.string().optional(),
  search: z.string().optional()
})

const popularQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10)
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

// 获取分类列表 (放在前面，避免与/:id冲突)
router.get('/categories', 
  optionalAuth,
  assetsController.getCategories
)

// 获取热门资产
router.get('/popular', 
  optionalAuth,
  validateQuery(popularQuerySchema),
  assetsController.getPopularAssets
)

// 获取用户资产统计
router.get('/stats/user', 
  authenticateUser,
  assetsController.getUserAssetStats
)

// 获取资产列表
router.get('/', 
  optionalAuth,
  validateQuery(querySchema),
  assetsController.getAssets
)

// 创建新资产
router.post('/', 
  authenticateUser,
  validateBody(createAssetSchema),
  assetsController.createAsset
)

// 复制资产
router.post('/:id/duplicate', 
  authenticateUser,
  validateBody(duplicateAssetSchema),
  assetsController.duplicateAsset
)

// 获取资产详情
router.get('/:id', 
  optionalAuth,
  assetsController.getAssetById
)

// 更新资产
router.put('/:id', 
  authenticateUser,
  validateBody(updateAssetSchema),
  assetsController.updateAsset
)

// 删除资产
router.delete('/:id', 
  authenticateUser,
  assetsController.deleteAsset
)

export { router as assetsRouter }
