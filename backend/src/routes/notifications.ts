import { Router } from 'express'
import { z } from 'zod'
import { notificationService } from '@/services/notificationService'
import { getSocketService } from '@/config/socket'
import { authenticateUser } from '@/middleware/auth'
import { AppError } from '@/middleware/errorHandler'

const router = Router()

// 验证schemas
const markReadSchema = z.object({
  notification_id: z.string().min(1, '通知ID不能为空')
})

const broadcastSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题不能超过100字'),
  message: z.string().min(1, '消息内容不能为空').max(500, '消息内容不能超过500字'),
  metadata: z.object({}).optional()
})

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20)
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

// 获取用户通知列表
router.get('/', 
  authenticateUser,
  validateQuery(querySchema),
  async (req, res) => {
    try {
      const { page, limit } = req.query as any
      const userId = req.user!.id

      const notifications = await notificationService.getUserNotifications(userId, page, limit)

      res.json({
        success: true,
        data: notifications
      })
    } catch (error) {
      throw new AppError('获取通知列表失败', 500, 'FETCH_NOTIFICATIONS_ERROR')
    }
  }
)

// 获取未读通知数
router.get('/unread-count', 
  authenticateUser,
  async (req, res) => {
    try {
      const userId = req.user!.id
      const count = await notificationService.getUnreadCount(userId)

      res.json({
        success: true,
        data: { unread_count: count }
      })
    } catch (error) {
      throw new AppError('获取未读通知数失败', 500, 'FETCH_UNREAD_COUNT_ERROR')
    }
  }
)

// 标记通知为已读
router.put('/:id/read', 
  authenticateUser,
  async (req, res) => {
    try {
      const { id } = req.params
      const userId = req.user!.id

      await notificationService.markNotificationAsRead(id, userId)

      res.json({
        success: true,
        message: '通知已标记为已读'
      })
    } catch (error) {
      throw new AppError('标记通知已读失败', 500, 'MARK_READ_ERROR')
    }
  }
)

// 标记所有通知为已读
router.put('/read-all', 
  authenticateUser,
  async (req, res) => {
    try {
      const userId = req.user!.id

      await notificationService.markAllNotificationsAsRead(userId)

      res.json({
        success: true,
        message: '所有通知已标记为已读'
      })
    } catch (error) {
      throw new AppError('标记所有通知已读失败', 500, 'MARK_ALL_READ_ERROR')
    }
  }
)

// 发送系统广播通知（管理员功能）
router.post('/broadcast', 
  authenticateUser,
  validateBody(broadcastSchema),
  async (req, res) => {
    try {
      const { title, message, metadata } = req.body
      const userId = req.user!.id

      // 简单的权限检查（这里可以扩展为真正的角色检查）
      if (!userId.includes('admin')) {
        throw new AppError('权限不足', 403, 'FORBIDDEN')
      }

      const broadcast = await notificationService.sendSystemBroadcast(title, message, metadata)

      res.json({
        success: true,
        data: broadcast,
        message: '系统广播发送成功'
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('发送系统广播失败', 500, 'SEND_BROADCAST_ERROR')
    }
  }
)

// 获取实时连接状态
router.get('/connection-status', 
  authenticateUser,
  async (req, res) => {
    try {
      const socketService = getSocketService()
      const onlineUsers = socketService.getOnlineUsers()
      const onlineCount = socketService.getOnlineCount()
      const userId = req.user!.id
      const isOnline = socketService.isUserOnline(userId)

      res.json({
        success: true,
        data: {
          is_connected: isOnline,
          online_count: onlineCount,
          online_users: onlineUsers.slice(0, 10), // 只返回前10个在线用户
          user_id: userId
        }
      })
    } catch (error) {
      throw new AppError('获取连接状态失败', 500, 'FETCH_CONNECTION_STATUS_ERROR')
    }
  }
)

// 测试通知（开发用）
router.post('/test', 
  authenticateUser,
  async (req, res) => {
    try {
      const userId = req.user!.id
      const userName = req.user!.name

      // 发送测试通知
      await notificationService.notifyIdeaLiked(
        'test_idea_123',
        '测试灵感内容：这是一个用于测试的灵感',
        'test_user_456',
        '测试用户',
        userId
      )

      res.json({
        success: true,
        message: '测试通知已发送'
      })
    } catch (error) {
      throw new AppError('发送测试通知失败', 500, 'SEND_TEST_NOTIFICATION_ERROR')
    }
  }
)

export { router as notificationsRouter }
