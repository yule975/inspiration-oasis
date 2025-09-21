# Supabase数据库配置指南

## 🚀 快速配置步骤

### 1. 获取Supabase数据库连接信息

登录到 [Supabase控制台](https://app.supabase.com/) 并执行以下步骤：

1. **选择或创建项目**
   - 如果没有项目，点击 "New project" 创建新项目
   - 选择组织和项目名称：`灵感绿洲` 或 `inspirations-app`
   - 选择数据库密码（请记住这个密码）
   - 选择地区（建议选择距离您最近的地区）

2. **获取数据库URL**
   - 在项目控制台中，点击左侧菜单的 "Settings" 
   - 选择 "Database"
   - 在 "Connection string" 部分找到 "URI" 格式的连接字符串
   - 复制类似这样的URL：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

3. **获取其他必要信息**
   - **Project URL**: `https://[YOUR-PROJECT-REF].supabase.co`
   - **Anon Key**: 在 Settings > API 中找到
   - **Service Role Key**: 在 Settings > API 中找到（仅后端使用）

### 2. 配置环境变量

在 `backend/.env` 文件中添加以下配置：

```bash
# Supabase数据库配置
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase项目配置
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 其他配置保持不变
NODE_ENV=development
PORT=3001
BASE_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3000

# JWT配置
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# 密码加密
BCRYPT_SALT_ROUNDS=12

# OpenRouter AI配置（可选）
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL_DEFAULT=openai/gpt-3.5-turbo
OPENROUTER_MODEL_ENHANCE=openai/gpt-4
OPENROUTER_MODEL_SUMMARIZE=anthropic/claude-3-haiku
OPENROUTER_MODEL_CHAT=openai/gpt-4
OPENROUTER_MODEL_TAGS=openai/gpt-3.5-turbo

# Redis配置（可选，可以不配置）
REDIS_URL=

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# 日志配置
LOG_LEVEL=info
```

### 3. 示例配置

假设您的Supabase项目信息如下：
- Project Reference: `abcdefghijklmnop`
- Database Password: `mySecurePassword123`
- 那么您的配置应该是：

```bash
DATABASE_URL="postgresql://postgres:mySecurePassword123@db.abcdefghijklmnop.supabase.co:5432/postgres"
SUPABASE_URL="https://abcdefghijklmnop.supabase.co"
```

### 4. 验证连接

配置完成后，运行以下命令验证连接：

```bash
# 测试数据库连接
pnpm db:generate

# 推送数据库schema
pnpm db:push

# 查看数据库状态
pnpm db:studio
```

### 5. 安全注意事项

- ⚠️ **绝对不要**将 `.env` 文件提交到Git仓库
- 🔒 **Service Role Key** 具有完全数据库访问权限，仅在后端使用
- 🌐 **Anon Key** 用于前端，具有行级安全限制
- 🔑 使用强密码并定期更换
- 📊 定期监控Supabase控制台的使用情况

### 6. Supabase特性优势

使用Supabase的好处：
- 🚀 **即时API**: 自动生成REST和GraphQL API
- 🔒 **行级安全**: 细粒度的数据访问控制  
- 📊 **实时功能**: 内置的实时数据订阅
- 🗄️ **文件存储**: 集成的文件存储服务
- 📈 **分析面板**: 详细的使用情况分析
- 🔐 **内置认证**: 多种认证方式支持
- 🌍 **全球CDN**: 快速的全球数据访问

### 7. 故障排查

如果遇到连接问题：

1. **检查URL格式**：确保没有多余的空格或字符
2. **验证密码**：确保密码中的特殊字符正确转义
3. **检查网络**：确保能访问Supabase服务
4. **查看日志**：检查Supabase控制台的日志记录
5. **联系支持**：Supabase有很好的社区支持

配置完成后，您就可以享受Supabase提供的强大功能了！
