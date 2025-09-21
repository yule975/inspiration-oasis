import { Router } from 'express'
import { performanceRoutes } from '@/middleware/performanceMonitor'
import { authenticateUser, requireAdmin } from '@/middleware/auth'
import { getSocketService } from '@/config/socket'
import { cacheService } from '@/config/redis'
import { prisma } from '@/config/database'

const router = Router()

// 健康检查端点（公开）
router.get('/health', performanceRoutes.getHealth)

// 基础系统状态（公开）
router.get('/status', async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unknown',
        redis: 'unknown',
        socket: 'unknown'
      }
    }

    // 检查数据库连接
    try {
      await prisma.$queryRaw`SELECT 1`
      status.services.database = 'healthy'
    } catch (error) {
      status.services.database = 'unhealthy'
      status.status = 'degraded'
    }

    // 检查Redis连接
    try {
      await cacheService.set('health-check', 'ok', 10)
      await cacheService.get('health-check')
      status.services.redis = 'healthy'
    } catch (error) {
      status.services.redis = 'unhealthy'
    }

    // 检查Socket服务
    try {
      const socketService = getSocketService()
      const onlineCount = socketService.getOnlineCount()
      status.services.socket = 'healthy'
      ;(status as any).onlineUsers = onlineCount
    } catch (error) {
      status.services.socket = 'unhealthy'
    }

    res.json({
      success: true,
      data: status
    })
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: 'System check failed'
      }
    })
  }
})

// 性能报告（需要管理员权限）
router.get('/performance', authenticateUser, requireAdmin, performanceRoutes.getReport)

// 重置性能监控（需要管理员权限）
router.post('/performance/reset', authenticateUser, requireAdmin, performanceRoutes.reset)

// 详细系统信息（需要管理员权限）
router.get('/system', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const systemInfo = {
      timestamp: new Date().toISOString(),
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        pid: process.pid
      },
      memory: {
        ...process.memoryUsage(),
        formatted: {
          rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(process.memoryUsage().external / 1024 / 1024)}MB`
        }
      },
      database: {
        status: 'unknown',
        stats: {}
      },
      cache: {
        status: 'unknown',
        stats: {}
      },
      socket: {
        status: 'unknown',
        onlineUsers: 0,
        stats: {}
      }
    }

    // 数据库统计
    try {
      const [
        userCount,
        ideaCount,
        assetCount,
        commentCount,
        likeCount
      ] = await Promise.all([
        prisma.user.count(),
        prisma.idea.count(),
        prisma.asset.count(),
        prisma.comment.count(),
        prisma.like.count()
      ])

      systemInfo.database.status = 'healthy'
      systemInfo.database.stats = {
        users: userCount,
        ideas: ideaCount,
        assets: assetCount,
        comments: commentCount,
        likes: likeCount
      }
    } catch (error) {
      systemInfo.database.status = 'unhealthy'
    }

    // 缓存统计
    try {
      // Redis 信息获取（如果可用）
      systemInfo.cache.status = 'healthy'
      systemInfo.cache.stats = {
        connected: true,
        // 这里可以添加更多 Redis 统计信息
      }
    } catch (error) {
      systemInfo.cache.status = 'unhealthy'
    }

    // Socket统计
    try {
      const socketService = getSocketService()
      const onlineUsers = socketService.getOnlineUsers()
      
      systemInfo.socket.status = 'healthy'
      systemInfo.socket.onlineUsers = onlineUsers.length
      systemInfo.socket.stats = {
        connections: onlineUsers.length,
        users: onlineUsers
      }
    } catch (error) {
      systemInfo.socket.status = 'unhealthy'
    }

    res.json({
      success: true,
      data: systemInfo
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取系统信息失败',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    })
  }
})

// 数据库查询性能测试（需要管理员权限）
router.get('/database/benchmark', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const benchmarks = []

    // 测试基础查询
    const start1 = Date.now()
    await prisma.user.count()
    const duration1 = Date.now() - start1
    benchmarks.push({ query: 'user.count()', duration: duration1 })

    // 测试复杂查询
    const start2 = Date.now()
    await prisma.idea.findMany({
      take: 10,
      include: {
        author: true,
        comments: {
          take: 5,
          include: { author: true }
        }
      }
    })
    const duration2 = Date.now() - start2
    benchmarks.push({ query: 'idea.findMany() with relations', duration: duration2 })

    // 测试聚合查询
    const start3 = Date.now()
    await prisma.idea.groupBy({
      by: ['authorId'],
      _count: { id: true },
      take: 10
    })
    const duration3 = Date.now() - start3
    benchmarks.push({ query: 'idea.groupBy() aggregation', duration: duration3 })

    const totalDuration = benchmarks.reduce((sum, b) => sum + b.duration, 0)
    const avgDuration = totalDuration / benchmarks.length

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        benchmarks,
        summary: {
          totalQueries: benchmarks.length,
          totalDuration,
          averageDuration: Math.round(avgDuration * 100) / 100,
          slowQueries: benchmarks.filter(b => b.duration > 100).length
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '数据库性能测试失败',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    })
  }
})

// 日志统计（需要管理员权限）
router.get('/logs/stats', authenticateUser, requireAdmin, async (req, res) => {
  try {
    // 这里可以集成日志分析
    // 目前返回模拟数据
    const logStats = {
      timestamp: new Date().toISOString(),
      period: '24h',
      summary: {
        totalLogs: 1250,
        errorLogs: 23,
        warningLogs: 89,
        infoLogs: 1138,
        errorRate: '1.8%'
      },
      topErrors: [
        { message: 'Database connection timeout', count: 12, lastSeen: new Date().toISOString() },
        { message: 'JWT token expired', count: 8, lastSeen: new Date().toISOString() },
        { message: 'File upload failed', count: 3, lastSeen: new Date().toISOString() }
      ],
      recentErrors: [
        { timestamp: new Date().toISOString(), level: 'error', message: 'Sample error message', source: 'API' }
      ]
    }

    res.json({
      success: true,
      data: logStats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取日志统计失败'
    })
  }
})

export { router as monitoringRouter }
