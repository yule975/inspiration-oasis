#!/usr/bin/env npx tsx

import axios, { AxiosInstance } from 'axios'
import { performance } from 'perf_hooks'
import dotenv from 'dotenv'

dotenv.config()

interface TestResult {
  test: string
  success: boolean
  duration: number
  statusCode?: number
  error?: string
  data?: any
}

class FunctionalTester {
  private apiClient: AxiosInstance
  private results: TestResult[] = []
  private authToken: string = ''
  private testUserId: string = ''
  private testIdeaId: string = ''
  private testAssetId: string = ''

  constructor() {
    const baseURL = process.env.BASE_URL || 'http://localhost:3001'
    
    this.apiClient = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // 添加响应拦截器记录详细信息
    this.apiClient.interceptors.response.use(
      response => response,
      error => {
        // 不抛出错误，让测试方法处理
        return Promise.resolve(error.response || { 
          status: 0, 
          data: { message: error.message } 
        })
      }
    )
  }

  private async runTest(
    testName: string,
    testFunction: () => Promise<any>
  ): Promise<TestResult> {
    console.log(`🧪 执行测试: ${testName}`)
    const start = performance.now()
    
    try {
      const response = await testFunction()
      const duration = performance.now() - start
      
      const success = response.status >= 200 && response.status < 300
      const result: TestResult = {
        test: testName,
        success,
        duration: Math.round(duration * 100) / 100,
        statusCode: response.status,
        data: response.data
      }
      
      if (success) {
        console.log(`✅ ${testName} - ${result.duration}ms [${response.status}]`)
      } else {
        console.log(`❌ ${testName} - ${result.duration}ms [${response.status}]`)
        result.error = response.data?.message || `HTTP ${response.status}`
      }
      
      this.results.push(result)
      return result
    } catch (error) {
      const duration = performance.now() - start
      
      const result: TestResult = {
        test: testName,
        success: false,
        duration: Math.round(duration * 100) / 100,
        error: error instanceof Error ? error.message : String(error)
      }
      
      console.log(`❌ ${testName} - ${result.duration}ms - ${result.error}`)
      this.results.push(result)
      return result
    }
  }

  // 1. 基础健康检查
  async testHealthCheck() {
    await this.runTest('健康检查', async () => {
      return await this.apiClient.get('/health')
    })
  }

  async testAPIInfo() {
    await this.runTest('API信息查询', async () => {
      return await this.apiClient.get('/api')
    })
  }

  async testSystemStatus() {
    await this.runTest('系统状态检查', async () => {
      return await this.apiClient.get('/api/monitoring/status')
    })
  }

  // 2. 用户认证功能测试
  async testUserRegistration() {
    const result = await this.runTest('用户注册', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPass123',
        name: '功能测试用户',
        avatar: 'https://ui-avatars.com/api/?name=Test+User&background=2F6A53&color=ffffff'
      }
      
      return await this.apiClient.post('/api/auth/register', userData)
    })

    if (result.success && result.data?.data) {
      this.authToken = result.data.data.token
      this.testUserId = result.data.data.user.id
      console.log(`   💾 保存认证令牌: ${this.authToken.substring(0, 20)}...`)
      console.log(`   👤 测试用户ID: ${this.testUserId}`)
    }
  }

  async testUserLogin() {
    await this.runTest('用户登录', async () => {
      const loginData = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPass123'
      }
      
      // 先注册一个用户用于登录测试
      await this.apiClient.post('/api/auth/register', {
        ...loginData,
        name: '登录测试用户'
      })
      
      return await this.apiClient.post('/api/auth/login', loginData)
    })
  }

  async testUserProfile() {
    if (!this.authToken) {
      console.log('⚠️ 跳过用户信息测试 - 没有认证令牌')
      return
    }

    await this.runTest('获取用户信息', async () => {
      return await this.apiClient.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })
    })
  }

  // 3. 灵感墙功能测试
  async testCreateIdea() {
    const result = await this.runTest('创建灵感', async () => {
      const ideaData = {
        content: '这是一个功能测试灵感：开发一个基于AI的智能代码审查工具，能够自动检测代码质量问题、安全漏洞和性能瓶颈。',
        tags: ['AI', '代码审查', '自动化', '功能测试']
      }
      
      const headers = this.authToken 
        ? { Authorization: `Bearer ${this.authToken}` }
        : { 'X-User-ID': 'test-user-id', 'X-User-Name': '测试用户' }
      
      return await this.apiClient.post('/api/ideas', ideaData, { headers })
    })

    if (result.success && result.data?.data) {
      this.testIdeaId = result.data.data.id
      console.log(`   💡 测试灵感ID: ${this.testIdeaId}`)
    }
  }

  async testGetIdeas() {
    await this.runTest('获取灵感列表', async () => {
      return await this.apiClient.get('/api/ideas?page=1&limit=10')
    })
  }

  async testSearchIdeas() {
    await this.runTest('搜索灵感', async () => {
      return await this.apiClient.get('/api/ideas?search=AI&limit=5')
    })
  }

  async testLikeIdea() {
    if (!this.testIdeaId) {
      console.log('⚠️ 跳过点赞测试 - 没有测试灵感ID')
      return
    }

    await this.runTest('点赞灵感', async () => {
      const headers = this.authToken 
        ? { Authorization: `Bearer ${this.authToken}` }
        : { 'X-User-ID': 'test-user-like', 'X-User-Name': '点赞用户' }
      
      return await this.apiClient.post(`/api/ideas/${this.testIdeaId}/like`, {}, { headers })
    })
  }

  async testAddComment() {
    if (!this.testIdeaId) {
      console.log('⚠️ 跳过评论测试 - 没有测试灵感ID')
      return
    }

    await this.runTest('添加评论', async () => {
      const commentData = {
        content: '这个想法很有创意！建议增加机器学习算法来提高准确率。'
      }
      
      const headers = this.authToken 
        ? { Authorization: `Bearer ${this.authToken}` }
        : { 'X-User-ID': 'test-user-comment', 'X-User-Name': '评论用户' }
      
      return await this.apiClient.post(`/api/ideas/${this.testIdeaId}/comments`, commentData, { headers })
    })
  }

  // 4. AI服务功能测试
  async testAIEnhancement() {
    await this.runTest('AI内容增强', async () => {
      const enhanceData = {
        content: '创建一个AI助手',
        type: 'expand',
        context: '产品开发'
      }
      
      const headers = this.authToken 
        ? { Authorization: `Bearer ${this.authToken}` }
        : { 'X-User-ID': 'test-user-ai', 'X-User-Name': 'AI测试用户' }
      
      return await this.apiClient.post('/api/ai/enhance', enhanceData, { headers })
    })
  }

  async testAISummarize() {
    await this.runTest('AI智能总结', async () => {
      const summarizeData = {
        content: '人工智能技术正在快速发展，它在各个行业都有广泛的应用前景。从医疗诊断到自动驾驶，从语音识别到图像处理，AI技术正在改变我们的生活方式。然而，随着AI技术的普及，我们也需要关注数据隐私、算法公平性等问题。',
        summary_type: 'brief'
      }
      
      const headers = this.authToken 
        ? { Authorization: `Bearer ${this.authToken}` }
        : { 'X-User-ID': 'test-user-ai', 'X-User-Name': 'AI测试用户' }
      
      return await this.apiClient.post('/api/ai/summarize', summarizeData, { headers })
    })
  }

  async testAITagSuggestion() {
    await this.runTest('AI标签推荐', async () => {
      const tagData = {
        content: '开发一个基于区块链的去中心化社交媒体平台，保护用户隐私和数据所有权',
        max_tags: 5
      }
      
      const headers = this.authToken 
        ? { Authorization: `Bearer ${this.authToken}` }
        : { 'X-User-ID': 'test-user-ai', 'X-User-Name': 'AI测试用户' }
      
      return await this.apiClient.post('/api/ai/tags/suggest', tagData, { headers })
    })
  }

  // 5. 资产库功能测试
  async testCreateAsset() {
    const result = await this.runTest('创建资产', async () => {
      const assetData = {
        title: 'AI代码审查工具设计文档',
        description: '基于机器学习的智能代码审查工具完整设计方案',
        content: '# AI代码审查工具\n\n## 概述\n这是一个功能测试创建的资产文档...',
        category: '技术方案',
        tags: ['AI', '代码审查', '设计文档', '功能测试']
      }
      
      const headers = this.authToken 
        ? { Authorization: `Bearer ${this.authToken}` }
        : { 'X-User-ID': 'test-user-asset', 'X-User-Name': '资产测试用户' }
      
      return await this.apiClient.post('/api/assets', assetData, { headers })
    })

    if (result.success && result.data?.data) {
      this.testAssetId = result.data.data.id
      console.log(`   📄 测试资产ID: ${this.testAssetId}`)
    }
  }

  async testGetAssets() {
    await this.runTest('获取资产列表', async () => {
      return await this.apiClient.get('/api/assets?page=1&limit=10')
    })
  }

  async testGetAssetCategories() {
    await this.runTest('获取资产分类', async () => {
      return await this.apiClient.get('/api/assets/categories')
    })
  }

  // 6. 数据分析功能测试
  async testAnalyticsDashboard() {
    await this.runTest('获取分析数据', async () => {
      return await this.apiClient.get('/api/analytics/dashboard?period=week')
    })
  }

  async testTrendsData() {
    await this.runTest('获取趋势数据', async () => {
      return await this.apiClient.get('/api/analytics/trends?period=week&type=all')
    })
  }

  // 7. 文件上传测试（模拟）
  async testFileUploadEndpoint() {
    await this.runTest('文件上传端点检查', async () => {
      // 由于我们没有实际文件，这里只测试端点响应
      const headers = this.authToken 
        ? { Authorization: `Bearer ${this.authToken}` }
        : { 'X-User-ID': 'test-user-upload', 'X-User-Name': '上传测试用户' }
      
      // 测试不带文件的请求（应该返回400错误）
      return await this.apiClient.post('/api/upload', {}, { headers })
    })
  }

  // 8. 运行完整测试套件
  async runAllTests() {
    console.log('🚀 开始功能测试套件...\n')
    console.log(`📍 测试目标: ${this.apiClient.defaults.baseURL}\n`)

    // 基础功能测试
    console.log('📋 1. 基础功能测试')
    await this.testHealthCheck()
    await this.testAPIInfo()
    await this.testSystemStatus()

    // 用户认证测试
    console.log('\n🔐 2. 用户认证测试')
    await this.testUserRegistration()
    await this.testUserLogin()
    await this.testUserProfile()

    // 灵感墙功能测试
    console.log('\n💡 3. 灵感墙功能测试')
    await this.testCreateIdea()
    await this.testGetIdeas()
    await this.testSearchIdeas()
    await this.testLikeIdea()
    await this.testAddComment()

    // AI服务测试
    console.log('\n🤖 4. AI服务测试')
    await this.testAIEnhancement()
    await this.testAISummarize()
    await this.testAITagSuggestion()

    // 资产库测试
    console.log('\n📄 5. 资产库测试')
    await this.testCreateAsset()
    await this.testGetAssets()
    await this.testGetAssetCategories()

    // 数据分析测试
    console.log('\n📊 6. 数据分析测试')
    await this.testAnalyticsDashboard()
    await this.testTrendsData()

    // 文件上传测试
    console.log('\n📁 7. 文件上传测试')
    await this.testFileUploadEndpoint()

    // 生成测试报告
    this.generateReport()
  }

  private generateReport() {
    console.log('\n' + '='.repeat(80))
    console.log('📊 功能测试报告')
    console.log('='.repeat(80))

    const successCount = this.results.filter(r => r.success).length
    const totalCount = this.results.length
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0)

    console.log(`\n📈 总体统计:`)
    console.log(`   成功测试: ${successCount}/${totalCount}`)
    console.log(`   成功率: ${Math.round((successCount / totalCount) * 100)}%`)
    console.log(`   总耗时: ${Math.round(totalTime * 100) / 100}ms`)
    console.log(`   平均耗时: ${Math.round((totalTime / totalCount) * 100) / 100}ms`)

    // 按功能模块分类统计
    const moduleStats = {
      '基础功能': this.results.filter(r => ['健康检查', 'API信息查询', '系统状态检查'].includes(r.test)),
      '用户认证': this.results.filter(r => r.test.includes('用户') || r.test.includes('登录') || r.test.includes('注册')),
      '灵感墙': this.results.filter(r => r.test.includes('灵感') || r.test.includes('点赞') || r.test.includes('评论')),
      'AI服务': this.results.filter(r => r.test.includes('AI')),
      '资产库': this.results.filter(r => r.test.includes('资产')),
      '数据分析': this.results.filter(r => r.test.includes('分析') || r.test.includes('趋势')),
      '文件上传': this.results.filter(r => r.test.includes('文件'))
    }

    console.log(`\n📋 模块统计:`)
    Object.entries(moduleStats).forEach(([module, tests]) => {
      const success = tests.filter(t => t.success).length
      const total = tests.length
      const rate = total > 0 ? Math.round((success / total) * 100) : 0
      const status = rate === 100 ? '✅' : rate >= 70 ? '⚠️' : '❌'
      
      console.log(`   ${status} ${module.padEnd(12)} ${success}/${total} (${rate}%)`)
    })

    console.log(`\n🐌 性能分析:`)
    const slowTests = this.results.filter(r => r.duration > 1000).sort((a, b) => b.duration - a.duration)
    if (slowTests.length > 0) {
      console.log(`   慢请求 (>1s): ${slowTests.length}个`)
      slowTests.slice(0, 3).forEach(test => {
        console.log(`     • ${test.test}: ${test.duration}ms`)
      })
    } else {
      console.log(`   ⚡ 所有请求响应良好 (<1s)`)
    }

    const fastTests = this.results.filter(r => r.success && r.duration < 100).length
    console.log(`   快速响应 (<100ms): ${fastTests}个`)

    console.log(`\n❌ 失败分析:`)
    const failedTests = this.results.filter(r => !r.success)
    if (failedTests.length === 0) {
      console.log(`   🎉 没有失败的测试！`)
    } else {
      failedTests.forEach(test => {
        console.log(`   • ${test.test}`)
        console.log(`     错误: ${test.error || `HTTP ${test.statusCode}`}`)
        if (test.statusCode) {
          console.log(`     状态码: ${test.statusCode}`)
        }
      })
    }

    console.log(`\n💡 建议:`)
    
    if (successCount === totalCount) {
      console.log('   🎉 所有功能测试通过！系统运行正常。')
      console.log('   🚀 可以开始正式使用或部署到生产环境。')
    } else if (successCount / totalCount >= 0.8) {
      console.log('   ✅ 大部分功能正常，有少量问题需要修复。')
      console.log('   🔧 建议优先修复失败的核心功能。')
    } else {
      console.log('   ⚠️ 有较多功能异常，建议全面检查配置。')
      console.log('   📖 请参考相关文档进行故障排查。')
    }

    const avgTime = totalTime / totalCount
    if (avgTime > 1000) {
      console.log('   🐌 整体响应较慢，建议检查网络和数据库性能。')
    } else if (avgTime < 200) {
      console.log('   ⚡ 系统响应速度很好！')
    }

    if (this.authToken) {
      console.log('   🔐 JWT认证功能正常工作。')
    } else {
      console.log('   ⚠️ 未能获取认证令牌，可能影响部分功能。')
    }

    console.log('\n' + '='.repeat(80))
  }
}

// 执行功能测试
async function main() {
  const tester = new FunctionalTester()
  await tester.runAllTests()
}

if (require.main === module) {
  main().catch(console.error)
}

export { FunctionalTester }
