import { Request, Response, NextFunction } from 'express'
import { performance } from 'perf_hooks'

// 性能监控中间件
interface PerformanceMetrics {
  requestCount: number
  totalDuration: number
  averageDuration: number
  slowRequests: number
  errorCount: number
  endpoints: Map<string, {
    count: number
    totalDuration: number
    averageDuration: number
    slowCount: number
  }>
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    totalDuration: 0,
    averageDuration: 0,
    slowRequests: 0,
    errorCount: 0,
    endpoints: new Map()
  }

  private slowRequestThreshold = 1000 // 1秒
  private startTime = Date.now()

  // 中间件函数
  middleware = (req: Request, res: Response, next: NextFunction) => {
    const startTime = performance.now()
    const originalSend = res.send

    // 重写 send 方法来捕获响应时间
    res.send = function(body) {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // 更新性能指标
      performanceMonitor.updateMetrics(req, res, duration)
      
      return originalSend.call(this, body)
    }

    next()
  }

  // 更新性能指标
  private updateMetrics(req: Request, res: Response, duration: number) {
    const endpoint = `${req.method} ${req.route?.path || req.path}`
    
    // 更新全局指标
    this.metrics.requestCount++
    this.metrics.totalDuration += duration
    this.metrics.averageDuration = this.metrics.totalDuration / this.metrics.requestCount

    // 检查慢请求
    if (duration > this.slowRequestThreshold) {
      this.metrics.slowRequests++
      console.warn(`🐌 慢请求警告: ${endpoint} - ${duration.toFixed(2)}ms`)
    }

    // 检查错误
    if (res.statusCode >= 400) {
      this.metrics.errorCount++
    }

    // 更新端点特定指标
    if (!this.metrics.endpoints.has(endpoint)) {
      this.metrics.endpoints.set(endpoint, {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        slowCount: 0
      })
    }

    const endpointMetrics = this.metrics.endpoints.get(endpoint)!
    endpointMetrics.count++
    endpointMetrics.totalDuration += duration
    endpointMetrics.averageDuration = endpointMetrics.totalDuration / endpointMetrics.count

    if (duration > this.slowRequestThreshold) {
      endpointMetrics.slowCount++
    }

    // 记录详细性能信息
    if (process.env.NODE_ENV === 'development') {
      const statusIcon = res.statusCode >= 400 ? '❌' : '✅'
      const speedIcon = duration > this.slowRequestThreshold ? '🐌' : duration > 500 ? '🟡' : '🟢'
      
      console.log(`${statusIcon} ${speedIcon} ${endpoint} - ${duration.toFixed(2)}ms [${res.statusCode}]`)
    }
  }

  // 获取性能报告
  getReport() {
    const uptime = Date.now() - this.startTime
    const uptimeHours = uptime / (1000 * 60 * 60)

    // 生成端点报告
    const endpointReports = Array.from(this.metrics.endpoints.entries())
      .map(([endpoint, metrics]) => ({
        endpoint,
        requests: metrics.count,
        averageTime: Number(metrics.averageDuration.toFixed(2)),
        totalTime: Number(metrics.totalDuration.toFixed(2)),
        slowRequests: metrics.slowCount,
        slowRequestRate: Number(((metrics.slowCount / metrics.count) * 100).toFixed(2))
      }))
      .sort((a, b) => b.averageTime - a.averageTime) // 按平均响应时间排序

    return {
      overview: {
        uptime: Number(uptimeHours.toFixed(2)) + ' hours',
        totalRequests: this.metrics.requestCount,
        averageResponseTime: Number(this.metrics.averageDuration.toFixed(2)) + 'ms',
        slowRequests: this.metrics.slowRequests,
        slowRequestRate: Number(((this.metrics.slowRequests / this.metrics.requestCount) * 100).toFixed(2)) + '%',
        errorCount: this.metrics.errorCount,
        errorRate: Number(((this.metrics.errorCount / this.metrics.requestCount) * 100).toFixed(2)) + '%',
        requestsPerHour: Number((this.metrics.requestCount / uptimeHours).toFixed(2))
      },
      endpoints: endpointReports.slice(0, 20), // 显示前20个端点
      warnings: this.generateWarnings()
    }
  }

  // 生成性能警告
  private generateWarnings() {
    const warnings = []

    // 全局性能警告
    if (this.metrics.averageDuration > 500) {
      warnings.push({
        type: 'performance',
        level: 'warning',
        message: `全局平均响应时间较高: ${this.metrics.averageDuration.toFixed(2)}ms`
      })
    }

    if (this.metrics.averageDuration > 1000) {
      warnings.push({
        type: 'performance',
        level: 'critical',
        message: `全局平均响应时间过高: ${this.metrics.averageDuration.toFixed(2)}ms`
      })
    }

    // 慢请求警告
    const slowRequestRate = (this.metrics.slowRequests / this.metrics.requestCount) * 100
    if (slowRequestRate > 5) {
      warnings.push({
        type: 'performance',
        level: 'warning',
        message: `慢请求比例过高: ${slowRequestRate.toFixed(2)}%`
      })
    }

    // 错误率警告
    const errorRate = (this.metrics.errorCount / this.metrics.requestCount) * 100
    if (errorRate > 1) {
      warnings.push({
        type: 'error',
        level: 'warning',
        message: `错误率过高: ${errorRate.toFixed(2)}%`
      })
    }

    // 端点特定警告
    for (const [endpoint, metrics] of this.metrics.endpoints.entries()) {
      if (metrics.averageDuration > 2000) {
        warnings.push({
          type: 'endpoint',
          level: 'critical',
          message: `端点 ${endpoint} 平均响应时间过长: ${metrics.averageDuration.toFixed(2)}ms`
        })
      }

      const endpointSlowRate = (metrics.slowCount / metrics.count) * 100
      if (endpointSlowRate > 10) {
        warnings.push({
          type: 'endpoint',
          level: 'warning',
          message: `端点 ${endpoint} 慢请求比例过高: ${endpointSlowRate.toFixed(2)}%`
        })
      }
    }

    return warnings
  }

  // 重置指标
  reset() {
    this.metrics = {
      requestCount: 0,
      totalDuration: 0,
      averageDuration: 0,
      slowRequests: 0,
      errorCount: 0,
      endpoints: new Map()
    }
    this.startTime = Date.now()
  }

  // 获取实时状态
  getHealthStatus() {
    const report = this.getReport()
    const criticalWarnings = report.warnings.filter(w => w.level === 'critical').length
    const warnings = report.warnings.filter(w => w.level === 'warning').length

    let status = 'healthy'
    if (criticalWarnings > 0) {
      status = 'critical'
    } else if (warnings > 0) {
      status = 'warning'
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      summary: {
        requests: this.metrics.requestCount,
        averageResponseTime: Number(this.metrics.averageDuration.toFixed(2)),
        errorRate: Number(((this.metrics.errorCount / this.metrics.requestCount) * 100).toFixed(2)),
        slowRequestRate: Number(((this.metrics.slowRequests / this.metrics.requestCount) * 100).toFixed(2))
      },
      warnings: {
        critical: criticalWarnings,
        warning: warnings,
        total: criticalWarnings + warnings
      }
    }
  }
}

// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor()

// 性能监控路由处理器
export const performanceRoutes = {
  // 获取性能报告
  getReport: (req: Request, res: Response) => {
    const report = performanceMonitor.getReport()
    res.json({
      success: true,
      data: report,
      generatedAt: new Date().toISOString()
    })
  },

  // 获取健康状态
  getHealth: (req: Request, res: Response) => {
    const health = performanceMonitor.getHealthStatus()
    res.json({
      success: true,
      data: health
    })
  },

  // 重置监控数据
  reset: (req: Request, res: Response) => {
    performanceMonitor.reset()
    res.json({
      success: true,
      message: '性能监控数据已重置'
    })
  }
}
