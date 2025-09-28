import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 返回丰富的灵感数据
    const mockIdeas = [
      {
        id: '1',
        title: '智能客服AI助手优化方案',
        content: '【痛点/需求】\n当前客服系统响应速度慢，用户满意度低，人工成本高\n\n【AI解决方案构想】\n集成GPT-4构建智能客服机器人，支持多轮对话、情感识别、知识库检索\n\n【预期价值/ROI】\n预计提升客服效率60%，降低人工成本40%，用户满意度提升至90%',
        category: '结构化发布',
        tags: ['客服系统', 'GPT-4', 'AI助手', '效率提升'],
        author: {
          id: '1',
          name: '产品经理小王',
          avatar: '/avatars/user1.jpg'
        },
        likes: 42,
        comments: 12,
        isLiked: false,
        createdAt: '2024-09-25T10:30:00Z',
        updatedAt: '2024-09-25T10:30:00Z'
      },
      {
        id: '2',
        title: '营销文案自动生成工具',
        content: '【痛点/需求】\n营销团队每天需要创作大量文案，耗时且质量不稳定\n\n【AI解决方案构想】\n基于Claude/GPT开发文案生成工具，支持多种营销场景模板\n\n【预期价值/ROI】\n节省文案创作时间70%，提升转化率15%',
        category: '结构化发布', 
        tags: ['营销文案', '自动生成', 'Claude', '转化率'],
        author: {
          id: '2',
          name: '营销总监张三',
          avatar: '/avatars/user2.jpg'
        },
        likes: 28,
        comments: 8,
        isLiked: true,
        createdAt: '2024-09-24T15:20:00Z',
        updatedAt: '2024-09-24T15:20:00Z'
      },
      {
        id: '3',
        title: '智能数据分析看板',
        content: '【痛点/需求】\n业务数据分散在各个系统，分析报告制作耗时且易出错\n\n【AI解决方案构想】\n开发AI驱动的数据分析平台，自动抓取、清洗、分析数据并生成洞察报告\n\n【预期价值/ROI】\n减少报告制作时间80%，提升决策准确性30%',
        category: '结构化发布',
        tags: ['数据分析', '商业智能', '自动化', 'AI洞察'],
        author: {
          id: '3',
          name: '数据分析师李四',
          avatar: '/avatars/user3.jpg'
        },
        likes: 35,
        comments: 15,
        isLiked: false,
        createdAt: '2024-09-23T09:15:00Z',
        updatedAt: '2024-09-23T09:15:00Z'
      },
      {
        id: '4',
        title: '智能招聘筛选系统',
        content: '【痛点/需求】\nHR每天需要筛选大量简历，效率低且容易遗漏优秀候选人\n\n【AI解决方案构想】\n使用NLP技术分析简历内容，结合岗位要求进行智能匹配和排序\n\n【预期价值/ROI】\n提升筛选效率3倍，降低优秀人才流失率50%',
        category: '结构化发布',
        tags: ['人力资源', 'NLP', '简历筛选', '智能匹配'],
        author: {
          id: '4',
          name: 'HR主管王五',
          avatar: '/avatars/user4.jpg'
        },
        likes: 19,
        comments: 6,
        isLiked: false,
        createdAt: '2024-09-22T14:45:00Z',
        updatedAt: '2024-09-22T14:45:00Z'
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockIdeas,
      pagination: {
        total: mockIdeas.length,
        limit: 50,
        offset: 0,
        hasMore: false
      }
    });
  } catch (error: any) {
    console.error('Ideas API GET 错误:', error);
    return NextResponse.json(
      { success: false, error: error.message || '获取灵感列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 基本数据验证
    if (!body.content && !body.title) {
      return NextResponse.json(
        { success: false, error: '灵感内容或标题不能为空' },
        { status: 400 }
      );
    }

    // 模拟创建成功
    const newIdea = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
      author: { id: '1', name: '演示用户', email: 'demo@example.com' }
    };

    return NextResponse.json({ 
      success: true, 
      data: newIdea,
      message: '灵感创建成功'
    });
  } catch (error: any) {
    console.error('Ideas API POST 错误:', error);
    return NextResponse.json(
      { success: false, error: error.message || '创建灵感失败' },
      { status: 500 }
    );
  }
}
