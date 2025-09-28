import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '../../../../lib/email';

// 内存存储验证码（生产环境应使用Redis）
const verificationCodes = new Map<string, { code: string; expires: number; purpose: string }>();

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
    
    // 存储验证码，10分钟有效期
    const expires = Date.now() + 10 * 60 * 1000; // 10分钟
    verificationCodes.set(email, { code, expires, purpose });
    
    // 在开发和生产环境中都显示验证码到控制台（方便测试）
    console.log('🎯 验证码:', code);
    console.log('📧 收件人:', email);
    console.log('🏷️ 用途:', purpose);
    
    // 检查阿里云邮件服务配置
    console.log('🔍 环境变量检查:', {
      hasAccessKeyId: !!process.env.ALIYUN_ACCESS_KEY_ID,
      hasAccessKeySecret: !!process.env.ALIYUN_ACCESS_KEY_SECRET,
      hasFromAddress: !!process.env.ALIYUN_FROM_ADDRESS,
      accessKeyIdLength: process.env.ALIYUN_ACCESS_KEY_ID?.length || 0
    });
    
    try {
      // 尝试发送邮件
      const emailSent = await emailService.sendVerificationCode(email, code, purpose as 'login' | 'register');
      
      if (emailSent) {
        console.log('✅ 邮件发送成功');
        return NextResponse.json({
          success: true,
          message: '验证码已发送到您的邮箱，请查收'
        });
      } else {
        console.log('⚠️ 邮件发送失败，但验证码已生成');
        return NextResponse.json({
          success: true,
          message: '验证码已生成，请查看服务器日志获取验证码'
        });
      }
    } catch (emailError) {
      console.error('邮件服务异常:', emailError);
      console.log('💡 验证码已生成，请在控制台查看:', code);
      return NextResponse.json({
        success: true,
        message: '验证码已生成，请查看服务器日志获取验证码'
      });
    }
    
  } catch (error: any) {
    console.error('验证码发送API失败:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// 验证验证码的API
export async function PUT(request: NextRequest) {
  try {
    const { email, code } = await request.json();
    
    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PARAMS', message: '邮箱和验证码不能为空' } },
        { status: 400 }
      );
    }

    const stored = verificationCodes.get(email);
    
    if (!stored) {
      return NextResponse.json(
        { success: false, error: { code: 'CODE_NOT_FOUND', message: '验证码不存在，请重新获取' } },
        { status: 400 }
      );
    }

    if (Date.now() > stored.expires) {
      verificationCodes.delete(email);
      return NextResponse.json(
        { success: false, error: { code: 'CODE_EXPIRED', message: '验证码已过期，请重新获取' } },
        { status: 400 }
      );
    }

    if (stored.code !== code) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CODE', message: '验证码错误' } },
        { status: 400 }
      );
    }

    // 验证成功，删除验证码
    verificationCodes.delete(email);
    
    return NextResponse.json({
      success: true,
      message: '验证码验证成功'
    });
    
  } catch (error: any) {
    console.error('验证码验证API失败:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
