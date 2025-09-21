import { Request, Response } from 'express'
import { z } from 'zod'
import { authService, RegisterData, LoginData } from '@/services/authService'
import { AppError } from '@/middleware/errorHandler'

// 验证schemas
const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string()
    .min(8, '密码至少8位')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字'),
  name: z.string().min(2, '姓名至少2个字符').max(50, '姓名不能超过50个字符'),
  avatar: z.string().url('头像URL格式不正确').optional()
})

const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空')
})

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, '刷新令牌不能为空')
})

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '当前密码不能为空'),
  newPassword: z.string()
    .min(8, '新密码至少8位')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '新密码必须包含大小写字母和数字')
})

const resetPasswordRequestSchema = z.object({
  email: z.string().email('邮箱格式不正确')
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, '重置令牌不能为空'),
  password: z.string()
    .min(8, '密码至少8位')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字')
})

const updateProfileSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符').max(50, '姓名不能超过50个字符').optional(),
  avatar: z.string().url('头像URL格式不正确').optional()
})

class AuthController {
  // 用户注册
  async register(req: Request, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body)
      const result = await authService.register(validatedData as RegisterData)

      res.status(201).json({
        success: true,
        data: result,
        message: '注册成功'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(error.errors[0].message, 400, 'VALIDATION_ERROR')
      }
      throw error
    }
  }

  // 用户登录
  async login(req: Request, res: Response) {
    try {
      const validatedData = loginSchema.parse(req.body)
      const result = await authService.login(validatedData as LoginData)

      res.json({
        success: true,
        data: result,
        message: '登录成功'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(error.errors[0].message, 400, 'VALIDATION_ERROR')
      }
      throw error
    }
  }

  // 刷新令牌
  async refreshToken(req: Request, res: Response) {
    try {
      const validatedData = refreshTokenSchema.parse(req.body)
      const result = await authService.refreshToken(validatedData.refreshToken)

      res.json({
        success: true,
        data: result,
        message: '令牌刷新成功'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(error.errors[0].message, 400, 'VALIDATION_ERROR')
      }
      throw error
    }
  }

  // 用户登出
  async logout(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      await authService.logout(userId)

      res.json({
        success: true,
        message: '登出成功'
      })
    } catch (error) {
      throw error
    }
  }

  // 获取用户信息
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      const profile = await authService.getUserProfile(userId)

      res.json({
        success: true,
        data: profile
      })
    } catch (error) {
      throw error
    }
  }

  // 更新用户信息
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      const validatedData = updateProfileSchema.parse(req.body)
      
      const updatedProfile = await authService.updateUserProfile(userId, validatedData)

      res.json({
        success: true,
        data: updatedProfile,
        message: '用户信息更新成功'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(error.errors[0].message, 400, 'VALIDATION_ERROR')
      }
      throw error
    }
  }

  // 修改密码
  async changePassword(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      const validatedData = changePasswordSchema.parse(req.body)
      
      await authService.changePassword(
        userId,
        validatedData.oldPassword,
        validatedData.newPassword
      )

      res.json({
        success: true,
        message: '密码修改成功，请重新登录'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(error.errors[0].message, 400, 'VALIDATION_ERROR')
      }
      throw error
    }
  }

  // 密码重置请求
  async requestPasswordReset(req: Request, res: Response) {
    try {
      const validatedData = resetPasswordRequestSchema.parse(req.body)
      await authService.requestPasswordReset(validatedData.email)

      res.json({
        success: true,
        message: '如果邮箱存在，重置链接已发送到您的邮箱'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(error.errors[0].message, 400, 'VALIDATION_ERROR')
      }
      throw error
    }
  }

  // 重置密码
  async resetPassword(req: Request, res: Response) {
    try {
      const validatedData = resetPasswordSchema.parse(req.body)
      await authService.resetPassword(validatedData.token, validatedData.password)

      res.json({
        success: true,
        message: '密码重置成功，请使用新密码登录'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(error.errors[0].message, 400, 'VALIDATION_ERROR')
      }
      throw error
    }
  }

  // 验证令牌（用于前端检查令牌是否有效）
  async verifyToken(req: Request, res: Response) {
    try {
      // 如果中间件已经验证了令牌，说明令牌有效
      const user = req.user!

      res.json({
        success: true,
        data: {
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      })
    } catch (error) {
      throw error
    }
  }

  // 获取当前会话信息
  async getSession(req: Request, res: Response) {
    try {
      const user = req.user!
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          isAuthenticated: true,
          sessionExpiry: req.tokenExpiry
        }
      })
    } catch (error) {
      throw error
    }
  }
}

export const authController = new AuthController()
