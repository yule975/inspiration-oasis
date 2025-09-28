import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '../../../../lib/email';
import crypto from 'crypto'

// 使用HMAC签名生成无状态token，避免无服务器环境丢失内存问题
const getSigningSecret = (): string => {
  return (
    process.env.EMAIL_TOKEN_SECRET ||
    process.env.ALIYUN_ACCESS_KEY_SECRET ||
    'fallback-signing-secret-for-dev-only'
  )
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function signToken(payload: Record<string, any>): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = base64url(JSON.stringify(header))
  const encodedPayload = base64url(JSON.stringify(payload))
  const data = `${encodedHeader}.${encodedPayload}`
  const signature = base64url(
    crypto.createHmac('sha256', getSigningSecret()).update(data).digest()
  )
  return `${data}.${signature}`
}

function verifyToken(token: string): { valid: boolean; payload?: any; error?: string } {
  try {
    const [h, p, s] = token.split('.')
    if (!h || !p || !s) return { valid: false, error: 'TOKEN_FORMAT_INVALID' }
    const data = `${h}.${p}`
    const expected = base64url(
      crypto.createHmac('sha256', getSigningSecret()).update(data).digest()
    )
    if (expected !== s) return { valid: false, error: 'TOKEN_SIGNATURE_INVALID' }
    const payload = JSON.parse(Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString())
    if (Date.now() > payload.exp) return { valid: false, error: 'TOKEN_EXPIRED' }
    return { valid: true, payload }
  } catch (e) {
    return { valid: false, error: 'TOKEN_VERIFY_ERROR' }
  }
}

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
    const expires = Date.now() + 10 * 60 * 1000; // 10分钟
    // 生成无状态token
    const token = signToken({ email, code, purpose, exp: expires })
    
    // 在开发和生产环境中都显示验证码到控制台（方便测试）
    console.log('🎯 验证码:', code);
    console.log('📧 收件人:', email);
    console.log('🏷️ 用途:', purpose);
    
    // 检查阿里云邮件服务配置
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID || ''
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET || ''
    
    console.log('🔍 环境变量检查:', {
      hasAccessKeyId: !!accessKeyId,
      hasAccessKeySecret: !!accessKeySecret,
      hasFromAddress: !!process.env.ALIYUN_FROM_ADDRESS,
      accessKeyIdLength: accessKeyId.length,
      accessKeyIdPrefix: accessKeyId.substring(0, 8),
      isPlaceholder: accessKeyId.includes('<') || accessKeyId.includes('your_'),
      actualValue: accessKeyId === '<your_aliyun_access_key_id>' ? 'PLACEHOLDER_DETECTED' : 'REAL_VALUE'
    });
    
    try {
      // 尝试发送邮件
      const emailSent = await emailService.sendVerificationCode(email, code, purpose as 'login' | 'register');
      
      if (emailSent) {
        console.log('✅ 邮件发送成功');
        return NextResponse.json({
          success: true,
          message: '验证码已发送到您的邮箱，请查收',
          token
        });
      } else {
        console.log('⚠️ 邮件发送失败，但验证码已生成');
        return NextResponse.json({
          success: true,
          message: '验证码已生成，请查看服务器日志获取验证码',
          token
        });
      }
    } catch (emailError) {
      console.error('邮件服务异常:', emailError);
      console.log('💡 验证码已生成，请在控制台查看:', code);
      return NextResponse.json({
        success: true,
        message: '验证码已生成，请查看服务器日志获取验证码',
        token
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
    const { email, code, token } = await request.json();
    
    if (!email || !code || !token) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PARAMS', message: '邮箱、验证码和token不能为空' } },
        { status: 400 }
      );
    }
    // 校验token有效性
    const result = verifyToken(token)
    if (!result.valid || !result.payload) {
      const err = (result as any).error || 'TOKEN_INVALID'
      const message = err === 'TOKEN_EXPIRED' ? '验证码已过期，请重新获取' : '验证码不存在，请重新获取'
      return NextResponse.json(
        { success: false, error: { code: err, message } },
        { status: 400 }
      );
    }

    const payload = result.payload
    if (payload.email !== email || payload.code !== code) {
      return NextResponse.json(
        { success: false, error: { code: 'TOKEN_MISMATCH', message: '验证码错误或不匹配' } },
        { status: 400 }
      );
    }
    
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
