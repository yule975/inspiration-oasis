# Vercel 部署指南

## 概述
您的项目已成功推送到 GitHub 仓库：`https://github.com/yule975/inspiration-oasis`

现在可以通过 Vercel 进行部署，享受自动化的持续集成和部署服务。

## 部署步骤

### 1. 访问 Vercel
前往 [Vercel 官网](https://vercel.com) 并登录您的账户。

### 2. 导入项目
1. 点击 "New Project" 按钮
2. 选择 "Import Git Repository"
3. 输入您的仓库地址：`https://github.com/yule975/inspiration-oasis`
4. 或者直接从 GitHub 集成中选择 `inspiration-oasis` 仓库

### 3. 配置项目设置
- **Framework Preset**: Vite
- **Root Directory**: `./` (项目根目录)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. 环境变量配置

#### 4.1 必需的环境变量
您的项目需要配置以下环境变量才能正常运行。请在 Vercel 项目设置中添加：

1. 进入项目设置页面
2. 选择 "Environment Variables" 选项卡
3. 逐个添加以下环境变量：

#### 4.2 核心配置变量

```bash
# 应用环境
NODE_ENV=production

# 应用基础URL（替换为你的 Vercel 域名）
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app

# API基础URL
NEXT_PUBLIC_API_URL=https://your-project.vercel.app
```

#### 4.3 Supabase 配置（必需）

```bash
# Supabase 项目URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase 匿名密钥
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase 服务角色密钥（敏感）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**获取 Supabase 密钥：**
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 进入 Settings > API
4. 复制 URL 和 API Keys

#### 4.4 数据库配置

```bash
# 数据库连接URL（从 Supabase 获取）
DATABASE_URL=postgresql://postgres.your-project:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# 直接连接URL
DIRECT_URL=postgresql://postgres.your-project:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**获取数据库URL：**
1. 在 Supabase Dashboard 中
2. 进入 Settings > Database
3. 复制 Connection string

#### 4.5 安全配置

```bash
# JWT密钥（生产环境使用强密码）
JWT_SECRET=your_super_strong_jwt_secret_min_32_characters

# JWT过期时间
JWT_EXPIRES_IN=7d
```

#### 4.6 可选配置

```bash
# 文件存储
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=attachments
MAX_FILE_SIZE=10

# AI功能（可选）
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo

# 监控分析
NEXT_PUBLIC_VERCEL_ANALYTICS=true

# 安全设置
CORS_ORIGIN=https://your-project.vercel.app
RATE_LIMIT_MAX=1000
LOG_LEVEL=warn
```

#### 4.7 一键复制模板

为了方便配置，您可以使用项目根目录下的 `.env.production.example` 文件作为模板：

1. 打开 `.env.production.example` 文件
2. 复制所需的环境变量
3. 在 Vercel Dashboard 中逐个添加
4. 替换占位符为真实值

#### 4.8 环境变量安全提醒

⚠️ **重要安全提醒：**
- 所有以 `NEXT_PUBLIC_` 开头的变量会暴露给客户端
- 敏感信息（如密钥、密码）不要使用 `NEXT_PUBLIC_` 前缀
- 使用强密码和复杂的 JWT 密钥
- 定期轮换密钥以确保安全
- 不要在代码中硬编码敏感信息

### 5. 部署
点击 "Deploy" 按钮开始部署。Vercel 将自动：
- 克隆您的仓库
- 安装依赖
- 构建项目
- 部署到全球 CDN

## 自动部署

配置完成后，每次您向 `main` 分支推送代码时，Vercel 都会自动触发新的部署。

## 自定义域名

部署成功后，您可以：
1. 使用 Vercel 提供的免费域名（如：`inspiration-oasis.vercel.app`）
2. 配置自定义域名：
   - 在项目设置中选择 "Domains"
   - 添加您的自定义域名
   - 按照指引配置 DNS 记录

## 项目配置文件

您的项目已包含 `vercel.json` 配置文件：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install"
}
```

## 常见问题

### 构建失败
- 检查 `package.json` 中的构建脚本
- 确保所有依赖都已正确安装
- 查看 Vercel 构建日志获取详细错误信息

### 路由问题
如果是单页应用（SPA），可能需要在 `vercel.json` 中添加重写规则：

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### API 路由
如果项目包含 API 路由，确保：
- API 文件位于 `api/` 目录下
- 使用正确的 Vercel Serverless Functions 格式

## 监控和分析

Vercel 提供：
- 实时部署状态
- 性能分析
- 访问统计
- 错误监控

## 下一步

1. 完成 Vercel 部署
2. 测试部署的应用功能
3. 配置自定义域名（可选）
4. 设置监控和分析
5. 享受自动化的 CI/CD 流程！

---

**提示**: 如果在部署过程中遇到问题，请查看 Vercel 的[官方文档](https://vercel.com/docs)或联系技术支持。