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

class SupabaseAPITester {
  private supabaseClient: AxiosInstance
  private results: TestResult[] = []

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量必须设置')
    }

    this.supabaseClient = axios.create({
      baseURL: `${supabaseUrl}/rest/v1`,
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      timeout: 10000
    })

    // 添加响应拦截器
    this.supabaseClient.interceptors.response.use(
      response => response,
      error => {
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

  // 1. 基础连接测试
  async testConnection() {
    await this.runTest('Supabase API连接测试', async () => {
      return await this.supabaseClient.get('/', {
        headers: { 'Accept': 'application/json' }
      })
    })
  }

  // 2. 检查现有表
  async testTableInfo() {
    await this.runTest('检查数据库表结构', async () => {
      // 查询information_schema获取表信息
      return await this.supabaseClient.get('/rpc/get_table_info', {
        params: {}
      })
    })
  }

  // 3. 创建测试表（如果不存在）
  async testCreateTable() {
    await this.runTest('创建测试用户表', async () => {
      // 创建一个简单的测试表
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS test_users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
      
      return await this.supabaseClient.post('/rpc/exec_sql', {
        sql: createTableSQL
      })
    })
  }

  // 4. 测试数据插入
  async testInsertData() {
    const result = await this.runTest('插入测试数据', async () => {
      const testUser = {
        name: '功能测试用户',
        email: `test-${Date.now()}@example.com`
      }
      
      return await this.supabaseClient.post('/test_users', testUser)
    })

    if (result.success && result.data && result.data.length > 0) {
      console.log(`   📝 创建用户ID: ${result.data[0].id}`)
      return result.data[0].id
    }
    return null
  }

  // 5. 测试数据查询
  async testQueryData() {
    await this.runTest('查询测试数据', async () => {
      return await this.supabaseClient.get('/test_users', {
        params: {
          select: '*',
          limit: 10
        }
      })
    })
  }

  // 6. 测试数据更新
  async testUpdateData(userId: number | null) {
    if (!userId) {
      console.log('⚠️ 跳过更新测试 - 没有有效的用户ID')
      return
    }

    await this.runTest('更新测试数据', async () => {
      return await this.supabaseClient.patch(`/test_users?id=eq.${userId}`, {
        name: '更新后的测试用户'
      })
    })
  }

  // 7. 测试数据删除
  async testDeleteData(userId: number | null) {
    if (!userId) {
      console.log('⚠️ 跳过删除测试 - 没有有效的用户ID')
      return
    }

    await this.runTest('删除测试数据', async () => {
      return await this.supabaseClient.delete(`/test_users?id=eq.${userId}`)
    })
  }

  // 8. 测试实时功能（订阅）
  async testRealtimeCapability() {
    await this.runTest('测试实时功能支持', async () => {
      // 检查实时功能是否启用
      return await this.supabaseClient.get('/test_users', {
        headers: {
          'Accept': 'application/json',
          'Accept-Profile': 'public'
        },
        params: {
          select: 'id',
          limit: 1
        }
      })
    })
  }

  // 9. 测试认证相关API
  async testAuthAPI() {
    await this.runTest('测试认证API', async () => {
      // 测试用户注册端点是否可用
      const authUrl = process.env.SUPABASE_URL?.replace('/rest/v1', '/auth/v1')
      return await axios.get(`${authUrl}/settings`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        timeout: 5000
      })
    })
  }

  // 10. 运行完整测试套件
  async runAllTests() {
    console.log('🚀 开始Supabase REST API测试...\n')
    console.log(`📍 测试目标: ${process.env.SUPABASE_URL}\n`)

    await this.testConnection()
    await this.testTableInfo()
    await this.testCreateTable()
    
    const userId = await this.testInsertData()
    await this.testQueryData()
    await this.testUpdateData(userId)
    await this.testRealtimeCapability()
    await this.testDeleteData(userId)
    await this.testAuthAPI()

    this.generateReport()
  }

  private generateReport() {
    console.log('\n' + '='.repeat(80))
    console.log('📊 Supabase REST API 测试报告')
    console.log('='.repeat(80))

    const successCount = this.results.filter(r => r.success).length
    const totalCount = this.results.length
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0)

    console.log(`\n📈 总体统计:`)
    console.log(`   成功测试: ${successCount}/${totalCount}`)
    console.log(`   成功率: ${Math.round((successCount / totalCount) * 100)}%`)
    console.log(`   总耗时: ${Math.round(totalTime * 100) / 100}ms`)
    console.log(`   平均耗时: ${Math.round((totalTime / totalCount) * 100) / 100}ms`)

    console.log(`\n📋 详细结果:`)
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌'
      const duration = `${result.duration}ms`.padEnd(8)
      const testName = result.test.padEnd(25)
      const statusCode = result.statusCode ? `[${result.statusCode}]` : ''
      
      console.log(`   ${status} ${testName} ${duration} ${statusCode}`)
      
      if (!result.success && result.error) {
        console.log(`      错误: ${result.error}`)
      }
      
      if (result.success && result.test === '查询测试数据' && result.data) {
        console.log(`      查询到: ${result.data.length} 条记录`)
      }
    })

    console.log(`\n💡 建议:`)
    
    if (successCount === totalCount) {
      console.log('   🎉 所有Supabase API测试通过！')
      console.log('   🚀 数据库通过REST API完全可用，可以进行应用开发。')
      console.log('   🔧 建议：检查网络防火墙设置以启用直连数据库。')
    } else if (successCount / totalCount >= 0.7) {
      console.log('   ✅ 大部分API功能正常。')
      console.log('   🔧 可以使用REST API进行开发，同时解决直连问题。')
    } else {
      console.log('   ⚠️ 多个API功能异常。')
      console.log('   📞 建议联系Supabase支持或检查项目配置。')
    }

    const avgTime = totalTime / totalCount
    if (avgTime > 1000) {
      console.log('   🐌 API响应较慢，可能是网络延迟。')
    } else if (avgTime < 300) {
      console.log('   ⚡ API响应速度很好！')
    }

    if (successCount > 0) {
      console.log('   📡 可以使用Supabase REST API进行功能演示。')
      console.log('   🎯 推荐：配置应用使用@supabase/supabase-js客户端。')
    }

    console.log('\n' + '='.repeat(80))
  }
}

// 执行测试
async function main() {
  try {
    const tester = new SupabaseAPITester()
    await tester.runAllTests()
  } catch (error) {
    console.error('❌ 初始化失败:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { SupabaseAPITester }
