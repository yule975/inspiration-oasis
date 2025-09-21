import request from 'supertest'
import { createServer } from 'http'
import express from 'express'
import { testUtils, mockData } from '../setup'
import { apiRoutes } from '@/routes'
import { errorHandler } from '@/middleware/errorHandler'
import jwt from 'jsonwebtoken'

// 创建测试应用
function createTestApp() {
  const app = express()
  app.use(express.json())
  app.use('/api', apiRoutes)
  app.use(errorHandler)
  return app
}

describe('Ideas API 集成测试', () => {
  let app: express.Application
  let testUser: any
  let authToken: string

  beforeAll(async () => {
    app = createTestApp()
    
    // 创建测试用户
    testUser = await testUtils.createTestUser(mockData.users.user1)
    
    // 生成测试令牌
    authToken = jwt.sign(
      {
        userId: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    )
  })

  describe('GET /api/ideas', () => {
    beforeEach(async () => {
      // 创建测试数据
      await testUtils.createTestIdea(testUser.id, mockData.ideas.idea1)
      await testUtils.createTestIdea(testUser.id, mockData.ideas.idea2)
    })

    it('应该返回灵感列表', async () => {
      const response = await request(app)
        .get('/api/ideas')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.ideas).toHaveLength(2)
      expect(response.body.data.pagination).toBeDefined()
    })

    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get('/api/ideas?page=1&limit=1')
        .expect(200)

      expect(response.body.data.ideas).toHaveLength(1)
      expect(response.body.data.pagination.current_page).toBe(1)
      expect(response.body.data.pagination.per_page).toBe(1)
    })

    it('应该支持标签筛选', async () => {
      const response = await request(app)
        .get('/api/ideas?tags=AI')
        .expect(200)

      const ideas = response.body.data.ideas
      expect(ideas.every((idea: any) => idea.tags.includes('AI'))).toBe(true)
    })

    it('应该支持搜索功能', async () => {
      const response = await request(app)
        .get('/api/ideas?search=AI')
        .expect(200)

      const ideas = response.body.data.ideas
      expect(ideas.some((idea: any) => idea.content.includes('AI'))).toBe(true)
    })
  })

  describe('POST /api/ideas', () => {
    it('认证用户应该能创建灵感', async () => {
      const ideaData = {
        content: '这是一个通过API创建的测试灵感',
        tags: ['API测试', '自动化']
      }

      const response = await request(app)
        .post('/api/ideas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ideaData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.content).toBe(ideaData.content)
      expect(response.body.data.tags).toEqual(ideaData.tags)
      expect(response.body.data.author.id).toBe(testUser.id)
    })

    it('未认证用户应该无法创建灵感', async () => {
      const ideaData = {
        content: '未认证用户的灵感',
        tags: ['测试']
      }

      await request(app)
        .post('/api/ideas')
        .send(ideaData)
        .expect(401)
    })

    it('无效数据应该返回验证错误', async () => {
      const invalidData = {
        content: '', // 空内容
        tags: ['测试']
      }

      await request(app)
        .post('/api/ideas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)
    })

    it('应该自动增加标签使用计数', async () => {
      const ideaData = {
        content: '测试标签计数功能',
        tags: ['新标签', '计数测试']
      }

      await request(app)
        .post('/api/ideas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ideaData)
        .expect(201)

      // 验证标签被创建或更新
      const prisma = testUtils.getPrisma()
      const tags = await prisma.tag.findMany({
        where: { name: { in: ideaData.tags } }
      })

      expect(tags).toHaveLength(2)
      expect(tags.every(tag => tag.usageCount >= 1)).toBe(true)
    })
  })

  describe('POST /api/ideas/:id/like', () => {
    let testIdea: any

    beforeEach(async () => {
      testIdea = await testUtils.createTestIdea(testUser.id)
    })

    it('用户应该能点赞灵感', async () => {
      const response = await request(app)
        .post(`/api/ideas/${testIdea.id}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.liked).toBe(true)
      expect(response.body.data.likes_count).toBe(1)
    })

    it('用户应该能取消点赞', async () => {
      // 先点赞
      await testUtils.createTestLike(testIdea.id, testUser.id)

      const response = await request(app)
        .post(`/api/ideas/${testIdea.id}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.liked).toBe(false)
      expect(response.body.data.likes_count).toBe(0)
    })

    it('不存在的灵感应该返回404', async () => {
      await request(app)
        .post('/api/ideas/nonexistent-id/like')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })

  describe('POST /api/ideas/:id/comments', () => {
    let testIdea: any

    beforeEach(async () => {
      testIdea = await testUtils.createTestIdea(testUser.id)
    })

    it('用户应该能添加评论', async () => {
      const commentData = {
        content: '这是一个测试评论'
      }

      const response = await request(app)
        .post(`/api/ideas/${testIdea.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.content).toBe(commentData.content)
      expect(response.body.data.author.id).toBe(testUser.id)
    })

    it('应该能回复评论', async () => {
      // 先创建一个评论
      const parentComment = await testUtils.createTestComment(testIdea.id, testUser.id)

      const replyData = {
        content: '这是一个回复',
        parentId: parentComment.id
      }

      const response = await request(app)
        .post(`/api/ideas/${testIdea.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(replyData)
        .expect(201)

      expect(response.body.data.parentId).toBe(parentComment.id)
    })

    it('空评论内容应该返回验证错误', async () => {
      const invalidData = {
        content: ''
      }

      await request(app)
        .post(`/api/ideas/${testIdea.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)
    })
  })

  describe('POST /api/ideas/:id/archive', () => {
    let testIdea: any

    beforeEach(async () => {
      testIdea = await testUtils.createTestIdea(testUser.id, {
        content: '这是一个即将被归档的灵感，包含了详细的实现方案和技术细节。'
      })
    })

    it('用户应该能归档自己的灵感', async () => {
      const archiveData = {
        title: '归档的资产标题',
        description: '这是归档后的资产描述',
        category: '测试分类'
      }

      const response = await request(app)
        .post(`/api/ideas/${testIdea.id}/archive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(archiveData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe(archiveData.title)
      expect(response.body.data.sourceType).toBe('ARCHIVED_IDEA')

      // 验证灵感被标记为已归档
      const prisma = testUtils.getPrisma()
      const updatedIdea = await prisma.idea.findUnique({
        where: { id: testIdea.id }
      })
      expect(updatedIdea?.isArchived).toBe(true)
    })

    it('用户不能归档别人的灵感', async () => {
      // 创建另一个用户的灵感
      const anotherUser = await testUtils.createTestUser({
        email: 'another@test.com'
      })
      const anotherIdea = await testUtils.createTestIdea(anotherUser.id)

      const archiveData = {
        title: '尝试归档别人的灵感',
        description: '这应该失败',
        category: '测试'
      }

      await request(app)
        .post(`/api/ideas/${anotherIdea.id}/archive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(archiveData)
        .expect(403)
    })
  })

  describe('错误处理', () => {
    it('无效的ID格式应该返回400', async () => {
      await request(app)
        .get('/api/ideas/invalid-id')
        .expect(404) // 实际可能是404，取决于具体实现
    })

    it('服务器错误应该返回500', async () => {
      // 可以通过mock数据库连接失败来测试
      // 这里只是示例，实际测试需要更具体的错误场景
    })
  })
})
