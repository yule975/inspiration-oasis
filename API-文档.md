# 灵感绿洲 API 文档

## 📋 接口概览

### 🌟 灵感墙相关
- `GET /api/ideas` - 获取灵感列表
- `POST /api/ideas` - 发布新灵感
- `GET /api/ideas/:id` - 获取灵感详情
- `PUT /api/ideas/:id` - 更新灵感
- `DELETE /api/ideas/:id` - 删除灵感
- `POST /api/ideas/:id/like` - 点赞/取消点赞
- `GET /api/ideas/:id/comments` - 获取评论
- `POST /api/ideas/:id/comments` - 添加评论
- `POST /api/ideas/:id/archive` - 归档到资产库

### 💎 资产库相关
- `GET /api/assets` - 获取资产列表
- `POST /api/assets` - 创建新资产
- `GET /api/assets/:id` - 获取资产详情
- `PUT /api/assets/:id` - 更新资产
- `DELETE /api/assets/:id` - 删除资产
- `GET /api/assets/categories` - 获取分类列表

### 🤖 AI服务相关
- `POST /api/ai/enhance` - AI内容增强
- `POST /api/ai/summarize` - 智能总结
- `POST /api/ai/chat` - AI对话
- `POST /api/ai/tags/suggest` - 标签推荐
- `GET /api/ai/brief/daily` - 每日AI简报

### 📊 数据分析相关
- `GET /api/analytics/dashboard` - 仪表板数据
- `GET /api/analytics/trends` - 趋势分析
- `GET /api/analytics/insights` - AI洞察报告

### 🏷️ 其他功能
- `GET /api/tags` - 获取标签列表
- `POST /api/upload` - 文件上传

---

## 🌟 灵感墙接口详情

### 获取灵感列表
```http
GET /api/ideas
```

**查询参数:**
- `page` (number): 页码，默认1
- `limit` (number): 每页数量，默认20，最大100
- `sort` (string): 排序方式 `latest` | `popular` | `likes`
- `tags` (string): 标签筛选，多个用逗号分隔
- `author` (string): 按作者筛选
- `search` (string): 关键词搜索

**响应示例:**
```json
{
  "success": true,
  "data": {
    "ideas": [
      {
        "id": 1,
        "content": "创建一个AI助手，可以根据用户输入的内容，自动生成文章大纲和初稿。",
        "author": {
          "id": 1,
          "name": "张三",
          "avatar": "https://api.example.com/avatars/user_1.jpg"
        },
        "tags": ["AI", "写作", "效率"],
        "likes_count": 15,
        "comments_count": 3,
        "is_liked": false,
        "created_at": "2023-11-16T10:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_pages": 8,
      "has_next": true,
      "has_prev": false
    },
    "total": 156
  }
}
```

### 发布新灵感
```http
POST /api/ideas
```

**请求体:**
```json
{
  "content": "创建一个AI助手，可以根据用户输入的内容，自动生成文章大纲和初稿。",
  "tags": ["AI", "写作", "效率"],
  "attachments": ["file_123", "file_456"]
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "content": "...",
    "author": {...},
    "tags": [...],
    "created_at": "2023-11-16T12:00:00Z"
  },
  "message": "灵感发布成功"
}
```

### 点赞/取消点赞
```http
POST /api/ideas/:id/like
```

**响应:**
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likes_count": 16
  }
}
```

### 添加评论
```http
POST /api/ideas/:id/comments
```

**请求体:**
```json
{
  "content": "这个想法很有创意，可以考虑结合更多的应用场景。",
  "parent_id": null
}
```

### 归档到资产库
```http
POST /api/ideas/:id/archive
```

**请求体:**
```json
{
  "title": "AI写作助手创意方案",
  "description": "基于AI技术的智能写作助手实现方案",
  "category": "创意方案"
}
```

---

## 💎 资产库接口详情

### 获取资产列表
```http
GET /api/assets
```

**查询参数:**
- `page`, `limit` - 分页参数
- `category` (string): 分类筛选 `Prompts` | `工具技巧` | `深度分析`
- `view` (string): 视图类型 `team` | `personal`
- `tags` (string): 标签筛选
- `search` (string): 关键词搜索

**响应示例:**
```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "id": 1,
        "title": "AI写作助手Prompt",
        "description": "一个可以生成文章大纲和初稿的Prompt模板。",
        "category": "Prompts",
        "tags": ["AI", "写作"],
        "author": {
          "id": 1,
          "name": "张三"
        },
        "download_count": 25,
        "created_at": "2023-11-15T00:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

### 创建新资产
```http
POST /api/assets
```

**请求体:**
```json
{
  "title": "智能推荐系统设计方案",
  "description": "基于协同过滤和内容推荐的混合推荐系统实现方案",
  "category": "技术方案",
  "tags": ["推荐系统", "机器学习", "算法"],
  "content": "详细的设计方案内容...",
  "attachments": ["file_123"]
}
```

---

## 🤖 AI服务接口详情

### AI内容增强
```http
POST /api/ai/enhance
```

**请求体:**
```json
{
  "content": "创建一个AI助手",
  "type": "expand",
  "context": "技术产品开发"
}
```

**增强类型:**
- `optimize` - 优化表达
- `expand` - 扩展思路  
- `tone` - 润色语气

**响应:**
```json
{
  "success": true,
  "data": {
    "original_content": "创建一个AI助手",
    "enhanced_content": "创建一个AI助手，可以根据用户输入的内容，自动生成文章大纲和初稿。此外，这个想法还可以扩展到更多应用场景，如代码生成、创意写作、技术文档编写等。",
    "enhancement_type": "expand",
    "suggestions": ["考虑添加多语言支持", "集成实时协作功能"]
  }
}
```

### 智能总结
```http
POST /api/ai/summarize
```

**请求体:**
```json
{
  "content": "需要总结的长文本内容...",
  "summary_type": "brief"
}
```

**总结类型:**
- `brief` - 简洁总结
- `detailed` - 详细分析
- `key_points` - 关键要点

**响应:**
```json
{
  "success": true,
  "data": {
    "summary": "核心观点：AI助手在提升工作效率方面具有重要作用",
    "key_points": ["AI技术应用", "效率提升", "自动化流程"],
    "insights": "这个想法强调了AI在提升工作效率方面的重要作用，具有很强的实用价值。"
  }
}
```

### AI对话
```http
POST /api/ai/chat
```

**请求体:**
```json
{
  "message": "针对这个AI助手想法，你有什么建议？",
  "context": "关于AI写作助手的讨论",
  "conversation_id": "conv_12345"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "reply": "这个AI助手想法很有潜力。建议考虑以下几个方面：1. 用户体验设计...",
    "conversation_id": "conv_12345",
    "suggestions": ["如何提高AI助手的准确性？", "有哪些类似的竞品分析？"]
  }
}
```

### 标签推荐
```http
POST /api/ai/tags/suggest
```

**请求体:**
```json
{
  "content": "创建一个AI助手，可以自动生成文章",
  "max_tags": 5
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "suggested_tags": [
      {
        "tag": "AI",
        "confidence": 0.95,
        "reason": "内容中多次提及人工智能相关技术"
      },
      {
        "tag": "写作",
        "confidence": 0.88,
        "reason": "涉及文章生成和写作辅助功能"
      }
    ]
  }
}
```

### 每日AI简报
```http
GET /api/ai/brief/daily
```

**查询参数:**
- `date` (string): 指定日期，格式 YYYY-MM-DD
- `categories` (string): 关注分类，多个用逗号分隔

**响应:**
```json
{
  "success": true,
  "data": {
    "date": "2023-11-16",
    "summary": "今日科技界关注焦点集中在AI技术突破和区块链应用创新...",
    "news": [
      {
        "id": 1,
        "title": "AI技术在医疗领域的应用",
        "summary": "AI技术正在改变医疗行业的方方面面...",
        "url": "https://example.com/ai-in-healthcare",
        "tags": ["AI", "医疗"],
        "importance": 4
      }
    ]
  }
}
```

---

## 📊 数据分析接口详情

### 仪表板统计数据
```http
GET /api/analytics/dashboard
```

**查询参数:**
- `period` (string): 统计周期 `day` | `week` | `month` | `year`

**响应:**
```json
{
  "success": true,
  "data": {
    "total_ideas": 125,
    "total_assets": 88,
    "active_users": 320,
    "top_contributor": "李四",
    "growth_stats": {
      "ideas_growth": "+12%",
      "assets_growth": "+8%",
      "users_growth": "+5%"
    }
  }
}
```

### 趋势分析
```http
GET /api/analytics/trends
```

**响应:**
```json
{
  "success": true,
  "data": {
    "hot_topics": [
      {
        "topic": "GPT-4",
        "count": 56,
        "trend": "+12%",
        "sentiment": "positive"
      }
    ],
    "emerging_trends": [
      {
        "trend": "AI安全",
        "growth": "+25%",
        "description": "随着AI技术的普及，AI安全问题越来越受到关注。",
        "related_tags": ["AI", "安全", "隐私"]
      }
    ]
  }
}
```

### AI洞察报告
```http
GET /api/analytics/insights
```

**查询参数:**
- `type` (string): 洞察类型 `content_quality` | `user_behavior` | `trend_prediction`

**响应:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "content_quality",
        "title": "内容质量分析",
        "description": "本周高质量内容主要集中在实用工具和技术深度解析类别",
        "recommendations": [
          "建议团队继续关注实用工具方向",
          "增加技术深度分析的投入"
        ]
      }
    ],
    "generated_at": "2023-11-16T12:00:00Z"
  }
}
```

---

## 🏷️ 其他接口

### 获取标签列表
```http
GET /api/tags
```

**查询参数:**
- `sort` (string): 排序方式 `usage` | `alphabetical` | `recent`
- `limit` (number): 返回数量限制

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "AI",
      "usage_count": 45,
      "created_at": "2023-11-01T00:00:00Z"
    }
  ]
}
```

### 文件上传
```http
POST /api/upload
```

**请求类型:** `multipart/form-data`

**表单字段:**
- `file` - 上传的文件
- `type` - 文件类型 `image` | `document` | `other`

**响应:**
```json
{
  "success": true,
  "data": {
    "file_id": "file_123456",
    "file_name": "design-mockup.png",
    "file_size": 1024000,
    "file_type": "image/png",
    "file_url": "https://api.example.com/files/file_123456"
  }
}
```

---

## 🔐 认证说明

**临时方案（开发阶段）:**
```http
X-API-Key: your_api_key_here
```

**用户标识（简化方案）:**
```http
X-User-ID: user_123
```

---

## ❌ 错误响应格式

所有错误响应都遵循统一格式：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": ["content字段不能为空"]
  }
}
```

**常见错误码:**
- `VALIDATION_ERROR` - 参数验证失败
- `NOT_FOUND` - 资源不存在
- `UNAUTHORIZED` - 未授权访问
- `AI_SERVICE_UNAVAILABLE` - AI服务不可用
- `RATE_LIMIT_EXCEEDED` - 请求频率超限

---

## 📝 开发说明

1. **基础URL:** `http://localhost:3001/api` (开发环境)
2. **Content-Type:** `application/json`
3. **字符编码:** UTF-8
4. **时间格式:** ISO 8601 (UTC)
5. **分页:** 基于页码的分页，从1开始
