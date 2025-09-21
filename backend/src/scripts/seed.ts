import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始数据库初始化...')

  // 清理现有数据
  await prisma.aIEnhancement.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.like.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.idea.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.user.deleteMany()

  console.log('🗑️  清理现有数据完成')

  // 创建测试用户
  const users = [
    {
      id: 'user_001',
      name: '张三',
      email: 'zhangsan@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan'
    },
    {
      id: 'user_002', 
      name: '李四',
      email: 'lisi@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi'
    },
    {
      id: 'user_003',
      name: '王五',
      email: 'wangwu@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu'
    },
    {
      id: 'user_004',
      name: '赵六',
      email: 'zhaoliu@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu'
    }
  ]

  const createdUsers = await Promise.all(
    users.map(user => prisma.user.create({ data: user }))
  )

  console.log(`👥 创建 ${createdUsers.length} 个测试用户`)

  // 创建标签
  const tags = [
    'AI', '机器学习', '深度学习', 'GPT', 'ChatGPT',
    '前端开发', 'React', 'Vue', 'TypeScript', 'JavaScript',
    '后端开发', 'Node.js', 'Python', 'Java', 'Go',
    '数据库', 'PostgreSQL', 'MongoDB', 'Redis',
    '云计算', 'AWS', '微服务', 'Docker', 'Kubernetes',
    '产品设计', 'UI/UX', '用户体验', '交互设计',
    '创业', '商业模式', '融资', '市场营销',
    '区块链', '加密货币', 'NFT', 'DeFi',
    '移动开发', 'React Native', 'Flutter', 'iOS', 'Android',
    '开源', 'GitHub', '社区', '协作'
  ]

  const createdTags = await Promise.all(
    tags.map(tagName => 
      prisma.tag.create({
        data: {
          name: tagName,
          usageCount: Math.floor(Math.random() * 50) + 1
        }
      })
    )
  )

  console.log(`🏷️  创建 ${createdTags.length} 个标签`)

  // 创建测试灵感
  const ideaTemplates = [
    {
      content: '开发一个基于AI的代码审查工具，能够自动检测代码质量问题、安全漏洞和性能优化建议。可以集成到GitHub、GitLab等平台，为开发团队提供实时反馈。',
      tags: ['AI', '代码审查', '开发工具', 'GitHub'],
      authorId: 'user_001'
    },
    {
      content: '设计一个智能学习助手，根据学生的学习进度和理解程度，动态调整学习内容和难度。结合知识图谱和个性化推荐，提供最适合的学习路径。',
      tags: ['AI', '教育', '个性化学习', '知识图谱'],
      authorId: 'user_002'
    },
    {
      content: '创建一个去中心化的创作者经济平台，让内容创作者可以直接从粉丝那里获得收益，不需要经过中间平台抽成。使用区块链技术确保交易透明和版权保护。',
      tags: ['区块链', '创作者经济', 'NFT', '去中心化'],
      authorId: 'user_003'
    },
    {
      content: '开发一个基于语音的智能家居控制系统，可以理解自然语言指令，控制家中的各种智能设备。支持多语言、方言识别，并能学习用户的使用习惯。',
      tags: ['语音识别', '智能家居', 'IoT', '自然语言处理'],
      authorId: 'user_004'
    },
    {
      content: '构建一个企业级的低代码开发平台，让非技术人员也能快速构建应用程序。提供丰富的组件库、拖拽式界面设计和强大的数据集成能力。',
      tags: ['低代码', '企业应用', '拖拽开发', '数据集成'],
      authorId: 'user_001'
    },
    {
      content: '设计一个基于AR/VR的远程协作工具，让分布式团队可以在虚拟环境中进行会议、头脑风暴和项目协作。支持3D模型展示和实时编辑。',
      tags: ['AR/VR', '远程协作', '虚拟现实', '团队协作'],
      authorId: 'user_002'
    },
    {
      content: '开发一个AI驱动的健康管理应用，通过分析用户的生活习惯、运动数据和健康指标，提供个性化的健康建议和预防性医疗服务推荐。',
      tags: ['AI', '健康管理', '预防医疗', '数据分析'],
      authorId: 'user_003'
    },
    {
      content: '创建一个基于图神经网络的推荐系统，能够更好地理解用户和物品之间的复杂关系，提供更精准的个性化推荐。适用于电商、内容平台等场景。',
      tags: ['图神经网络', '推荐系统', '机器学习', '个性化'],
      authorId: 'user_004'
    },
    {
      content: '构建一个开源的微服务治理平台，提供服务发现、负载均衡、熔断降级、链路追踪等功能。支持多种编程语言和部署环境。',
      tags: ['微服务', '开源', '服务治理', '云原生'],
      authorId: 'user_001'
    },
    {
      content: '设计一个基于机器学习的智能客服系统，能够理解用户意图、提供准确回答，并在需要时无缝转接人工客服。支持多渠道接入和知识库管理。',
      tags: ['机器学习', '智能客服', 'NLP', '客户服务'],
      authorId: 'user_002'
    }
  ]

  const createdIdeas = await Promise.all(
    ideaTemplates.map(async (ideaData, index) => {
      const idea = await prisma.idea.create({
        data: {
          ...ideaData,
          likesCount: Math.floor(Math.random() * 50),
          commentsCount: Math.floor(Math.random() * 20),
          viewCount: Math.floor(Math.random() * 200) + 50,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // 过去30天内随机时间
        }
      })

      // 为标签增加使用计数
      for (const tagName of ideaData.tags) {
        await prisma.tag.updateMany({
          where: { name: tagName },
          data: {
            usageCount: {
              increment: 1
            }
          }
        })
      }

      return idea
    })
  )

  console.log(`💡 创建 ${createdIdeas.length} 个测试灵感`)

  // 为灵感添加随机点赞
  for (const idea of createdIdeas) {
    const likeCount = Math.floor(Math.random() * 20) + 1
    const likeUsers = users.slice(0, likeCount)
    
    await Promise.all(
      likeUsers.map(user => 
        prisma.like.create({
          data: {
            ideaId: idea.id,
            userId: user.id
          }
        })
      )
    )
  }

  // 为灵感添加随机评论
  const commentTemplates = [
    '这个想法很有创意！',
    '我觉得这个方向很有潜力，可以考虑加入更多的功能。',
    '技术实现上可能需要考虑一下性能问题。',
    '市场需求应该不错，建议做一下竞品分析。',
    '这个领域我之前有过了解，可以私下交流一下。',
    'UI/UX设计在这个项目中很关键。',
    '可以考虑开源，让更多开发者参与。',
    '商业模式需要再细化一下。',
    '这个想法解决了一个真实的痛点。',
    '建议先做MVP验证市场反馈。'
  ]

  for (const idea of createdIdeas.slice(0, 8)) {
    const commentCount = Math.floor(Math.random() * 8) + 1
    
    for (let i = 0; i < commentCount; i++) {
      await prisma.comment.create({
        data: {
          content: commentTemplates[Math.floor(Math.random() * commentTemplates.length)],
          ideaId: idea.id,
          authorId: users[Math.floor(Math.random() * users.length)].id
        }
      })
    }
  }

  console.log('💬 添加随机评论和点赞')

  // 创建一些资产（从灵感归档）
  const assetsToCreate = createdIdeas.slice(0, 5).map((idea, index) => ({
    title: `${idea.content.substring(0, 30)}... - 实施方案`,
    description: `基于灵感"${idea.content.substring(0, 50)}..."的详细实施方案`,
    content: `# 项目概述\n\n${idea.content}\n\n## 技术方案\n\n这里是详细的技术实施方案...\n\n## 实施计划\n\n1. 需求分析阶段\n2. 技术选型阶段\n3. 开发实施阶段\n4. 测试验证阶段\n5. 上线部署阶段`,
    category: ['技术方案', '产品设计', '创业计划', '开源项目', '研究报告'][index % 5],
    tags: idea.tags,
    sourceType: 'IDEA',
    sourceId: idea.id,
    authorId: idea.authorId,
    downloadCount: Math.floor(Math.random() * 100)
  }))

  const createdAssets = await Promise.all(
    assetsToCreate.map(assetData => prisma.asset.create({ data: assetData }))
  )

  console.log(`📦 创建 ${createdAssets.length} 个测试资产`)

  // 创建一些AI增强历史记录
  for (const idea of createdIdeas.slice(0, 3)) {
    await prisma.aiEnhancement.create({
      data: {
        ideaId: idea.id,
        userId: idea.authorId,
        enhancementType: 'EXPAND',
        originalContent: idea.content,
        enhancedContent: idea.content + ' 此外，这个想法还可以扩展到更多应用场景，比如移动端应用、企业级解决方案等。',
        modelUsed: 'openai/gpt-3.5-turbo',
        tokensUsed: 150,
        processingTime: 2000
      }
    })
  }

  console.log('🤖 添加AI增强历史记录')

  // 创建每日简报
  const briefDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date
  })

  await Promise.all(
    briefDates.map(date => 
      prisma.dailyBrief.create({
        data: {
          date,
          summary: `${date.toLocaleDateString()} 科技要闻：AI技术持续发展，新的应用场景不断涌现。`,
          newsItems: [
            {
              id: 1,
              title: "AI技术在医疗领域的最新突破",
              summary: "研究人员开发出新的AI诊断工具...",
              tags: ["AI", "医疗"],
              importance: 4
            },
            {
              id: 2,
              title: "开源社区发布新的开发框架",
              summary: "新框架极大提升了开发效率...",
              tags: ["开源", "开发工具"],
              importance: 3
            }
          ],
          categories: ["AI", "开源", "医疗"],
          generatedBy: "gpt-3.5-turbo"
        }
      })
    )
  )

  console.log('📰 创建每日简报记录')

  // 创建系统统计数据
  const statsDates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date
  })

  await Promise.all(
    statsDates.map(date => 
      prisma.systemStats.create({
        data: {
          date,
          totalIdeas: Math.floor(Math.random() * 20) + 100,
          totalAssets: Math.floor(Math.random() * 10) + 50,
          activeUsers: Math.floor(Math.random() * 50) + 200,
          apiCalls: Math.floor(Math.random() * 1000) + 5000,
          aiTokensUsed: Math.floor(Math.random() * 10000) + 50000,
          topContributor: users[Math.floor(Math.random() * users.length)].name
        }
      })
    )
  )

  console.log('📊 创建系统统计数据')

  console.log('🎉 数据库初始化完成！')
  console.log('\n📈 数据概览:')
  console.log(`👥 用户: ${users.length}`)
  console.log(`💡 灵感: ${createdIdeas.length}`)
  console.log(`📦 资产: ${createdAssets.length}`)
  console.log(`🏷️  标签: ${tags.length}`)
  console.log(`📰 简报: ${briefDates.length} 天`)
  console.log(`📊 统计: ${statsDates.length} 天`)
}

main()
  .catch((e) => {
    console.error('❌ 数据库初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
