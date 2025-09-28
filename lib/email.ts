import crypto from 'crypto'

interface EmailConfig {
  accessKeyId: string
  accessKeySecret: string
  fromAddress: string
}

interface EmailParams {
  to: string
  subject: string
  htmlBody: string
  textBody?: string
}

class AliyunEmailService {
  private config: EmailConfig

  constructor() {
    this.config = {
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
      fromAddress: process.env.ALIYUN_FROM_ADDRESS || 'support@mail.mydevlab88.top'
    }
  }

  private generateSignature(params: Record<string, string>): string {
    // 阿里云API签名算法 - 修复版本
    const sortedKeys = Object.keys(params).sort()
    const canonicalizedQueryString = sortedKeys
      .map(key => `${this.percentEncode(key)}=${this.percentEncode(params[key])}`)
      .join('&')

    const stringToSign = `POST&${this.percentEncode('/')}&${this.percentEncode(canonicalizedQueryString)}`
    
    console.log('🔍 签名字符串:', stringToSign)
    
    const signature = crypto
      .createHmac('sha1', this.config.accessKeySecret + '&')
      .update(stringToSign, 'utf8')
      .digest('base64')

    console.log('🔍 生成的签名:', signature)
    return signature
  }

  private percentEncode(str: string): string {
    return encodeURIComponent(str)
      .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
      .replace(/\*/g, '%2A')
      .replace(/\+/g, '%20')
      .replace(/%7E/g, '~')
  }

  private createRequestParams(emailParams: EmailParams): Record<string, string> {
    // 修复时间戳格式 - 阿里云需要UTC格式
    const now = new Date()
    const timestamp = now.toISOString().replace(/\.\d{3}Z$/, 'Z')
    const nonce = Date.now().toString() + Math.random().toString(36).substring(2, 8)

    const params = {
      Action: 'SingleSendMail',
      Version: '2015-11-23',
      Format: 'JSON',
      AccessKeyId: this.config.accessKeyId,
      SignatureMethod: 'HMAC-SHA1',
      Timestamp: timestamp,
      SignatureVersion: '1.0',
      SignatureNonce: nonce,
      RegionId: 'cn-hangzhou',
      AccountName: this.config.fromAddress,
      FromAlias: '灵感绿洲',
      AddressType: '1',
      ReplyToAddress: 'true',
      ToAddress: emailParams.to,
      Subject: emailParams.subject,
      HtmlBody: emailParams.htmlBody,
      ...(emailParams.textBody && { TextBody: emailParams.textBody })
    }

    console.log('🔍 请求参数（签名前）:', {
      ...params,
      AccessKeyId: params.AccessKeyId ? params.AccessKeyId.substring(0, 8) + '***' : 'missing'
    })

    const signature = this.generateSignature(params)
    return { ...params, Signature: signature }
  }

  async sendVerificationCode(email: string, code: string, purpose: 'login' | 'register' = 'login'): Promise<boolean> {
    try {
      const subject = purpose === 'register' ? '灵感绿洲 - 注册验证码' : '灵感绿洲 - 登录验证码'
      const action = purpose === 'register' ? '注册' : '登录'
      
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; padding: 12px; background: linear-gradient(135deg, #2F6A53 0%, #1e4a3a 100%); border-radius: 12px; margin-bottom: 20px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="9" r="5" fill="white" />
                  <rect x="9" y="16" width="6" height="3" rx="1" fill="white" />
                  <path d="M12 6l1.5 2.5L16 9l-2.5 1.5L12 13l-1.5-2.5L8 9l2.5-1.5L12 6z" fill="#2F6A53" />
                  <circle cx="12" cy="9" r="1.5" fill="#2F6A53" opacity="0.9" />
                </svg>
              </div>
              <h1 style="color: #2F6A53; margin: 0; font-size: 24px;">灵感绿洲</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
              <h2 style="color: #2F6A53; margin-bottom: 20px;">您的${action}验证码</h2>
              <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #2F6A53; letter-spacing: 4px;">${code}</span>
              </div>
              <p style="color: #666; margin: 20px 0;">验证码有效期为 <strong>10分钟</strong>，请尽快使用。</p>
              <p style="color: #999; font-size: 14px;">如果这不是您的操作，请忽略此邮件。</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 14px; margin: 0;">
                此邮件由灵感绿洲系统自动发送，请勿回复。
              </p>
            </div>
          </div>
        </body>
        </html>
      `

      const textBody = `
【灵感绿洲】您的${action}验证码是：${code}

验证码有效期为10分钟，请尽快使用。
如果这不是您的操作，请忽略此邮件。

此邮件由灵感绿洲系统自动发送，请勿回复。
      `

      const requestParams = this.createRequestParams({
        to: email,
        subject,
        htmlBody,
        textBody
      })

      console.log('🔍 发送邮件请求参数:', {
        to: email,
        from: this.config.fromAddress,
        hasAccessKey: !!this.config.accessKeyId,
        hasSecretKey: !!this.config.accessKeySecret
      })

      // 使用阿里云默认区域端点
      const endpoint = 'https://dm.aliyuncs.com/'
      
      console.log('🔍 API endpoint:', endpoint)
      console.log('🔍 请求体参数:', Object.keys(requestParams))
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
          'User-Agent': 'Aliyun-Email-Client/1.0',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(requestParams)
      })

      const responseText = await response.text()
      console.log('📧 阿里云API响应状态:', response.status)
      console.log('📧 阿里云API响应内容:', responseText)

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('解析响应JSON失败:', parseError)
        console.error('原始响应:', responseText)
        return false
      }
      
      if (result.Code && result.Code !== 'OK') {
        console.error('🚫 阿里云邮件发送失败:', result)
        return false
      }

      console.log('✅ 验证码邮件发送成功:', email)
      return true

    } catch (error) {
      console.error('邮件发送异常:', error)
      return false
    }
  }
}

export const emailService = new AliyunEmailService()
