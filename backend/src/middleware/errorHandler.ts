import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

// 自定义错误类
export class AppError extends Error {
  public statusCode: number
  public code: string
  public details?: any

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.name = 'AppError'
  }
}

// AI服务错误
export class AIServiceError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 503, 'AI_SERVICE_UNAVAILABLE', details)
  }
}

// 验证错误
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

// 错误处理中间件
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  // Zod验证错误
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '请求参数验证失败',
        details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      }
    })
  }

  // Prisma数据库错误
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // 唯一约束违反
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: '数据已存在',
          details: error.meta
        }
      })
    }

    // 记录不存在
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '请求的资源不存在'
        }
      })
    }

    // 其他数据库错误
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: '数据库操作失败'
      }
    })
  }

  // 自定义应用错误
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    })
  }

  // 默认服务器错误
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : '服务器内部错误'
    }
  })
}
