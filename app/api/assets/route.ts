import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 模拟返回资产数据
    const mockAssets = [
      {
        id: '1',
        title: '客服提示词模板',
        description: '专业的客服AI提示词模板',
        category: 'prompt',
        assetType: 'PROMPT',
        createdAt: new Date().toISOString(),
        author: { id: '1', name: '演示用户', email: 'demo@example.com' }
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockAssets,
      pagination: {
        total: mockAssets.length,
        limit: 50,
        offset: 0,
        hasMore: false
      }
    });
  } catch (error: any) {
    console.error('Assets API GET 错误:', error);
    return NextResponse.json(
      { success: false, error: error.message || '获取资产列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 基本数据验证
    if (!body.title || !body.description) {
      return NextResponse.json(
        { success: false, error: '资产标题和描述不能为空' },
        { status: 400 }
      );
    }

    // 模拟创建成功
    const newAsset = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
      author: { id: '1', name: '演示用户', email: 'demo@example.com' }
    };

    return NextResponse.json({ 
      success: true, 
      data: newAsset,
      message: '资产创建成功'
    });
  } catch (error: any) {
    console.error('Assets API POST 错误:', error);
    return NextResponse.json(
      { success: false, error: error.message || '创建资产失败' },
      { status: 500 }
    );
  }
}
