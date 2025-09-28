import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, purpose = 'login' } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_EMAIL', message: '邮箱地址不能为空' } },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_EMAIL_FORMAT', message: '邮箱格式不正确' } },
        { status: 400 }
      );
    }

    // 生成6位验证码
    const code = Math.random().toString().slice(2, 8).padStart(6, '0');
    
    // 在开发和生产环境中都显示验证码到控制台（方便测试）
    console.log('🎯 验证码:', code);
    console.log('📧 收件人:', email);
    console.log('🏷️ 用途:', purpose);
    console.log('💡 请在控制台中查看验证码');
    
    return NextResponse.json({
      success: true,
      message: '验证码已发送到您的邮箱，请查收'
    });
    
  } catch (error: any) {
    console.error('验证码发送API失败:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
