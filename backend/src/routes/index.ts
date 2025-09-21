import { Router } from 'express'
import { ideasRouter } from './ideas'
import { assetsRouter } from './assets'
import { aiRouter } from './ai'
import { analyticsRouter } from './analytics'
import { tagsRouter } from './tags'
import { uploadRouter } from './upload'
import { notificationsRouter } from './notifications'
import { authRouter } from './auth'
import { monitoringRouter } from './monitoring'

// 创建主路由
const router = Router()

// API信息端点
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '灵感绿洲 API v1.0',
    data: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        auth: '/api/auth',
        ideas: '/api/ideas',
        assets: '/api/assets',
        ai: '/api/ai',
        analytics: '/api/analytics',
        tags: '/api/tags',
        upload: '/api/upload',
        notifications: '/api/notifications',
        monitoring: '/api/monitoring'
      },
      documentation: '查看项目根目录的 API-文档.md'
    }
  })
})

// 注册子路由
router.use('/auth', authRouter)
router.use('/ideas', ideasRouter)
router.use('/assets', assetsRouter)
router.use('/ai', aiRouter)
router.use('/analytics', analyticsRouter)
router.use('/tags', tagsRouter)
router.use('/upload', uploadRouter)
router.use('/notifications', notificationsRouter)
router.use('/monitoring', monitoringRouter)

export { router as apiRoutes }
