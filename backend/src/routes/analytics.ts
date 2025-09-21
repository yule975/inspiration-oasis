import { Router } from 'express'
import { z } from 'zod'
import { analyticsController } from '@/controllers/analyticsController'
import { authenticateUser, optionalAuth } from '@/middleware/auth'

const router = Router()

// 验证schemas
const dashboardQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('week')
})

const trendsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'quarter']).default('week'),
  type: z.enum(['hot_topics', 'emerging_trends', 'all']).default('all')
})

const insightsQuerySchema = z.object({
  type: z.enum(['content_quality', 'user_behavior', 'trend_prediction']).default('content_quality')
})

const userActivityQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month']).default('week'),
  user_id: z.string().optional()
})

const chartQuerySchema = z.object({
  metric: z.enum(['ideas', 'assets', 'users', 'comments', 'likes']).default('ideas'),
  period: z.enum(['day', 'week', 'month', 'quarter']).default('week'),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day')
})

// 验证中间件
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

// 仪表板统计数据
router.get('/dashboard', 
  optionalAuth,
  validateQuery(dashboardQuerySchema),
  analyticsController.getDashboardStats
)

// 趋势分析数据
router.get('/trends', 
  optionalAuth,
  validateQuery(trendsQuerySchema),
  analyticsController.getTrendsData
)

// AI洞察报告
router.get('/insights', 
  optionalAuth,
  validateQuery(insightsQuerySchema),
  analyticsController.getInsights
)

// 用户活动统计
router.get('/user-activity', 
  authenticateUser,
  validateQuery(userActivityQuerySchema),
  analyticsController.getUserActivity
)

// 图表数据
router.get('/chart-data', 
  optionalAuth,
  validateQuery(chartQuerySchema),
  analyticsController.getChartData
)

export { router as analyticsRouter }
