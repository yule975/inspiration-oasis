import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 模拟返回灵感数据
    const mockIdeas = [
      {
        id: '1',
        title: '智能客服AI助手',
        content: '使用AI技术改进客户服务体验',
        status: 'PENDING_EVALUATION',
        createdAt: new Date().toISOString(),
        author: { id: '1', name: '演示用户', email: 'demo@example.com' }
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
