import { Request, Response, NextFunction } from 'express'

// 简单的日志中间件
export function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  
  // 记录请求开始
  console.log(`📥 ${req.method} ${req.url} - ${req.ip}`)

  // 拦截响应结束事件
  const originalSend = res.send
  res.send = function(data) {
    const duration = Date.now() - start
    const statusColor = res.statusCode >= 400 ? '🔴' : '🟢'
    
    console.log(`📤 ${statusColor} ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`)
    
    return originalSend.call(this, data)
  }

  next()
}
