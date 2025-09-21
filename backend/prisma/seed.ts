import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('开始种子数据初始化...')

  try {
    // 创建测试用户
    const hashedPassword = await bcrypt.hash('123456', 10)
    
    const { data: user1, error: user1Error } = await supabase
      .from('users')
      .upsert({
        name: '管理员',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        is_active: true,
      }, {
        onConflict: 'email'
      })
      .select()
      .single()

    if (user1Error) {
      console.error('创建用户1失败:', user1Error)
      throw user1Error
    }

    const { data: user2, error: user2Error } = await supabase
      .from('users')
      .upsert({
        name: '普通用户',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'user',
        is_active: true,
      }, {
        onConflict: 'email'
      })
      .select()
      .single()

    if (user2Error) {
      console.error('创建用户2失败:', user2Error)
      throw user2Error
    }

    console.log('用户创建完成:', { user1: user1.email, user2: user2.email })

    // 创建示例灵感
    const { data: idea1, error: idea1Error } = await supabase
      .from('ideas')
      .insert({
        content: '开发一个基于AI的创意写作助手，帮助用户克服写作障碍，提供灵感和建议。',
        tags: ['AI', '写作', '创意', '工具'],
        author_id: user1.id,
        likes_count: 5,
        comments_count: 2,
        view_count: 20,
      })
      .select()
      .single()

    if (idea1Error) {
      console.error('创建灵感1失败:', idea1Error)
      throw idea1Error
    }

    const { data: idea2, error: idea2Error } = await supabase
      .from('ideas')
      .insert({
        content: '设计一个智能家居控制系统，通过语音和手势识别来控制家中的各种设备。',
        tags: ['智能家居', 'IoT', '语音识别', '手势控制'],
        author_id: user2.id,
        likes_count: 8,
        comments_count: 3,
        view_count: 35,
      })
      .select()
      .single()

    if (idea2Error) {
      console.error('创建灵感2失败:', idea2Error)
      throw idea2Error
    }

    console.log('灵感创建完成:', { idea1: idea1.id, idea2: idea2.id })

    // 创建示例评论
    const { error: comment1Error } = await supabase
      .from('comments')
      .insert({
        content: '这个想法很有趣！可以考虑加入情感分析功能。',
        idea_id: idea1.id,
        author_id: user2.id,
      })

    if (comment1Error) {
      console.error('创建评论1失败:', comment1Error)
      throw comment1Error
    }

    const { error: comment2Error } = await supabase
      .from('comments')
      .insert({
        content: '智能家居确实是未来趋势，期待看到更多创新。',
        idea_id: idea2.id,
        author_id: user1.id,
      })

    if (comment2Error) {
      console.error('创建评论2失败:', comment2Error)
      throw comment2Error
    }

    console.log('评论创建完成')

    // 创建示例点赞
    const { error: like1Error } = await supabase
      .from('likes')
      .insert({
        idea_id: idea1.id,
        user_id: user2.id,
      })

    if (like1Error) {
      console.error('创建点赞1失败:', like1Error)
      throw like1Error
    }

    const { error: like2Error } = await supabase
      .from('likes')
      .insert({
        idea_id: idea2.id,
        user_id: user1.id,
      })

    if (like2Error) {
      console.error('创建点赞2失败:', like2Error)
      throw like2Error
    }

    console.log('点赞创建完成')

    // 创建示例标签
    const tags = ['AI', '写作', '创意', '工具', '智能家居', 'IoT', '语音识别', '手势控制']
    
    for (const tagName of tags) {
      const { error: tagError } = await supabase
        .from('tags')
        .upsert({
          name: tagName,
          usage_count: 1,
        }, {
          onConflict: 'name'
        })

      if (tagError) {
        console.error(`创建标签 ${tagName} 失败:`, tagError)
        throw tagError
      }
    }

    console.log('标签创建完成')
    console.log('种子数据初始化完成！')

  } catch (error) {
    console.error('种子数据初始化失败:', error)
    process.exit(1)
  }
}

main()