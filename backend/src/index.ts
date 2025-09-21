import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import 'express-async-errors'
import dotenv from 'dotenv'
import { createServer } from 'http'

import { errorHandler } from '@/middleware/errorHandler'
import { logger } from '@/middleware/logger'
import { performanceMonitor } from '@/middleware/performanceMonitor'
import { apiRoutes } from '@/routes'
import { connectDatabase } from '@/config/database'
import { initRedis } from '@/config/redis'
import { initSocketService } from '@/config/socket'

// 加载环境变量
dotenv.config()

const app = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 3001

// 安全中间件
app.use(helmet())

// CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}))

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 限制每个IP 100个请求
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试'
    }
  }
})
app.use('/api', limiter)

// 基础中间件
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 静态文件服务 - 上传文件访问
const uploadDir = process.env.UPLOAD_DIR || './uploads'
app.use('/uploads', express.static(uploadDir))

// 日志中间件
app.use(logger)

// 性能监控中间件
app.use(performanceMonitor.middleware)

// 根路径欢迎页面
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎉 欢迎来到灵感绿洲后端服务！',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api',
      monitoring: '/api/monitoring/status'
    },
    description: '一个专为创意工作者设计的灵感管理平台',
    github: 'https://github.com/inspirations-oasis',
    status: 'running'
  })
})

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '灵感绿洲后端服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// API路由
app.use('/api', apiRoutes)

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `路径 ${req.originalUrl} 不存在`
    }
  })
})

// 错误处理中间件
app.use(errorHandler)

// 启动服务器
async function startServer() {
  try {
    // 连接数据库
    const dbConnected = await connectDatabase()
    if (dbConnected) {
      console.log('✅ 数据库连接成功')
    } else {
      console.log('⚠️  数据库连接失败，但服务继续启动')
    }

    // 初始化Redis (可选)
    try {
      await initRedis()
      console.log('✅ Redis连接成功')
    } catch (error) {
      console.log('⚠️  Redis连接失败，将使用内存缓存')
    }

    // 初始化Socket.io服务
    const socketService = initSocketService(httpServer)
    console.log('✅ Socket.io服务初始化成功')

    // 启动HTTP服务器
    httpServer.listen(PORT, () => {
      console.log(`🚀 灵感绿洲后端服务启动成功`)
      console.log(`📍 服务地址: http://localhost:${PORT}`)
      console.log(`🏥 健康检查: http://localhost:${PORT}/health`)
      console.log(`📚 API文档: http://localhost:${PORT}/api`)
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    console.error('❌ 服务启动失败:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 收到SIGTERM信号，开始优雅关闭...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🛑 收到SIGINT信号，开始优雅关闭...')
  process.exit(0)
})

// 启动应用
startServer()
