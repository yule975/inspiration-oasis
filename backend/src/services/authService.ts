import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma, isDatabaseConnected, isSupabaseConnected } from '@/config/database'
import { supabase } from '@/config/supabase'
import { AppError } from '@/middleware/errorHandler'
import { cacheService } from '@/config/redis'

// JWT载荷类型
export interface JwtPayload {
  userId: string
  email: string
  name: string
  role: string
  iat?: number
  exp?: number
}

// 用户注册数据
export interface RegisterData {
  email: string
  password: string
  name: string
  avatar?: string
}

// 用户登录数据
export interface LoginData {
  email: string
  password: string
}

// 认证响应数据
export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    avatar?: string
    role: string
    createdAt: Date
  }
  token: string
  refreshToken: string
  expiresIn: number
}

class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key'
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
  private readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

  // 用户注册
  async register(registerData: RegisterData): Promise<AuthResponse> {
    const { email, password, name, avatar } = registerData

    try {
      let existingUser, user
      
      if (isDatabaseConnected) {
        // 使用Prisma
        existingUser = await prisma.user.findUnique({
          where: { email }
        })
      } else if (isSupabaseConnected) {
        // 使用Supabase客户端
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()
        existingUser = data
      } else {
        throw new AppError('数据库连接不可用', 500, 'DATABASE_UNAVAILABLE')
      }

      if (existingUser) {
        throw new AppError('邮箱已被注册', 400, 'EMAIL_ALREADY_EXISTS')
      }

      // 密码加密
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
      const hashedPassword = await bcrypt.hash(password, saltRounds)

      // 创建用户
      if (isDatabaseConnected) {
        user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            avatar: avatar || this.generateDefaultAvatar(name),
            role: 'user',
            isActive: true
          }
        })
      } else if (isSupabaseConnected) {
        const { data, error } = await supabase
          .from('users')
          .insert({
            email,
            password: hashedPassword,
            name,
            avatar: avatar || this.generateDefaultAvatar(name),
            role: 'user',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (error) throw error
        user = {
          id: data.id,
          email: data.email,
          name: data.name,
          avatar: data.avatar,
          role: data.role,
          createdAt: new Date(data.created_at)
        }
      }

      // 生成令牌
      const tokens = await this.generateTokens(user)

      // 存储刷新令牌
      await this.storeRefreshToken(user.id, tokens.refreshToken)

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt
        },
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('注册失败', 500, 'REGISTER_ERROR')
    }
  }

  // 用户登录
  async login(loginData: LoginData): Promise<AuthResponse> {
    const { email, password } = loginData

    try {
      let user
      
      if (isDatabaseConnected) {
        // 使用Prisma
        user = await prisma.user.findUnique({
          where: { email }
        })
      } else if (isSupabaseConnected) {
        // 使用Supabase客户端
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()
        user = data ? {
          id: data.id,
          email: data.email,
          name: data.name,
          avatar: data.avatar,
          role: data.role,
          password: data.password,
          isActive: data.is_active,
          createdAt: new Date(data.created_at)
        } : null
      } else {
        throw new AppError('数据库连接不可用', 500, 'DATABASE_UNAVAILABLE')
      }

      if (!user) {
        throw new AppError('邮箱或密码错误', 401, 'INVALID_CREDENTIALS')
      }

      if (!user.isActive) {
        throw new AppError('账户已被禁用', 401, 'ACCOUNT_DISABLED')
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password || '')
      if (!isPasswordValid) {
        throw new AppError('邮箱或密码错误', 401, 'INVALID_CREDENTIALS')
      }

      // 更新最后登录时间
      if (isDatabaseConnected) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        })
      } else if (isSupabaseConnected) {
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', user.id)
      }

      // 生成令牌
      const tokens = await this.generateTokens(user)

      // 存储刷新令牌
      await this.storeRefreshToken(user.id, tokens.refreshToken)

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt
        },
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('登录失败', 500, 'LOGIN_ERROR')
    }
  }

  // 刷新令牌
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // 验证刷新令牌
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as JwtPayload

      // 检查刷新令牌是否在存储中
      const storedToken = await cacheService.get(`refresh_token:${decoded.userId}`)
      if (storedToken !== refreshToken) {
        throw new AppError('刷新令牌无效', 401, 'INVALID_REFRESH_TOKEN')
      }

      // 获取用户信息
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      })

      if (!user || !user.isActive) {
        throw new AppError('用户不存在或已被禁用', 401, 'USER_NOT_FOUND')
      }

      // 生成新的令牌
      const tokens = await this.generateTokens(user)

      // 更新存储的刷新令牌
      await this.storeRefreshToken(user.id, tokens.refreshToken)

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt
        },
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('刷新令牌无效', 401, 'INVALID_REFRESH_TOKEN')
      }
      throw new AppError('刷新令牌失败', 500, 'REFRESH_TOKEN_ERROR')
    }
  }

  // 用户登出
  async logout(userId: string): Promise<void> {
    try {
      // 删除存储的刷新令牌
      await cacheService.del(`refresh_token:${userId}`)
      
      // 将访问令牌加入黑名单（可选，需要额外的黑名单机制）
      console.log(`用户 ${userId} 已登出`)
    } catch (error) {
      console.error('登出失败:', error)
      throw new AppError('登出失败', 500, 'LOGOUT_ERROR')
    }
  }

  // 验证访问令牌
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JwtPayload
      
      // 检查用户是否仍然存在且活跃
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, isActive: true }
      })

      if (!user || !user.isActive) {
        throw new AppError('用户不存在或已被禁用', 401, 'USER_NOT_FOUND')
      }

      return decoded
    } catch (error) {
      if (error instanceof AppError) throw error
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('访问令牌无效', 401, 'INVALID_ACCESS_TOKEN')
      }
      throw new AppError('令牌验证失败', 500, 'TOKEN_VERIFICATION_ERROR')
    }
  }

  // 修改密码
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    try {
      // 获取用户当前密码
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
      })

      if (!user) {
        throw new AppError('用户不存在', 404, 'USER_NOT_FOUND')
      }

      // 验证旧密码
      const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password || '')
      if (!isOldPasswordValid) {
        throw new AppError('当前密码错误', 400, 'INVALID_OLD_PASSWORD')
      }

      // 加密新密码
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

      // 更新密码
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      })

      // 清除所有刷新令牌（强制重新登录）
      await cacheService.del(`refresh_token:${userId}`)
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('修改密码失败', 500, 'CHANGE_PASSWORD_ERROR')
    }
  }

  // 重置密码请求
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        // 为了安全，即使用户不存在也返回成功
        console.log(`密码重置请求 - 用户不存在: ${email}`)
        return
      }

      // 生成重置令牌
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email },
        this.JWT_SECRET,
        { expiresIn: '1h' }
      ) as string

      // 存储重置令牌
      await cacheService.set(`password_reset:${user.id}`, resetToken, 3600) // 1小时

      // 这里应该发送重置邮件
      console.log(`密码重置令牌已生成: ${resetToken}`)
      console.log(`重置链接: http://localhost:3000/reset-password?token=${resetToken}`)

      // TODO: 集成邮件服务发送重置链接
    } catch (error) {
      throw new AppError('发送密码重置邮件失败', 500, 'PASSWORD_RESET_REQUEST_ERROR')
    }
  }

  // 重置密码
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // 验证重置令牌
      const decoded = jwt.verify(token, this.JWT_SECRET) as JwtPayload

      // 检查令牌是否在存储中
      const storedToken = await cacheService.get(`password_reset:${decoded.userId}`)
      if (storedToken !== token) {
        throw new AppError('重置令牌无效或已过期', 400, 'INVALID_RESET_TOKEN')
      }

      // 加密新密码
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

      // 更新密码
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword }
      })

      // 删除重置令牌
      await cacheService.del(`password_reset:${decoded.userId}`)

      // 清除所有刷新令牌
      await cacheService.del(`refresh_token:${decoded.userId}`)
    } catch (error) {
      if (error instanceof AppError) throw error
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('重置令牌无效', 400, 'INVALID_RESET_TOKEN')
      }
      throw new AppError('重置密码失败', 500, 'PASSWORD_RESET_ERROR')
    }
  }

  // 获取用户信息
  async getUserProfile(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          isActive: true
        }
      })

      if (!user) {
        throw new AppError('用户不存在', 404, 'USER_NOT_FOUND')
      }

      return user
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('获取用户信息失败', 500, 'GET_USER_PROFILE_ERROR')
    }
  }

  // 更新用户信息
  async updateUserProfile(userId: string, updateData: { name?: string, avatar?: string }) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      })

      return user
    } catch (error) {
      throw new AppError('更新用户信息失败', 500, 'UPDATE_USER_PROFILE_ERROR')
    }
  }

  // 私有方法：生成令牌
  private async generateTokens(user: any) {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    }) as string

    const refreshToken = jwt.sign({ userId: user.id }, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN
    }) as string

    // 计算过期时间（秒）
    const expiresIn = this.parseExpiresIn(this.JWT_EXPIRES_IN)

    return {
      accessToken,
      refreshToken,
      expiresIn
    }
  }

  // 私有方法：存储刷新令牌
  private async storeRefreshToken(userId: string, refreshToken: string) {
    const expiresIn = this.parseExpiresIn(this.JWT_REFRESH_EXPIRES_IN)
    await cacheService.set(`refresh_token:${userId}`, refreshToken, expiresIn)
  }

  // 私有方法：解析过期时间
  private parseExpiresIn(expiresIn: string): number {
    if (expiresIn.endsWith('h')) {
      return parseInt(expiresIn) * 3600
    } else if (expiresIn.endsWith('d')) {
      return parseInt(expiresIn) * 24 * 3600
    } else if (expiresIn.endsWith('m')) {
      return parseInt(expiresIn) * 60
    } else {
      return parseInt(expiresIn)
    }
  }

  // 私有方法：生成默认头像
  private generateDefaultAvatar(name: string): string {
    // 使用 Gravatar 默认头像或其他头像服务
    const firstChar = name.charAt(0).toUpperCase()
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2F6A53&color=ffffff&size=128`
  }
}

export const authService = new AuthService()
