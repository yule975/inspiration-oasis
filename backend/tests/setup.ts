import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import dotenv from 'dotenv'

// 加载测试环境变量
dotenv.config({ path: '.env.test' })

// 全局变量声明
declare global {
  var __PRISMA__: PrismaClient
}

// 测试数据库连接
let prisma: PrismaClient

// 测试前设置
beforeAll(async () => {
  // 使用测试数据库
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/inspirations_test'
  
  // 初始化 Prisma
  prisma = new PrismaClient()
  global.__PRISMA__ = prisma
  
  // 确保测试数据库schema最新
  try {
    execSync('npx prisma db push --force-reset', { stdio: 'ignore' })
    console.log('✅ 测试数据库初始化成功')
  } catch (error) {
    console.warn('⚠️ 测试数据库初始化失败，使用现有schema')
  }
})

// 每个测试前清理数据
beforeEach(async () => {
  await cleanDatabase()
})

// 测试后清理
afterAll(async () => {
  await cleanDatabase()
  await prisma.$disconnect()
})

// 清理数据库函数
async function cleanDatabase() {
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`)
      } catch (error) {
        console.log(`无法清理表 ${tablename}:`, error)
      }
    }
  }
}

// 测试工具函数
export const testUtils = {
  // 创建测试用户
  async createTestUser(data: any = {}) {
    return await prisma.user.create({
      data: {
        name: data.name || '测试用户',
        email: data.email || `test${Date.now()}@example.com`,
        password: data.password || '$2a$12$hashedpassword',
        role: data.role || 'user',
        isActive: data.isActive !== undefined ? data.isActive : true,
        ...data
      }
    })
  },

  // 创建测试灵感
  async createTestIdea(authorId: string, data: any = {}) {
    return await prisma.idea.create({
      data: {
        content: data.content || '这是一个测试灵感',
        tags: data.tags || ['测试'],
        authorId,
        likesCount: data.likesCount || 0,
        commentsCount: data.commentsCount || 0,
        isArchived: data.isArchived || false,
        ...data
      }
    })
  },

  // 创建测试资产
  async createTestAsset(authorId: string, data: any = {}) {
    return await prisma.asset.create({
      data: {
        title: data.title || '测试资产',
        description: data.description || '这是一个测试资产',
        content: data.content || '# 测试内容',
        category: data.category || '测试分类',
        tags: data.tags || ['测试'],
        authorId,
        sourceType: data.sourceType || 'MANUAL',
        version: data.version || '1.0.0',
        downloadCount: data.downloadCount || 0,
        ...data
      }
    })
  },

  // 创建测试评论
  async createTestComment(ideaId: string, authorId: string, data: any = {}) {
    return await prisma.comment.create({
      data: {
        content: data.content || '这是一个测试评论',
        ideaId,
        authorId,
        parentId: data.parentId || null,
        ...data
      }
    })
  },

  // 创建测试点赞
  async createTestLike(ideaId: string, userId: string) {
    return await prisma.like.create({
      data: {
        ideaId,
        userId
      }
    })
  },

  // 获取Prisma实例
  getPrisma() {
    return prisma
  }
}

// 导出用于测试的模拟数据
export const mockData = {
  users: {
    user1: {
      name: '张三',
      email: 'zhangsan@test.com',
      password: 'TestPass123',
      role: 'user'
    },
    user2: {
      name: '李四',
      email: 'lisi@test.com',
      password: 'TestPass123',
      role: 'user'
    },
    admin: {
      name: '管理员',
      email: 'admin@test.com',
      password: 'AdminPass123',
      role: 'admin'
    }
  },
  ideas: {
    idea1: {
      content: '创建一个AI驱动的代码审查工具，帮助开发者提高代码质量',
      tags: ['AI', '开发工具', '代码审查']
    },
    idea2: {
      content: '设计一个可视化的数据分析平台，让非技术人员也能轻松分析数据',
      tags: ['数据分析', '可视化', '平台']
    }
  },
  assets: {
    asset1: {
      title: 'AI代码审查工具设计方案',
      description: '基于机器学习的智能代码审查工具完整设计文档',
      content: '# AI代码审查工具\n\n## 概述\n这是一个革新性的代码审查工具...',
      category: '技术方案',
      tags: ['AI', '代码审查', '机器学习']
    }
  }
}
