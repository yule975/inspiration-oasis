import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AppError } from '@/middleware/errorHandler'

// 创建Supabase客户端
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    avatar?: string
    role: string
    createdAt: string
  }
  token: string
  refreshToken: string
  expiresIn: number
}

class SupabaseAuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'inspirations-super-secret-jwt-key-2024'
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'inspirations-super-secret-refresh-key-2024'
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

  // 用户登录
  async login(loginData: LoginData): Promise<AuthResponse> {
    const { email, password } = loginData

    try {
      console.log('开始用户登录验证:', email)
      
      // 查询用户
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error || !user) {
        throw new AppError('用户不存在或密码错误', 401)
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password_hash)
      if (!isPasswordValid) {
        throw new AppError('用户不存在或密码错误', 401)
      }

      // 生成JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          role: user.role 
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN }
      ) as string

      // 生成refresh token
      const refreshToken = jwt.sign(
        { userId: user.id },
        this.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      ) as string

      // 更新最后登录时间
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id)

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar_url,
          role: user.role,
          createdAt: user.created_at
        },
        token,
        refreshToken,
        expiresIn: 24 * 60 * 60 // 24小时（秒）
      }
    } catch (error) {
      console.error('登录失败:', error)
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('登录失败，请稍后重试', 500)
    }
  }
}

export default new SupabaseAuthService()