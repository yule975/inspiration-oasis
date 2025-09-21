#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import { performance } from 'perf_hooks'

// 加载环境变量
dotenv.config()

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

interface TestResult {
  test: string
  success: boolean
  duration: number
  error?: string
  data?: any
}

class DatabaseTester {
  private results: TestResult[] = []

  private async runTest(
    testName: string,
    testFunction: () => Promise<any>
  ): Promise<TestResult> {
    console.log(`🧪 执行测试: ${testName}`)
    const start = performance.now()
    
    try {
      const data = await testFunction()
      const duration = performance.now() - start
      
      const result: TestResult = {
        test: testName,
        success: true,
        duration: Math.round(duration * 100) / 100,
        data
      }
      
      console.log(`✅ ${testName} - ${result.duration}ms`)
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

  async testConnection() {
    await this.runTest('数据库连接测试', async () => {
      await prisma.$connect()
      return { status: '连接成功' }
    })
  }

  async testBasicQuery() {
    await this.runTest('基础查询测试', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as test`
      return result
    })
  }

  async testDatabaseInfo() {
    await this.runTest('数据库信息查询', async () => {
      const result = await prisma.$queryRaw`
        SELECT 
          version() as version,
          current_database() as database_name,
          current_user as current_user,
          inet_server_addr() as server_address,
          inet_server_port() as server_port
      ` as any[]
      
      return result[0]
    })
  }

  async testTableExists() {
    await this.runTest('数据表检查', async () => {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      ` as any[]
      
      const expectedTables = [
        'users', 'ideas', 'assets', 'comments', 'likes', 
        'tags', 'attachments', 'ai_enhancements', 'ai_briefings', 
        'ai_briefing_news', 'ai_briefing_news_tags'
      ]
      
      const existingTables = tables.map(t => t.table_name)
      const missingTables = expectedTables.filter(t => !existingTables.includes(t))
      
      return {
        existingTables,
        missingTables,
        tablesExist: missingTables.length === 0
      }
    })
  }

  async testCRUDOperations() {
    await this.runTest('CRUD操作测试', async () => {
      // 创建测试用户
      const testUser = await prisma.user.create({
        data: {
          name: '数据库测试用户',
          email: `test-${Date.now()}@example.com`,
          password: '$2a$12$hashedpassword',
          role: 'user'
        }
      })

      // 创建测试灵感
      const testIdea = await prisma.idea.create({
        data: {
          content: '这是一个数据库连接测试灵感',
          tags: ['测试', 'Supabase'],
          authorId: testUser.id
        }
      })

      // 查询测试
      const ideas = await prisma.idea.findMany({
        where: { authorId: testUser.id },
        include: { author: true }
      })

      // 更新测试
      const updatedIdea = await prisma.idea.update({
        where: { id: testIdea.id },
        data: { likesCount: 1 }
      })

      // 删除测试数据
      await prisma.idea.delete({ where: { id: testIdea.id } })
      await prisma.user.delete({ where: { id: testUser.id } })

      return {
        userCreated: !!testUser.id,
        ideaCreated: !!testIdea.id,
        ideaQueried: ideas.length > 0,
        ideaUpdated: updatedIdea.likesCount === 1,
        cleanupCompleted: true
      }
    })
  }

  async testPerformance() {
    await this.runTest('性能基准测试', async () => {
      const operations = []

      // 批量插入测试
      const start1 = performance.now()
      const users = await Promise.all([
        prisma.user.create({
          data: {
            name: '性能测试用户1',
            email: `perf1-${Date.now()}@example.com`,
            password: '$2a$12$hashedpassword'
          }
        }),
        prisma.user.create({
          data: {
            name: '性能测试用户2', 
            email: `perf2-${Date.now()}@example.com`,
            password: '$2a$12$hashedpassword'
          }
        })
      ])
      const insertTime = performance.now() - start1

      // 批量查询测试
      const start2 = performance.now()
      const queriedUsers = await prisma.user.findMany({
        where: {
          id: { in: users.map(u => u.id) }
        }
      })
      const queryTime = performance.now() - start2

      // 清理测试数据
      await prisma.user.deleteMany({
        where: {
          id: { in: users.map(u => u.id) }
        }
      })

      return {
        insertTime: Math.round(insertTime * 100) / 100,
        queryTime: Math.round(queryTime * 100) / 100,
        usersCreated: users.length,
        usersQueried: queriedUsers.length
      }
    })
  }

  async runAllTests() {
    console.log('🚀 开始Supabase数据库连接测试...\n')

    await this.testConnection()
    await this.testBasicQuery()
    await this.testDatabaseInfo()
    await this.testTableExists()
    await this.testCRUDOperations()
    await this.testPerformance()

    await prisma.$disconnect()

    // 生成测试报告
    this.generateReport()
  }

  private generateReport() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 数据库测试报告')
    console.log('='.repeat(60))

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
      const testName = result.test.padEnd(20)
      
      console.log(`   ${status} ${testName} ${duration}`)
      
      if (!result.success && result.error) {
        console.log(`      错误: ${result.error}`)
      }
      
      if (result.success && result.data) {
        if (result.test === '数据库信息查询') {
          console.log(`      数据库: ${result.data.database_name}`)
          console.log(`      用户: ${result.data.current_user}`)
          console.log(`      地址: ${result.data.server_address}:${result.data.server_port}`)
        } else if (result.test === '数据表检查') {
          console.log(`      已存在表: ${result.data.existingTables.length}个`)
          if (result.data.missingTables.length > 0) {
            console.log(`      缺失表: ${result.data.missingTables.join(', ')}`)
          }
        } else if (result.test === '性能基准测试') {
          console.log(`      插入性能: ${result.data.insertTime}ms`)
          console.log(`      查询性能: ${result.data.queryTime}ms`)
        }
      }
    })

    console.log('\n💡 建议:')
    
    if (successCount === totalCount) {
      console.log('   🎉 所有测试通过！Supabase数据库配置正确。')
      console.log('   🚀 现在可以启动应用进行功能测试了。')
    } else {
      console.log('   ⚠️  有测试失败，请检查配置和网络连接。')
      console.log('   📖 请参考 Supabase配置指南.md 进行配置。')
    }

    const avgTime = totalTime / totalCount
    if (avgTime > 200) {
      console.log('   🐌 响应时间较慢，可能是网络延迟导致。')
    } else if (avgTime < 50) {
      console.log('   ⚡ 数据库响应速度很好！')
    }

    console.log('\n' + '='.repeat(60))
  }
}

// 执行测试
async function main() {
  const tester = new DatabaseTester()
  await tester.runAllTests()
}

if (require.main === module) {
  main().catch(console.error)
}

export { DatabaseTester }
