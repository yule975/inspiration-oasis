# 灵感绿洲后端服务

基于 Node.js + Express + TypeScript + PostgreSQL + Prisma 构建的现代化API服务。

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- PostgreSQL >= 13
- Redis (可选，用于缓存)
- pnpm (推荐) 或 npm

### 安装依赖
```bash
cd backend
pnpm install
```

### 环境配置
1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 配置 `.env` 文件：
```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/inspiration_oasis"

# OpenRouter API配置
OPENROUTER_API_KEY=your_openrouter_api_key_here

# 其他配置...
```

### 数据库设置
```bash
# 生成Prisma客户端
pnpm db:generate

# 推送数据库结构（开发环境）
pnpm db:push

# 或使用迁移（生产环境推荐）
pnpm db:migrate

# 查看数据库
pnpm db:studio
```

### 启动服务
```bash
# 开发模式（热重载）
pnpm dev

# 生产模式
pnpm build
pnpm start
```

服务将在 `http://localhost:3001` 启动。

## 📋 API接口

查看详细的API文档：[API-文档.md](../API-文档.md)

### 主要端点：
- `GET /health` - 健康检查
- `GET /api` - API信息
- `GET /api/ideas` - 获取灵感列表
- `POST /api/ideas` - 发布新灵感
- `POST /api/ai/enhance` - AI内容增强
- `POST /api/ai/chat` - AI对话
- `GET /api/analytics/dashboard` - 数据统计

## 🔧 技术架构

### 核心技术栈
- **Express.js** - Web框架
- **TypeScript** - 类型安全
- **Prisma** - 现代化ORM
- **PostgreSQL** - 主数据库
- **Redis** - 缓存（可选）
- **Zod** - 数据验证

### 项目结构
```
backend/
├── src/
│   ├── config/          # 配置文件
│   │   ├── database.ts  # 数据库连接
│   │   └── redis.ts     # Redis配置
│   ├── controllers/     # 控制器
│   ├── middleware/      # 中间件
│   ├── routes/          # 路由定义
│   ├── services/        # 业务逻辑
│   └── index.ts         # 应用入口
├── prisma/
│   └── schema.prisma    # 数据库模型
└── package.json
```

### AI服务集成
- **OpenRouter API** - 多模型AI服务
- **智能模型选择** - 根据任务自动选择最适合的AI模型
- **缓存机制** - 减少API调用成本
- **降级处理** - API异常时提供模拟数据

## 🛡️ 安全特性

- **请求频率限制** - 防止API滥用
- **输入验证** - Zod严格参数验证
- **错误处理** - 统一错误响应格式
- **CORS配置** - 跨域安全控制
- **Helmet** - 基础安全头设置

## 📊 监控和日志

- **请求日志** - 自动记录API调用
- **错误跟踪** - 详细错误信息记录
- **性能监控** - 响应时间统计
- **健康检查** - 服务状态监控

## 🧪 开发工具

### 数据库管理
```bash
# 查看数据库（Web界面）
pnpm db:studio

# 重置数据库
pnpm db:push --force-reset

# 查看迁移状态
pnpm db:migrate status
```

### 代码质量
```bash
# 代码检查
pnpm lint

# 自动修复
pnpm lint:fix

# 运行测试
pnpm test

# 测试监控模式
pnpm test:watch
```

## 🚧 当前状态

### ✅ 已完成功能
- [x] 基础架构搭建
- [x] 灵感墙完整功能（CRUD、点赞、评论、归档）
- [x] AI服务集成（内容增强、总结、对话、标签推荐）
- [x] 简化认证系统（开发用）
- [x] 数据缓存机制
- [x] 错误处理和日志
- [x] API文档

### 🔄 开发中功能
- [ ] 资产库完整功能
- [ ] 数据分析和趋势统计
- [ ] 文件上传处理
- [ ] 实时通知功能

### 📝 待开发功能
- [ ] 完整的用户认证系统
- [ ] 高级权限控制
- [ ] 单元测试用例
- [ ] API性能优化
- [ ] 部署配置

## 🔑 认证说明

**当前版本使用简化认证（开发阶段）：**

```bash
# 请求头示例
curl -H "X-User-ID: user_123" \
     -H "X-User-Name: 张三" \
     -H "Content-Type: application/json" \
     http://localhost:3001/api/ideas
```

**生产环境将升级为：**
- JWT Token认证
- OAuth2.0 SSO集成
- 角色权限管理
- 会话管理

## 🤖 AI功能说明

### OpenRouter集成
- 支持多种主流AI模型
- 智能模型选择策略
- 成本优化配置
- 自动降级处理

### 功能特性
- **内容增强**: 优化表达、扩展思路、润色语气
- **智能总结**: 提取关键信息和洞察
- **AI对话**: 深度分析和建议
- **标签推荐**: 自动分类和标记
- **每日简报**: AI生成的资讯摘要

## 📞 问题排查

### 常见问题

**1. 数据库连接失败**
```bash
# 检查PostgreSQL服务状态
pg_ctl status

# 检查连接字符串
echo $DATABASE_URL
```

**2. AI服务不可用**
```bash
# 检查OpenRouter API密钥
echo $OPENROUTER_API_KEY

# 查看AI服务日志
tail -f logs/ai-service.log
```

**3. Redis连接失败**
```bash
# 检查Redis服务
redis-cli ping

# 应用会自动降级到内存缓存
```

### 调试模式
```bash
# 启用详细日志
NODE_ENV=development pnpm dev

# 查看数据库查询
# Prisma会自动输出SQL查询日志
```

## 📈 性能优化

### 已实现优化
- [x] 数据库查询优化
- [x] Redis缓存机制
- [x] API响应压缩
- [x] 并发请求处理

### 计划中优化
- [ ] 数据库索引优化
- [ ] 查询结果分页
- [ ] CDN文件服务
- [ ] 负载均衡配置

## 🚀 部署指南

### Docker部署（推荐）
```bash
# 构建镜像
docker build -t inspiration-oasis-backend .

# 运行容器
docker run -p 3001:3001 inspiration-oasis-backend
```

### 云服务部署
- **Vercel** - 无服务器部署
- **Railway** - 一键部署
- **Heroku** - 容器部署
- **AWS/阿里云** - 传统部署

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 开启 Pull Request

## 📧 联系方式

- 项目地址: [GitHub Repository]
- 文档地址: [API Documentation]
- 问题反馈: [Issues]
