# 灵感绿洲 - 部署指南

## 📋 部署概览

本项目包含前端（Next.js）和后端（Node.js + Express）两个部分，推荐使用以下部署方案：

- **前端**: Vercel（推荐）或 Netlify
- **后端**: Railway（推荐）、Render 或 Heroku
- **数据库**: Supabase（已配置）

## 🚀 快速部署步骤

### 1. 前端部署（Vercel）

#### 步骤 1: 准备代码
```bash
# 确保前端构建正常
npm run build
```

#### 步骤 2: 部署到 Vercel
1. 访问 [Vercel](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 导入你的 GitHub 仓库
5. 配置项目设置：
   - Framework Preset: Next.js
   - Root Directory: `./`（项目根目录）
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### 步骤 3: 配置环境变量
在 Vercel 项目设置中添加以下环境变量：
```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_NAME=灵感绿洲
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
```

### 2. 后端部署（Railway）

#### 步骤 1: 准备后端代码
```bash
cd backend
# 注意：由于TypeScript编译错误，我们需要先修复代码或使用JavaScript版本
```

#### 步骤 2: 部署到 Railway
1. 访问 [Railway](https://railway.app)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择 "Deploy from GitHub repo"
5. 选择你的仓库
6. 配置项目设置：
   - Root Directory: `backend`
   - Build Command: `npm run build`
   - Start Command: `npm start`

#### 步骤 3: 配置环境变量
在 Railway 项目设置中添加以下环境变量：
```
NODE_ENV=production
PORT=3002
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:6543/postgres?pgbouncer=true
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
JWT_SECRET=[generate-strong-secret]
JWT_REFRESH_SECRET=[generate-strong-refresh-secret]
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

## 🔧 替代部署方案

### 前端替代方案

#### Netlify 部署
1. 访问 [Netlify](https://netlify.com)
2. 拖拽 `out` 文件夹到部署区域
3. 或连接 GitHub 仓库自动部署

### 后端替代方案

#### Render 部署
1. 访问 [Render](https://render.com)
2. 创建新的 Web Service
3. 连接 GitHub 仓库
4. 配置构建和启动命令

#### Heroku 部署
```bash
# 安装 Heroku CLI
npm install -g heroku

# 登录 Heroku
heroku login

# 创建应用
heroku create your-app-name

# 设置环境变量
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=your-database-url

# 部署
git push heroku main
```

## 🔐 环境变量配置

### 必需的环境变量

#### 前端 (.env.production)
- `NEXT_PUBLIC_API_URL`: 后端API地址
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase项目URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase匿名密钥

#### 后端 (.env.production)
- `DATABASE_URL`: Supabase数据库连接字符串
- `JWT_SECRET`: JWT签名密钥（强密码）
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase服务角色密钥
- `CORS_ORIGIN`: 前端域名

### 可选的环境变量
- `OPENROUTER_API_KEY`: AI功能API密钥
- `REDIS_URL`: Redis缓存URL
- `GOOGLE_ANALYTICS_ID`: 谷歌分析ID

## 🧪 部署前检查清单

### 前端检查
- [ ] `npm run build` 构建成功
- [ ] 所有环境变量已配置
- [ ] API接口地址正确
- [ ] 移动端适配正常

### 后端检查
- [ ] 数据库连接正常
- [ ] 所有环境变量已配置
- [ ] CORS设置正确
- [ ] JWT密钥安全性

### 数据库检查
- [ ] Supabase项目已创建
- [ ] 数据表结构正确
- [ ] RLS策略已配置
- [ ] 权限设置正确

## 🔍 部署后验证

### 前端验证
1. 访问部署的前端URL
2. 检查页面加载正常
3. 测试移动端响应式设计
4. 验证API调用正常

### 后端验证
1. 访问 `https://your-backend-url/health`
2. 测试用户注册/登录功能
3. 验证数据库操作正常
4. 检查日志输出

## 🚨 常见问题解决

### 构建失败
- 检查Node.js版本兼容性
- 确认所有依赖已安装
- 检查TypeScript类型错误

### 环境变量问题
- 确认变量名拼写正确
- 检查变量值格式
- 验证密钥有效性

### CORS错误
- 检查后端CORS配置
- 确认前端域名正确
- 验证协议（http/https）匹配

### 数据库连接问题
- 检查Supabase连接字符串
- 验证数据库权限
- 确认网络连接正常

## 📞 技术支持

如果在部署过程中遇到问题，请检查：
1. 控制台错误日志
2. 网络请求状态
3. 环境变量配置
4. 数据库连接状态

---

**注意**: 请确保在生产环境中使用强密码和安全的API密钥，定期更新依赖包以保持安全性。