import { authService } from '@/services/authService'
import { testUtils, mockData } from '../setup'
import { AppError } from '@/middleware/errorHandler'

describe('AuthService 单元测试', () => {
  describe('用户注册', () => {
    it('应该成功注册新用户', async () => {
      const registerData = {
        email: 'newuser@test.com',
        password: 'TestPass123',
        name: '新用户'
      }

      const result = await authService.register(registerData)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('refreshToken')
      expect(result.user.email).toBe(registerData.email)
      expect(result.user.name).toBe(registerData.name)
      expect(result.user.role).toBe('user')
      expect(typeof result.token).toBe('string')
      expect(typeof result.refreshToken).toBe('string')
    })

    it('邮箱已存在时应该抛出错误', async () => {
      // 先创建一个用户
      await testUtils.createTestUser({
        email: 'existing@test.com'
      })

      const registerData = {
        email: 'existing@test.com',
        password: 'TestPass123',
        name: '重复用户'
      }

      await expect(authService.register(registerData))
        .rejects
        .toThrow(AppError)
    })

    it('密码应该被正确加密', async () => {
      const registerData = {
        email: 'password-test@test.com',
        password: 'TestPass123',
        name: '密码测试用户'
      }

      await authService.register(registerData)

      const prisma = testUtils.getPrisma()
      const user = await prisma.user.findUnique({
        where: { email: registerData.email }
      })

      expect(user?.password).toBeDefined()
      expect(user?.password).not.toBe(registerData.password)
      expect(user?.password?.startsWith('$2a$')).toBe(true)
    })
  })

  describe('用户登录', () => {
    let testUser: any

    beforeEach(async () => {
      testUser = await testUtils.createTestUser({
        email: 'login-test@test.com',
        password: '$2a$12$6vF7rF8sF8sF8sF8sF8sFeF8sF8sF8sF8sF8sF8sF8sF8sF8sF8s', // 'TestPass123'
      })
    })

    it('正确凭据应该成功登录', async () => {
      const loginData = {
        email: 'login-test@test.com',
        password: 'TestPass123'
      }

      // 由于实际的密码哈希复杂性，这里使用mock
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true)

      const result = await authService.login(loginData)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result.user.email).toBe(loginData.email)
    })

    it('错误密码应该抛出错误', async () => {
      const loginData = {
        email: 'login-test@test.com',
        password: 'WrongPassword123'
      }

      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(false)

      await expect(authService.login(loginData))
        .rejects
        .toThrow(AppError)
    })

    it('不存在的邮箱应该抛出错误', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'TestPass123'
      }

      await expect(authService.login(loginData))
        .rejects
        .toThrow(AppError)
    })

    it('禁用的用户应该无法登录', async () => {
      await testUtils.createTestUser({
        email: 'disabled-user@test.com',
        password: '$2a$12$hashedpassword',
        isActive: false
      })

      const loginData = {
        email: 'disabled-user@test.com',
        password: 'TestPass123'
      }

      await expect(authService.login(loginData))
        .rejects
        .toThrow(AppError)
    })
  })

  describe('令牌管理', () => {
    let testUser: any

    beforeEach(async () => {
      testUser = await testUtils.createTestUser()
    })

    it('应该能验证有效的访问令牌', async () => {
      // 使用 JWT 创建测试令牌
      const jwt = require('jsonwebtoken')
      const token = jwt.sign(
        {
          userId: testUser.id,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      )

      const decoded = await authService.verifyAccessToken(token)

      expect(decoded.userId).toBe(testUser.id)
      expect(decoded.email).toBe(testUser.email)
    })

    it('过期的令牌应该抛出错误', async () => {
      const jwt = require('jsonwebtoken')
      const expiredToken = jwt.sign(
        { userId: testUser.id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // 已过期
      )

      await expect(authService.verifyAccessToken(expiredToken))
        .rejects
        .toThrow(AppError)
    })

    it('无效的令牌应该抛出错误', async () => {
      const invalidToken = 'invalid.token.here'

      await expect(authService.verifyAccessToken(invalidToken))
        .rejects
        .toThrow(AppError)
    })
  })

  describe('密码管理', () => {
    let testUser: any

    beforeEach(async () => {
      testUser = await testUtils.createTestUser({
        password: '$2a$12$hashedpassword'
      })
    })

    it('应该能修改密码', async () => {
      // Mock bcrypt 函数
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true)
      jest.spyOn(require('bcryptjs'), 'hash').mockResolvedValue('$2a$12$newhashedpassword')

      await expect(authService.changePassword(
        testUser.id,
        'oldPassword',
        'NewPassword123'
      )).resolves.not.toThrow()
    })

    it('错误的旧密码应该抛出错误', async () => {
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(false)

      await expect(authService.changePassword(
        testUser.id,
        'wrongOldPassword',
        'NewPassword123'
      )).rejects.toThrow(AppError)
    })

    it('不存在的用户应该抛出错误', async () => {
      await expect(authService.changePassword(
        'nonexistent-user-id',
        'oldPassword',
        'NewPassword123'
      )).rejects.toThrow(AppError)
    })
  })

  describe('用户信息管理', () => {
    let testUser: any

    beforeEach(async () => {
      testUser = await testUtils.createTestUser()
    })

    it('应该能获取用户信息', async () => {
      const profile = await authService.getUserProfile(testUser.id)

      expect(profile.id).toBe(testUser.id)
      expect(profile.email).toBe(testUser.email)
      expect(profile.name).toBe(testUser.name)
      expect(profile).not.toHaveProperty('password')
    })

    it('应该能更新用户信息', async () => {
      const updateData = {
        name: '更新后的名字',
        avatar: 'https://example.com/new-avatar.jpg'
      }

      const updatedProfile = await authService.updateUserProfile(testUser.id, updateData)

      expect(updatedProfile.name).toBe(updateData.name)
      expect(updatedProfile.avatar).toBe(updateData.avatar)
      expect(updatedProfile.email).toBe(testUser.email) // 邮箱不应改变
    })

    it('不存在的用户应该抛出错误', async () => {
      await expect(authService.getUserProfile('nonexistent-user-id'))
        .rejects
        .toThrow(AppError)
    })
  })
})

// 清理 mock
afterEach(() => {
  jest.restoreAllMocks()
})
