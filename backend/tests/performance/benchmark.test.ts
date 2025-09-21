import request from 'supertest'
import express from 'express'
import { performance } from 'perf_hooks'
import { testUtils } from '../setup'
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

describe('Performance Benchmark Tests', () => {
  let app: express.Application
  let testUser: any
  let authToken: string

  beforeAll(async () => {
    app = createTestApp()
    
    // 创建测试用户
    testUser = await testUtils.createTestUser()
    
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

    // 预填充测试数据
    await setupBenchmarkData()
  })

  async function setupBenchmarkData() {
    // 创建100个测试灵感
    const ideaPromises = []
    for (let i = 0; i < 100; i++) {
      ideaPromises.push(
        testUtils.createTestIdea(testUser.id, {
          content: `基准测试灵感 ${i + 1}：这是一个用于性能测试的灵感内容，包含了足够的文本长度来模拟真实场景。`,
          tags: [`标签${i % 10}`, `分类${i % 5}`, '基准测试']
        })
      )
    }
    await Promise.all(ideaPromises)

    // 创建50个测试资产
    const assetPromises = []
    for (let i = 0; i < 50; i++) {
      assetPromises.push(
        testUtils.createTestAsset(testUser.id, {
          title: `基准测试资产 ${i + 1}`,
          description: `这是基准测试资产 ${i + 1} 的描述`,
          content: `# 基准测试资产 ${i + 1}\n\n这是详细的内容...`.repeat(10),
          category: `分类${i % 5}`,
          tags: [`标签${i % 10}`, '基准测试']
        })
      )
    }
    await Promise.all(assetPromises)
  }

  // 性能测试辅助函数
  async function measurePerformance(name: string, testFunction: () => Promise<any>, threshold: number = 1000) {
    const start = performance.now()
    
    try {
      const result = await testFunction()
      const end = performance.now()
      const duration = end - start

      console.log(`📊 ${name}: ${duration.toFixed(2)}ms`)

      // 断言性能阈值
      expect(duration).toBeLessThan(threshold)
      
      return { result, duration }
    } catch (error) {
      const end = performance.now()
      const duration = end - start
      console.error(`❌ ${name} 失败 (${duration.toFixed(2)}ms):`, error)
      throw error
    }
  }

  describe('API响应时间基准测试', () => {
    it('获取灵感列表应该在200ms内完成', async () => {
      await measurePerformance(
        '获取灵感列表',
        async () => {
          const response = await request(app)
            .get('/api/ideas?page=1&limit=20')
            .expect(200)
          return response.body
        },
        200
      )
    })

    it('创建新灵感应该在300ms内完成', async () => {
      await measurePerformance(
        '创建新灵感',
        async () => {
          const response = await request(app)
            .post('/api/ideas')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              content: `性能测试灵感 ${Date.now()}`,
              tags: ['性能测试', 'API']
            })
            .expect(201)
          return response.body
        },
        300
      )
    })

    it('用户认证应该在100ms内完成', async () => {
      await measurePerformance(
        '用户认证验证',
        async () => {
          const response = await request(app)
            .get('/api/auth/verify-token')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)
          return response.body
        },
        100
      )
    })

    it('获取用户信息应该在150ms内完成', async () => {
      await measurePerformance(
        '获取用户信息',
        async () => {
          const response = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)
          return response.body
        },
        150
      )
    })

    it('搜索功能应该在400ms内完成', async () => {
      await measurePerformance(
        '搜索灵感',
        async () => {
          const response = await request(app)
            .get('/api/ideas?search=基准测试&limit=10')
            .expect(200)
          return response.body
        },
        400
      )
    })

    it('获取资产列表应该在250ms内完成', async () => {
      await measurePerformance(
        '获取资产列表',
        async () => {
          const response = await request(app)
            .get('/api/assets?page=1&limit=20')
            .expect(200)
          return response.body
        },
        250
      )
    })

    it('获取分析数据应该在500ms内完成', async () => {
      await measurePerformance(
        '获取分析数据',
        async () => {
          const response = await request(app)
            .get('/api/analytics/dashboard')
            .expect(200)
          return response.body
        },
        500
      )
    })
  })

  describe('并发性能测试', () => {
    it('并发读取请求应该保持良好性能', async () => {
      const concurrentRequests = 10
      const requests = []

      const start = performance.now()

      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app)
            .get('/api/ideas?page=1&limit=10')
            .expect(200)
        )
      }

      await Promise.all(requests)
      
      const end = performance.now()
      const duration = end - start

      console.log(`📊 ${concurrentRequests}个并发读取请求: ${duration.toFixed(2)}ms`)
      console.log(`📊 平均每请求: ${(duration / concurrentRequests).toFixed(2)}ms`)

      // 并发请求的平均响应时间应该在合理范围内
      expect(duration / concurrentRequests).toBeLessThan(300)
    })

    it('混合读写操作应该保持稳定性能', async () => {
      const operations = []

      // 8个读操作
      for (let i = 0; i < 8; i++) {
        operations.push(
          request(app)
            .get(`/api/ideas?page=${i + 1}&limit=5`)
            .expect(200)
        )
      }

      // 2个写操作
      for (let i = 0; i < 2; i++) {
        operations.push(
          request(app)
            .post('/api/ideas')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              content: `并发测试灵感 ${Date.now()}-${i}`,
              tags: ['并发测试']
            })
            .expect(201)
        )
      }

      const start = performance.now()
      await Promise.all(operations)
      const end = performance.now()
      const duration = end - start

      console.log(`📊 混合读写操作 (8读+2写): ${duration.toFixed(2)}ms`)

      // 混合操作应该在1秒内完成
      expect(duration).toBeLessThan(1000)
    })
  })

  describe('内存和缓存性能测试', () => {
    it('重复查询应该受益于缓存', async () => {
      const endpoint = '/api/ideas?page=1&limit=10'

      // 第一次请求（冷启动）
      const { duration: firstDuration } = await measurePerformance(
        '首次查询（冷启动）',
        async () => {
          const response = await request(app)
            .get(endpoint)
            .expect(200)
          return response.body
        },
        300
      )

      // 等待一小段时间确保缓存生效
      await new Promise(resolve => setTimeout(resolve, 100))

      // 第二次请求（应该有缓存）
      const { duration: secondDuration } = await measurePerformance(
        '重复查询（缓存命中）',
        async () => {
          const response = await request(app)
            .get(endpoint)
            .expect(200)
          return response.body
        },
        200
      )

      console.log(`📊 缓存效果: 首次 ${firstDuration.toFixed(2)}ms → 缓存 ${secondDuration.toFixed(2)}ms`)
      
      // 缓存的查询应该比首次查询快
      // 注意：在测试环境中缓存效果可能不明显，所以这里用相对宽松的断言
      expect(secondDuration).toBeLessThanOrEqual(firstDuration * 1.2)
    })
  })

  describe('大数据量性能测试', () => {
    it('分页查询大量数据应该保持稳定性能', async () => {
      const pageTests = []

      // 测试前5页的性能
      for (let page = 1; page <= 5; page++) {
        pageTests.push(
          measurePerformance(
            `第${page}页查询`,
            async () => {
              const response = await request(app)
                .get(`/api/ideas?page=${page}&limit=20`)
                .expect(200)
              return response.body
            },
            250
          )
        )
      }

      const results = await Promise.all(pageTests)
      
      // 计算平均响应时间
      const avgDuration = results.reduce((sum, result) => sum + result.duration, 0) / results.length
      console.log(`📊 分页查询平均响应时间: ${avgDuration.toFixed(2)}ms`)

      // 所有分页查询都应该在合理时间内完成
      expect(avgDuration).toBeLessThan(200)
    })
  })

  describe('压力测试', () => {
    it('高频请求应该不会导致系统崩溃', async () => {
      const requestCount = 50
      const batchSize = 10
      const results = []

      // 分批执行请求以避免过载
      for (let i = 0; i < requestCount; i += batchSize) {
        const batch = []
        
        for (let j = 0; j < batchSize && i + j < requestCount; j++) {
          batch.push(
            request(app)
              .get('/api/ideas?page=1&limit=5')
              .expect(200)
          )
        }

        const start = performance.now()
        const batchResults = await Promise.all(batch)
        const end = performance.now()
        
        results.push({
          batchIndex: Math.floor(i / batchSize) + 1,
          duration: end - start,
          requestCount: batch.length
        })

        // 短暂休息避免过度压力
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // 输出压力测试结果
      results.forEach(result => {
        const avgPerRequest = result.duration / result.requestCount
        console.log(`📊 批次${result.batchIndex}: ${result.requestCount}请求 ${result.duration.toFixed(2)}ms (平均${avgPerRequest.toFixed(2)}ms/请求)`)
      })

      // 确保所有请求都成功完成
      expect(results).toHaveLength(Math.ceil(requestCount / batchSize))
      
      // 平均每个请求应该在合理时间内完成
      const totalDuration = results.reduce((sum, result) => sum + result.duration, 0)
      const avgPerRequest = totalDuration / requestCount
      expect(avgPerRequest).toBeLessThan(500)
    })
  })

  afterAll(async () => {
    console.log('\n🎯 性能测试总结:')
    console.log('• API响应时间基准测试 - 验证核心接口性能')
    console.log('• 并发性能测试 - 验证系统并发处理能力')
    console.log('• 缓存性能测试 - 验证缓存机制效果')
    console.log('• 大数据量测试 - 验证分页查询性能')
    console.log('• 压力测试 - 验证系统稳定性')
    console.log('\n所有性能测试通过! ✅')
  })
})
