import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { randomUUID } from 'crypto'

// 加载环境变量
config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('🌱 开始数据库初始化...')

  try {
    // 清理现有数据（按依赖关系顺序）
    await supabase.from('ai_enhancements').delete().neq('id', '')
    await supabase.from('comments').delete().neq('id', '')
    await supabase.from('likes').delete().neq('id', '')
    await supabase.from('assets').delete().neq('id', '')
    await supabase.from('ideas').delete().neq('id', '')
    await supabase.from('tags').delete().neq('id', '')
    await supabase.from('users').delete().neq('id', '')

    console.log('🗑️  清理现有数据完成')

    // 创建测试用户
    const now = new Date().toISOString()
    const users = [
      {
        id: 'user_001',
        name: '张三',
        email: 'zhangsan@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
        created_at: now,
        updated_at: now
      },
      {
        id: 'user_002', 
        name: '李四',
        email: 'lisi@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
        created_at: now,
        updated_at: now
      },
      {
        id: 'user_003',
        name: '王五',
        email: 'wangwu@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu',
        created_at: now,
        updated_at: now
      },
      {
        id: 'user_004',
        name: '赵六',
        email: 'zhaoliu@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu',
        created_at: now,
        updated_at: now
      }
    ]

    const { data: createdUsers, error: usersError } = await supabase
      .from('users')
      .insert(users)
      .select()

    if (usersError) {
      throw usersError
    }

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

    const tagData = tags.map(tagName => ({
      id: randomUUID(),
      name: tagName,
      usage_count: Math.floor(Math.random() * 50) + 1,
      created_at: now
    }))

    const { data: createdTags, error: tagsError } = await supabase
      .from('tags')
      .insert(tagData)
      .select()

    if (tagsError) {
      throw tagsError
    }

    console.log(`🏷️  创建 ${createdTags.length} 个标签`)

    // 创建测试灵感
    const ideaTemplates = [
      {
        content: '开发一个基于AI的代码审查工具，能够自动检测代码质量问题、安全漏洞和性能优化建议。可以集成到GitHub、GitLab等平台，为开发团队提供实时反馈。',
        tags: ['AI', '代码审查', '开发工具', 'GitHub'],
        author_id: 'user_001'
      },
      {
        content: '设计一个智能学习助手，根据学生的学习进度和理解程度，动态调整学习内容和难度。结合知识图谱和个性化推荐，提供最适合的学习路径。',
        tags: ['AI', '教育', '个性化学习', '知识图谱'],
        author_id: 'user_002'
      },
      {
        content: '创建一个去中心化的创作者经济平台，让内容创作者可以直接从粉丝那里获得收益，不需要经过中间平台抽成。使用区块链技术确保交易透明和版权保护。',
        tags: ['区块链', '创作者经济', 'NFT', '去中心化'],
        author_id: 'user_003'
      },
      {
        content: '开发一个基于语音的智能家居控制系统，可以理解自然语言指令，控制家中的各种智能设备。支持多语言、方言识别，并能学习用户的使用习惯。',
        tags: ['语音识别', '智能家居', 'IoT', '自然语言处理'],
        author_id: 'user_004'
      },
      {
        content: '构建一个企业级的低代码开发平台，让非技术人员也能快速构建应用程序。提供丰富的组件库、拖拽式界面设计和强大的数据集成能力。',
        tags: ['低代码', '企业应用', '拖拽开发', '数据集成'],
        author_id: 'user_001'
      }
    ]

    const ideaData = ideaTemplates.map(idea => {
       const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
       return {
         id: randomUUID(),
         ...idea,
         likes_count: Math.floor(Math.random() * 50),
         comments_count: Math.floor(Math.random() * 20),
         view_count: Math.floor(Math.random() * 200) + 50,
         created_at: createdAt,
         updated_at: createdAt
       }
     })

    const { data: createdIdeas, error: ideasError } = await supabase
      .from('ideas')
      .insert(ideaData)
      .select()

    if (ideasError) {
      throw ideasError
    }

    console.log(`💡 创建 ${createdIdeas.length} 个测试灵感`)

    // 为灵感添加随机点赞
    const likes = []
    for (const idea of createdIdeas) {
      const likeCount = Math.floor(Math.random() * 4) + 1
      const likeUsers = users.slice(0, likeCount)
      
      for (const user of likeUsers) {
        likes.push({
          id: randomUUID(),
          idea_id: idea.id,
          user_id: user.id,
          created_at: now
        })
      }
    }

    if (likes.length > 0) {
      const { error: likesError } = await supabase
        .from('likes')
        .insert(likes)

      if (likesError) {
        throw likesError
      }

      console.log(`👍 创建 ${likes.length} 个点赞记录`)
    }

    // 为灵感添加随机评论
    const commentTemplates = [
      '这个想法很有创意！',
      '我觉得这个方向很有潜力，可以考虑加入更多的功能。',
      '技术实现上可能需要考虑一下性能问题。',
      '市场需求应该不错，建议做一下竞品分析。',
      '这个领域我之前有过了解，可以私下交流一下。'
    ]

    const comments = []
    for (const idea of createdIdeas.slice(0, 3)) {
      const commentCount = Math.floor(Math.random() * 3) + 1
      
      for (let i = 0; i < commentCount; i++) {
        const commentTime = new Date().toISOString()
        comments.push({
          id: randomUUID(),
          content: commentTemplates[Math.floor(Math.random() * commentTemplates.length)],
          idea_id: idea.id,
          author_id: users[Math.floor(Math.random() * users.length)].id,
          created_at: commentTime,
          updated_at: commentTime
        })
      }
    }

    if (comments.length > 0) {
      const { error: commentsError } = await supabase
        .from('comments')
        .insert(comments)

      if (commentsError) {
        throw commentsError
      }

      console.log(`💬 创建 ${comments.length} 个评论`)
    }

    console.log('✅ 数据库初始化完成！')

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    process.exit(1)
  }
}

main()
  .catch(console.error)
  .finally(() => {
    console.log('🔚 脚本执行完成')
  })