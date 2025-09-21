import axios from 'axios'
import { cacheService } from '@/config/redis'

// OpenRouter API配置
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const APP_NAME = process.env.OPENROUTER_APP_NAME || '灵感绿洲'
const APP_URL = process.env.OPENROUTER_APP_URL || 'https://inspiration-oasis.com'

// 模型配置
const MODELS = {
  CHAT: process.env.DEFAULT_CHAT_MODEL || 'openai/gpt-3.5-turbo',
  ANALYZE: process.env.DEFAULT_ANALYZE_MODEL || 'anthropic/claude-3-sonnet',
  ENHANCE: process.env.DEFAULT_ENHANCE_MODEL || 'openai/gpt-3.5-turbo'
}

class OpenRouterService {
  private apiKey: string
  private baseURL: string

  constructor() {
    this.apiKey = OPENROUTER_API_KEY || ''
    this.baseURL = OPENROUTER_BASE_URL

    if (!this.apiKey) {
      console.warn('⚠️  OpenRouter API Key未设置，AI服务将使用模拟数据')
    }
  }

  // 通用OpenRouter API请求
  private async makeRequest(payload: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API Key未配置')
    }

    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': APP_URL,
          'X-Title': APP_NAME,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30秒超时
      })

      return response.data
    } catch (error: any) {
      console.error('OpenRouter API 错误:', error.response?.data || error.message)
      throw new Error(`OpenRouter API调用失败: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  // 选择合适的模型
  private selectModel(taskType: string, complexity: 'simple' | 'complex' = 'simple'): string {
    const modelMap: Record<string, Record<string, string>> = {
      'enhance': {
        simple: MODELS.ENHANCE,
        complex: 'openai/gpt-4'
      },
      'summarize': {
        simple: 'anthropic/claude-3-haiku',
        complex: MODELS.ANALYZE
      },
      'chat': {
        simple: MODELS.CHAT,
        complex: 'anthropic/claude-3-opus'
      },
      'tags': {
        simple: MODELS.ENHANCE,
        complex: MODELS.ENHANCE
      },
      'analyze': {
        simple: MODELS.ANALYZE,
        complex: 'openai/gpt-4'
      }
    }

    return modelMap[taskType]?.[complexity] || MODELS.CHAT
  }

  // AI内容增强
  async enhanceContent(content: string, type: string, context?: string): Promise<any> {
    // 如果没有API Key，返回模拟数据
    if (!this.apiKey) {
      return this.getMockEnhancement(content, type)
    }

    const model = this.selectModel('enhance', content.length > 500 ? 'complex' : 'simple')
    
    const prompts: Record<string, string> = {
      optimize: `请优化以下内容的表达，使其更加清晰准确：\n\n${content}`,
      expand: `请扩展以下想法，提供更多细节和应用场景：\n\n${content}`,
      tone: `请润色以下内容的语气，使其更加专业和友好：\n\n${content}`
    }

    const cacheKey = `enhance:${type}:${Buffer.from(content).toString('base64').slice(0, 32)}`
    
    // 尝试从缓存获取
    const cached = await cacheService.get(cacheKey)
    if (cached) return cached

    try {
      const response = await this.makeRequest({
        model,
        messages: [
          {
            role: "system",
            content: "你是一个专业的内容编辑助手，擅长优化和改进文本内容。请用中文回应。"
          },
          {
            role: "user",
            content: prompts[type] || prompts.optimize
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })

      const result = {
        original_content: content,
        enhanced_content: response.choices[0].message.content,
        enhancement_type: type,
        model_used: model,
        suggestions: [
          "可以考虑添加具体的例子来支撑观点",
          "建议增加更多的应用场景描述"
        ]
      }

      // 缓存结果（1小时）
      await cacheService.set(cacheKey, result, 3600)
      
      return result
    } catch (error) {
      console.error('AI增强失败，返回模拟数据:', error)
      return this.getMockEnhancement(content, type)
    }
  }

  // 智能总结
  async summarizeContent(content: string, summaryType: string = 'brief'): Promise<any> {
    if (!this.apiKey) {
      return this.getMockSummary(content, summaryType)
    }

    const model = this.selectModel('summarize', summaryType === 'detailed' ? 'complex' : 'simple')
    
    const systemPrompts: Record<string, string> = {
      brief: "提供简洁的核心观点总结",
      detailed: "提供详细的分析总结，包含关键要点和洞察",
      key_points: "提取3-5个关键要点，以列表形式呈现"
    }

    const cacheKey = `summarize:${summaryType}:${Buffer.from(content).toString('base64').slice(0, 32)}`
    
    const cached = await cacheService.get(cacheKey)
    if (cached) return cached

    try {
      const response = await this.makeRequest({
        model,
        messages: [
          {
            role: "system",
            content: `你是一个专业的内容分析师。${systemPrompts[summaryType]}。请用中文回应。`
          },
          {
            role: "user",
            content: `请分析以下内容：\n\n${content}`
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      })

      const result = {
        summary: response.choices[0].message.content,
        key_points: ["AI技术应用", "效率提升", "创新思维"],
        insights: "这个想法强调了AI在提升工作效率方面的重要作用，具有很强的实用价值。",
        model_used: model
      }

      await cacheService.set(cacheKey, result, 3600)
      return result
    } catch (error) {
      console.error('AI总结失败，返回模拟数据:', error)
      return this.getMockSummary(content, summaryType)
    }
  }

  // AI对话
  async chatWithAI(message: string, context?: string, conversationId?: string): Promise<any> {
    if (!this.apiKey) {
      return this.getMockChat(message)
    }

    const model = this.selectModel('chat', message.length > 200 ? 'complex' : 'simple')

    // 这里可以从数据库获取对话历史
    const conversationHistory: any[] = []

    const messages = [
      {
        role: "system",
        content: `你是灵感绿洲的AI助手，专门帮助用户深入分析创意想法。
        当前讨论上下文：${context || '无特定上下文'}
        
        请以友好、专业的方式回应用户，提供建设性的建议和深入的分析。请用中文回应。`
      },
      ...conversationHistory,
      {
        role: "user",
        content: message
      }
    ]

    try {
      const response = await this.makeRequest({
        model,
        messages,
        max_tokens: 1200,
        temperature: 0.8
      })

      const result = {
        reply: response.choices[0].message.content,
        conversation_id: conversationId || `conv_${Date.now()}`,
        suggestions: [
          "这个想法有哪些潜在的技术挑战？",
          "可以从哪些角度来验证这个方案的可行性？",
          "有哪些类似的成功案例可以参考？"
        ],
        model_used: model
      }

      return result
    } catch (error) {
      console.error('AI对话失败，返回模拟数据:', error)
      return this.getMockChat(message)
    }
  }

  // 标签推荐
  async suggestTags(content: string, maxTags: number = 5): Promise<any> {
    if (!this.apiKey) {
      return this.getMockTags(content, maxTags)
    }

    const model = this.selectModel('tags', 'simple')
    
    const cacheKey = `tags:${Buffer.from(content).toString('base64').slice(0, 32)}`
    
    const cached = await cacheService.get(cacheKey)
    if (cached) return cached

    try {
      const response = await this.makeRequest({
        model,
        messages: [
          {
            role: "system",
            content: `你是一个标签推荐专家。根据内容推荐${maxTags}个最相关的标签。
            标签应该：
            1. 准确反映内容主题
            2. 有助于内容分类和搜索
            3. 使用常见的技术和行业术语
            
            只返回JSON格式：{"tags": [{"tag": "标签名", "confidence": 0.95, "reason": "推荐理由"}]}`
          },
          {
            role: "user",
            content: `请为以下内容推荐标签：\n\n${content}`
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })

      try {
        const jsonResponse = JSON.parse(response.choices[0].message.content)
        const result = {
          suggested_tags: jsonResponse.tags.slice(0, maxTags),
          model_used: model
        }
        
        await cacheService.set(cacheKey, result, 3600)
        return result
      } catch (parseError) {
        // JSON解析失败，返回模拟数据
        return this.getMockTags(content, maxTags)
      }
    } catch (error) {
      console.error('AI标签推荐失败，返回模拟数据:', error)
      return this.getMockTags(content, maxTags)
    }
  }

  // 每日简报生成
  async generateDailyBrief(date: string, categories: string[]): Promise<any> {
    if (!this.apiKey) {
      return this.getMockBrief(date, categories)
    }

    const cacheKey = `brief:${date}:${categories.join(',')}`
    
    const cached = await cacheService.get(cacheKey)
    if (cached) return cached

    // 这里应该获取真实的新闻数据
    const mockNewsData = [
      { title: "AI技术突破", summary: "最新AI技术在各个领域的应用突破..." },
      { title: "区块链创新", summary: "区块链技术在金融领域的最新创新..." }
    ]

    try {
      const model = this.selectModel('analyze', 'complex')
      
      const response = await this.makeRequest({
        model,
        messages: [
          {
            role: "system",
            content: `你是一个专业的科技资讯分析师。基于提供的新闻和趋势数据，生成一份简洁有价值的每日简报。
            
            简报应包含：
            1. 当日要闻总结（2-3句）
            2. 3-5条重要新闻，每条包含标题、摘要、标签、重要程度
            3. 趋势洞察和建议
            
            请用中文回应，以JSON格式返回结果。`
          },
          {
            role: "user",
            content: `请基于以下数据生成${date}的AI简报：
            
            关注分类：${categories.join(', ')}
            新闻数据：${JSON.stringify(mockNewsData)}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.4
      })

      // 尝试解析JSON，失败则返回模拟数据
      try {
        const briefData = JSON.parse(response.choices[0].message.content)
        const result = {
          date,
          summary: briefData.summary || "今日科技界关注焦点集中在AI技术突破和创新应用...",
          news: briefData.news || mockNewsData,
          categories,
          generated_by: model
        }

        await cacheService.set(cacheKey, result, 86400) // 缓存24小时
        return result
      } catch (parseError) {
        return this.getMockBrief(date, categories)
      }
    } catch (error) {
      console.error('AI简报生成失败，返回模拟数据:', error)
      return this.getMockBrief(date, categories)
    }
  }

  // 模拟数据生成方法
  private getMockEnhancement(content: string, type: string) {
    const enhancements: Record<string, string> = {
      optimize: content + " [AI优化后的版本]",
      expand: content + " 此外，这个想法还可以扩展到更多应用场景，如代码生成、创意写作、技术文档编写等。",
      tone: "从专业角度来看，" + content
    }

    return {
      original_content: content,
      enhanced_content: enhancements[type] || enhancements.optimize,
      enhancement_type: type,
      model_used: "mock-model",
      suggestions: ["考虑添加更多具体例子", "建议增加实施细节"]
    }
  }

  private getMockSummary(content: string, summaryType: string) {
    return {
      summary: `核心观点：${content.substring(0, 50)}...`,
      key_points: ["AI技术应用", "效率提升", "创新思维"],
      insights: "这个想法强调了AI在提升工作效率方面的重要作用，具有很强的实用价值。",
      model_used: "mock-model"
    }
  }

  private getMockChat(message: string) {
    return {
      reply: `感谢您的提问："${message}"。这是一个很有趣的想法。我建议您可以从技术可行性、市场需求和实施成本等角度来进一步分析这个方案。`,
      conversation_id: `conv_mock_${Date.now()}`,
      suggestions: [
        "这个想法有哪些潜在的技术挑战？",
        "可以从哪些角度来验证这个方案的可行性？",
        "有哪些类似的成功案例可以参考？"
      ],
      model_used: "mock-model"
    }
  }

  private getMockTags(content: string, maxTags: number) {
    const allTags = [
      { tag: "AI", confidence: 0.95, reason: "内容涉及人工智能技术" },
      { tag: "技术", confidence: 0.88, reason: "讨论技术相关话题" },
      { tag: "创新", confidence: 0.82, reason: "体现创新思维" },
      { tag: "效率", confidence: 0.75, reason: "关注效率提升" },
      { tag: "工具", confidence: 0.70, reason: "涉及工具开发" }
    ]

    return {
      suggested_tags: allTags.slice(0, maxTags),
      model_used: "mock-model"
    }
  }

  private getMockBrief(date: string, categories: string[]) {
    return {
      date,
      summary: "今日科技界关注焦点集中在AI技术突破和区块链应用创新...",
      news: [
        {
          id: 1,
          title: "AI技术在医疗领域的应用",
          summary: "AI技术正在改变医疗行业的方方面面，从疾病诊断到药物研发...",
          url: "https://example.com/ai-in-healthcare",
          tags: ["AI", "医疗"],
          importance: 4
        },
        {
          id: 2,
          title: "区块链技术在金融领域的应用",
          summary: "区块链技术正在为金融行业带来革命性的变革...",
          url: "https://example.com/blockchain-in-finance",
          tags: ["区块链", "金融"],
          importance: 3
        }
      ],
      categories,
      generated_by: "mock-model"
    }
  }
}

export const openRouterService = new OpenRouterService()
