import request from 'supertest'
import express from 'express'
import { testUtils, mockData } from '../setup'
import { apiRoutes } from '@/routes'
import { errorHandler } from '@/middleware/errorHandler'
import bcrypt from 'bcryptjs'

// 创建测试应用
function createTestApp() {
  const app = express()
  app.use(express.json())
  app.use('/api', apiRoutes)
  app.use(errorHandler)
  return app
}

describe('Auth API 集成测试', () => {
  let app: express.Application

  beforeAll(async () => {
    app = createTestApp()
  })

  describe('POST /api/auth/register', () => {
    it('应该成功注册新用户', async () => {
      const registerData = {
        email: 'register-test@example.com',
        password: 'TestPass123',
        name: '注册测试用户',
        avatar: 'https://example.com/avatar.jpg'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(registerData.email)
      expect(response.body.data.user.name).toBe(registerData.name)
      expect(response.body.data.user.avatar).toBe(registerData.avatar)
      expect(response.body.data.user.role).toBe('user')
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
      expect(response.body.data.expiresIn).toBeDefined()
      expect(response.body.data.user).not.toHaveProperty('password')
    })

    it('重复邮箱应该返回400错误', async () => {
      const email = 'duplicate@example.com'
      
      // 先创建一个用户
      await testUtils.createTestUser({ email })

      const registerData = {
        email,
        password: 'TestPass123',
        name: '重复邮箱用户'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('无效邮箱格式应该返回400错误', async () => {
      const registerData = {
        email: 'invalid-email',
        password: 'TestPass123',
        name: '无效邮箱用户'
      }

      await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400)
    })

    it('弱密码应该返回400错误', async () => {
      const registerData = {
        email: 'weak-password@example.com',
        password: '123', // 弱密码
        name: '弱密码用户'
      }

      await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400)
    })

    it('缺少必填字段应该返回400错误', async () => {
      const incompleteData = {
        email: 'incomplete@example.com'
        // 缺少password和name
      }

      await request(app)
        .post('/api/auth/register')
        .send(incompleteData)
        .expect(400)
    })
  })

  describe('POST /api/auth/login', () => {
    let testUser: any

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('TestPass123', 12)
      testUser = await testUtils.createTestUser({
        email: 'login-test@example.com',
        password: hashedPassword,
        name: '登录测试用户'
      })
    })

    it('正确凭据应该成功登录', async () => {
      const loginData = {
        email: 'login-test@example.com',
        password: 'TestPass123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.id).toBe(testUser.id)
      expect(response.body.data.user.email).toBe(testUser.email)
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
      expect(response.body.data.user).not.toHaveProperty('password')
    })

    it('错误密码应该返回401错误', async () => {
      const loginData = {
        email: 'login-test@example.com',
        password: 'WrongPassword123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('不存在的邮箱应该返回401错误', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPass123'
      }

      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)
    })

    it('禁用的用户应该无法登录', async () => {
      const hashedPassword = await bcrypt.hash('TestPass123', 12)
      await testUtils.createTestUser({
        email: 'disabled@example.com',
        password: hashedPassword,
        isActive: false
      })

      const loginData = {
        email: 'disabled@example.com',
        password: 'TestPass123'
      }

      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)
    })

    it('无效邮箱格式应该返回400错误', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'TestPass123'
      }

      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400)
    })
  })

  describe('认证保护的路由', () => {
    let testUser: any
    let authToken: string

    beforeEach(async () => {
      // 注册并登录获取token
      const registerData = {
        email: 'auth-test@example.com',
        password: 'TestPass123',
        name: '认证测试用户'
      }

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(registerData)

      testUser = registerResponse.body.data.user
      authToken = registerResponse.body.data.token
    })

    describe('GET /api/auth/profile', () => {
      it('有效token应该返回用户信息', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.id).toBe(testUser.id)
        expect(response.body.data.email).toBe(testUser.email)
        expect(response.body.data).not.toHaveProperty('password')
      })

      it('无token应该返回401错误', async () => {
        await request(app)
          .get('/api/auth/profile')
          .expect(401)
      })

      it('无效token应该返回401错误', async () => {
        await request(app)
          .get('/api/auth/profile')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401)
      })
    })

    describe('PUT /api/auth/profile', () => {
      it('应该能更新用户信息', async () => {
        const updateData = {
          name: '更新后的名字',
          avatar: 'https://example.com/new-avatar.jpg'
        }

        const response = await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.name).toBe(updateData.name)
        expect(response.body.data.avatar).toBe(updateData.avatar)
        expect(response.body.data.email).toBe(testUser.email) // 邮箱不应改变
      })

      it('无效数据应该返回400错误', async () => {
        const invalidData = {
          name: '', // 空名称
          avatar: 'invalid-url' // 无效URL
        }

        await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)
          .expect(400)
      })
    })

    describe('POST /api/auth/change-password', () => {
      it('应该能修改密码', async () => {
        const changeData = {
          oldPassword: 'TestPass123',
          newPassword: 'NewTestPass456'
        }

        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${authToken}`)
          .send(changeData)
          .expect(200)

        expect(response.body.success).toBe(true)
      })

      it('错误的旧密码应该返回400错误', async () => {
        const changeData = {
          oldPassword: 'WrongOldPassword',
          newPassword: 'NewTestPass456'
        }

        await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${authToken}`)
          .send(changeData)
          .expect(400)
      })

      it('弱新密码应该返回400错误', async () => {
        const changeData = {
          oldPassword: 'TestPass123',
          newPassword: 'weak' // 弱密码
        }

        await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${authToken}`)
          .send(changeData)
          .expect(400)
      })
    })

    describe('POST /api/auth/logout', () => {
      it('应该能成功登出', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)

        expect(response.body.success).toBe(true)
      })
    })

    describe('GET /api/auth/verify-token', () => {
      it('有效token应该返回验证成功', async () => {
        const response = await request(app)
          .get('/api/auth/verify-token')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.valid).toBe(true)
        expect(response.body.data.user.id).toBe(testUser.id)
      })
    })
  })

  describe('POST /api/auth/refresh-token', () => {
    let refreshToken: string

    beforeEach(async () => {
      const registerData = {
        email: 'refresh-test@example.com',
        password: 'TestPass123',
        name: '刷新测试用户'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)

      refreshToken = response.body.data.refreshToken
    })

    it('有效刷新token应该返回新token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
      expect(response.body.data.user).toBeDefined()
    })

    it('无效刷新token应该返回401错误', async () => {
      await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401)
    })

    it('缺少刷新token应该返回400错误', async () => {
      await request(app)
        .post('/api/auth/refresh-token')
        .send({})
        .expect(400)
    })
  })
})
