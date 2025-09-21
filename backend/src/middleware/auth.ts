import { Request, Response, NextFunction } from 'express'
import { AppError } from './errorHandler'
import { authService } from '@/services/authService'

// 扩展Express Request类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        name: string
        email: string
        role: string
      }
      tokenExpiry?: number
    }
  }
}

// JWT用户认证中间件
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('需要Bearer Token认证', 401, 'AUTHENTICATION_REQUIRED')
    }

    const token = authHeader.substring(7) // 移除 "Bearer " 前缀
    
    try {
      const decoded = await authService.verifyAccessToken(token)
      
      // 设置用户信息到请求对象
      req.user = {
        id: decoded.userId,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role
      }
      
      req.tokenExpiry = decoded.exp

      next()
    } catch (error) {
      throw new AppError('无效或过期的访问令牌', 401, 'INVALID_TOKEN')
    }
  } catch (error) {
    next(error)
  }
}

// 简化认证中间件（向后兼容，开发和测试使用）
export async function authenticateUserSimple(req: Request, res: Response, next: NextFunction) {
  try {
    // 从请求头获取用户信息（临时简化方案）
    const userId = req.headers['x-user-id'] as string
    const userName = req.headers['x-user-name'] as string
    
    if (!userId) {
      throw new AppError('需要用户认证', 401, 'AUTHENTICATION_REQUIRED')
    }

    // 设置用户信息到请求对象
    req.user = {
      id: userId,
      name: userName || '匿名用户',
      email: `${userId}@example.com`,
      role: 'user'
    }

    next()
  } catch (error) {
    next(error)
  }
}

// 可选认证中间件（支持JWT和简化认证）
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    const userId = req.headers['x-user-id'] as string
    const userName = req.headers['x-user-name'] as string
    
    // 优先尝试JWT认证
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      try {
        const decoded = await authService.verifyAccessToken(token)
        req.user = {
          id: decoded.userId,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role
        }
        req.tokenExpiry = decoded.exp
      } catch (error) {
        // JWT认证失败，尝试简化认证
        if (userId) {
          req.user = {
            id: userId,
            name: userName || '匿名用户',
            email: `${userId}@example.com`,
            role: 'user'
          }
        }
      }
    } else if (userId) {
      // 使用简化认证
      req.user = {
        id: userId,
        name: userName || '匿名用户',
        email: `${userId}@example.com`,
        role: 'user'
      }
    }

    next()
  } catch (error) {
    // 可选认证失败时不阻断请求
    next()
  }
}

// 角色检查中间件
export function requireRole(roles: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('需要用户认证', 401, 'AUTHENTICATION_REQUIRED')
      }

      const userRole = req.user.role
      const allowedRoles = Array.isArray(roles) ? roles : [roles]

      if (!allowedRoles.includes(userRole)) {
        throw new AppError('权限不足', 403, 'INSUFFICIENT_PERMISSIONS')
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// 管理员检查中间件
export const requireAdmin = requireRole(['admin', 'super_admin'])

// 用户或管理员检查中间件
export const requireUserOrAdmin = requireRole(['user', 'admin', 'super_admin'])

// API Key认证（临时方案，向后兼容）
export function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string

  if (!apiKey || apiKey !== 'temp-api-key') {
    throw new AppError('API密钥无效', 401, 'INVALID_API_KEY')
  }

  next()
}