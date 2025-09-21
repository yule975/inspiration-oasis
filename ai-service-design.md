# 灵感绿洲 - AI服务设计方案
## 基于 OpenRouter API 集成

### 🎯 OpenRouter 简介
OpenRouter 是一个AI模型路由服务，提供统一API访问多种主流AI模型：
- **GPT系列**: GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude-3-opus, Claude-3-sonnet, Claude-3-haiku  
- **Google**: Gemini-pro
- **开源模型**: Llama-2, Mistral等

### 🔧 技术架构设计

#### 1. AI服务层架构
```
前端请求 → 后端API → AI服务中间层 → OpenRouter API → AI模型 → 响应链路
```

#### 2. 核心组件设计

**AI Service Manager (AI服务管理器)**
```javascript
class AIServiceManager {
  constructor() {
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY
    this.defaultModel = "openai/gpt-3.5-turbo"  // 默认模型
    this.baseURL = "https://openrouter.ai/api/v1"
  }
  
  // 模型选择策略
  selectModel(taskType, complexity = 'normal') {
    const modelMap = {
      'enhance': {
        simple: 'openai/gpt-3.5-turbo',      // 内容优化
        complex: 'openai/gpt-4'              // 复杂增强
      },
      'summarize': {
        simple: 'anthropic/claude-3-haiku',   // 快速总结
        complex: 'anthropic/claude-3-sonnet'  // 深度分析
      },
      'chat': {
        simple: 'openai/gpt-3.5-turbo',
        complex: 'anthropic/claude-3-opus'    // 深度对话
      },
      'tags': {
        simple: 'openai/gpt-3.5-turbo',      // 标签推荐
        complex: 'openai/gpt-3.5-turbo'
      },
      'analyze': {
        simple: 'anthropic/claude-3-sonnet',  // 趋势分析
        complex: 'openai/gpt-4'
      }
    }
    
    return modelMap[taskType]?.[complexity] || this.defaultModel
  }
}
```

#### 3. 具体功能实现

##### A. 内容增强服务
```javascript
// POST /api/ai/enhance
async function enhanceContent(content, type, context) {
  const model = aiService.selectModel('enhance', 
    content.length > 500 ? 'complex' : 'simple'
  )
  
  const prompts = {
    optimize: `请优化以下内容的表达，使其更加清晰准确：\n\n${content}`,
    expand: `请扩展以下想法，提供更多细节和应用场景：\n\n${content}`,
    tone: `请润色以下内容的语气，使其更加专业和友好：\n\n${content}`
  }
  
  const response = await openRouterRequest({
    model: model,
    messages: [
      {
        role: "system", 
        content: "你是一个专业的内容编辑助手，擅长优化和改进文本内容。"
      },
      {
        role: "user", 
        content: prompts[type]
      }
    ],
    max_tokens: 1000,
    temperature: 0.7
  })
  
  return {
    original_content: content,
    enhanced_content: response.choices[0].message.content,
    enhancement_type: type,
    model_used: model,
    suggestions: await generateSuggestions(content, type)
  }
}
```

##### B. 智能总结服务
```javascript
// POST /api/ai/summarize  
async function summarizeContent(content, summaryType = 'brief') {
  const model = aiService.selectModel('summarize', 
    summaryType === 'detailed' ? 'complex' : 'simple'
  )
  
  const systemPrompts = {
    brief: "提供简洁的核心观点总结",
    detailed: "提供详细的分析总结，包含关键要点和洞察",
    key_points: "提取3-5个关键要点，以列表形式呈现"
  }
  
  const response = await openRouterRequest({
    model: model,
    messages: [
      {
        role: "system",
        content: `你是一个专业的内容分析师。${systemPrompts[summaryType]}`
      },
      {
        role: "user",
        content: `请分析以下内容：\n\n${content}`
      }
    ],
    max_tokens: 800,
    temperature: 0.3
  })
  
  // 并行提取关键点和洞察
  const [keyPoints, insights] = await Promise.all([
    extractKeyPoints(content),
    generateInsights(content)
  ])
  
  return {
    summary: response.choices[0].message.content,
    key_points: keyPoints,
    insights: insights,
    model_used: model
  }
}
```

##### C. AI对话服务
```javascript
// POST /api/ai/chat
async function chatWithAI(message, context, conversationId) {
  const model = aiService.selectModel('chat', 
    message.length > 200 ? 'complex' : 'simple'
  )
  
  // 获取对话历史
  const conversation = await getConversationHistory(conversationId)
  
  const messages = [
    {
      role: "system",
      content: `你是灵感绿洲的AI助手，专门帮助用户深入分析创意想法。
      当前讨论上下文：${context}
      
      请以友好、专业的方式回应用户，提供建设性的建议和深入的分析。`
    },
    ...conversation.messages,  // 历史对话
    {
      role: "user",
      content: message
    }
  ]
  
  const response = await openRouterRequest({
    model: model,
    messages: messages,
    max_tokens: 1200,
    temperature: 0.8
  })
  
  // 生成后续问题建议
  const suggestions = await generateFollowUpQuestions(message, context)
  
  // 保存对话历史
  await saveConversationMessage(conversationId, {
    user: message,
    assistant: response.choices[0].message.content
  })
  
  return {
    reply: response.choices[0].message.content,
    conversation_id: conversationId,
    suggestions: suggestions,
    model_used: model
  }
}
```

##### D. 标签推荐服务
```javascript
// POST /api/ai/tags/suggest
async function suggestTags(content, maxTags = 5) {
  const model = aiService.selectModel('tags', 'simple')
  
  const response = await openRouterRequest({
    model: model,
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
    const result = JSON.parse(response.choices[0].message.content)
    return {
      suggested_tags: result.tags.slice(0, maxTags),
      model_used: model
    }
  } catch (error) {
    // 降级处理：使用关键词提取
    return await fallbackTagExtraction(content, maxTags)
  }
}
```

##### E. 每日简报生成
```javascript
// GET /api/ai/brief/daily
async function generateDailyBrief(date, categories) {
  const model = aiService.selectModel('analyze', 'complex')
  
  // 获取当日相关新闻和趋势数据
  const [newsData, trendsData] = await Promise.all([
    fetchNewsData(date, categories),
    fetchTrendsData(date)
  ])
  
  const response = await openRouterRequest({
    model: model,
    messages: [
      {
        role: "system",
        content: `你是一个专业的科技资讯分析师。基于提供的新闻和趋势数据，生成一份简洁有价值的每日简报。
        
        简报应包含：
        1. 当日要闻总结（2-3句）
        2. 3-5条重要新闻，每条包含标题、摘要、标签、重要程度
        3. 趋势洞察和建议
        
        以JSON格式返回结果。`
      },
      {
        role: "user",
        content: `请基于以下数据生成${date}的AI简报：
        
        新闻数据：${JSON.stringify(newsData)}
        趋势数据：${JSON.stringify(trendsData)}`
      }
    ],
    max_tokens: 2000,
    temperature: 0.4
  })
  
  return parseAIBriefResponse(response.choices[0].message.content)
}
```

### 🔐 OpenRouter 集成配置

#### 1. 环境变量配置
```env
# OpenRouter API配置
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_APP_NAME=灵感绿洲
OPENROUTER_APP_URL=https://inspiration-oasis.com

# 模型配置
DEFAULT_CHAT_MODEL=openai/gpt-3.5-turbo
DEFAULT_ANALYZE_MODEL=anthropic/claude-3-sonnet
DEFAULT_ENHANCE_MODEL=openai/gpt-3.5-turbo

# 限制配置
MAX_TOKENS_PER_REQUEST=2000
RATE_LIMIT_PER_MINUTE=60
```

#### 2. 请求封装函数
```javascript
async function openRouterRequest(payload) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.OPENROUTER_APP_URL,
      'X-Title': process.env.OPENROUTER_APP_NAME,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  
  if (!response.ok) {
    throw new AIServiceError(`OpenRouter API error: ${response.status}`)
  }
  
  return await response.json()
}
```

### 💰 成本优化策略

#### 1. 模型选择策略
```javascript
const MODEL_COSTS = {
  'openai/gpt-3.5-turbo': { input: 0.001, output: 0.002 },    // 低成本
  'openai/gpt-4': { input: 0.03, output: 0.06 },             // 高质量
  'anthropic/claude-3-haiku': { input: 0.00025, output: 0.00125 }, // 极低成本
  'anthropic/claude-3-sonnet': { input: 0.003, output: 0.015 },    // 平衡
  'anthropic/claude-3-opus': { input: 0.015, output: 0.075 }       // 最高质量
}

function selectCostEffectiveModel(taskType, contentLength, userTier) {
  // 根据任务类型、内容长度和用户等级选择最合适的模型
  if (userTier === 'free' && contentLength < 500) {
    return 'anthropic/claude-3-haiku'  // 免费用户使用低成本模型
  }
  
  if (taskType === 'enhance' && contentLength < 200) {
    return 'openai/gpt-3.5-turbo'  // 简单增强任务
  }
  
  return getDefaultModelForTask(taskType)
}
```

#### 2. 缓存机制
```javascript
// 对相似请求进行缓存，减少API调用
const aiCache = new Map()

async function getCachedAIResponse(cacheKey, requestFn) {
  if (aiCache.has(cacheKey)) {
    return aiCache.get(cacheKey)
  }
  
  const response = await requestFn()
  aiCache.set(cacheKey, response)
  
  // 设置缓存过期时间
  setTimeout(() => aiCache.delete(cacheKey), 3600000) // 1小时
  
  return response
}
```

### 📊 错误处理和监控

#### 1. 错误处理
```javascript
class AIServiceError extends Error {
  constructor(message, code, details) {
    super(message)
    this.code = code
    this.details = details
  }
}

async function handleAIRequest(requestFn, fallbackFn = null) {
  try {
    return await requestFn()
  } catch (error) {
    // 记录错误
    console.error('AI Service Error:', error)
    
    // 如果有降级方案，执行降级
    if (fallbackFn) {
      return await fallbackFn()
    }
    
    throw new AIServiceError(
      'AI服务暂时不可用，请稍后重试',
      'AI_SERVICE_UNAVAILABLE',
      error.message
    )
  }
}
```

#### 2. 使用情况监控
```javascript
// 监控AI服务使用情况
const aiMetrics = {
  requestCount: 0,
  tokenUsage: 0,
  errorCount: 0,
  averageResponseTime: 0
}

function trackAIUsage(model, inputTokens, outputTokens, responseTime) {
  aiMetrics.requestCount++
  aiMetrics.tokenUsage += inputTokens + outputTokens
  aiMetrics.averageResponseTime = 
    (aiMetrics.averageResponseTime * (aiMetrics.requestCount - 1) + responseTime) / aiMetrics.requestCount
  
  // 记录到数据库或日志系统
  logAIUsage({ model, inputTokens, outputTokens, responseTime })
}
```

### 🚀 实施计划

#### 第一阶段：基础集成 (1周)
- [x] 设置OpenRouter API集成
- [ ] 实现基础的内容增强功能
- [ ] 实现简单的标签推荐
- [ ] 基础错误处理

#### 第二阶段：核心功能 (2周)  
- [ ] 智能总结服务
- [ ] AI对话功能
- [ ] 每日简报生成
- [ ] 缓存机制实现

#### 第三阶段：优化完善 (1周)
- [ ] 成本优化策略
- [ ] 性能监控
- [ ] 降级处理方案
- [ ] 用户限制和计费

这个设计方案可以充分利用OpenRouter的多模型优势，根据不同任务选择最合适的模型，在保证功能的同时控制成本。您觉得这个方案如何？
