# GitHub 仓库创建和推送指南

## 第一步：创建 GitHub 仓库

1. **登录 GitHub**
   - 访问 [github.com](https://github.com)
   - 使用您的账号登录

2. **创建新仓库**
   - 点击右上角的 "+" 按钮
   - 选择 "New repository"
   - 或直接访问：https://github.com/new

3. **配置仓库信息**
   - **Repository name**: `灵感绿洲` 或 `inspiration-oasis`
   - **Description**: `一个现代化的灵感管理和创意协作平台`
   - **Visibility**: 选择 Public 或 Private（根据需要）
   - **不要勾选**：
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
   - 点击 "Create repository"

## 第二步：推送本地代码到 GitHub

### 方法一：使用 HTTPS（推荐）

```bash
# 添加远程仓库（替换 YOUR_USERNAME 为您的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/灵感绿洲.git

# 推送代码到 GitHub
git branch -M main
git push -u origin main
```

### 方法二：使用 SSH（需要配置 SSH 密钥）

```bash
# 添加远程仓库（替换 YOUR_USERNAME 为您的 GitHub 用户名）
git remote add origin git@github.com:YOUR_USERNAME/灵感绿洲.git

# 推送代码到 GitHub
git branch -M main
git push -u origin main
```

## 第三步：验证推送成功

1. 刷新您的 GitHub 仓库页面
2. 确认所有文件都已上传
3. 检查 README.md 是否正确显示

## 第四步：配置部署平台

### Vercel 部署（前端）

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择您刚创建的 "灵感绿洲" 仓库
5. 配置环境变量：
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. 点击 "Deploy"

### Railway 部署（后端）

1. 访问 [railway.app](https://railway.app)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择 "Deploy from GitHub repo"
5. 选择您的 "灵感绿洲" 仓库
6. 设置根目录为 `backend`
7. 配置环境变量：
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`

## 常见问题解决

### 1. 推送时要求输入用户名和密码

如果使用 HTTPS 方式推送，GitHub 现在要求使用 Personal Access Token 而不是密码：

1. 访问 GitHub Settings > Developer settings > Personal access tokens
2. 生成新的 token
3. 在推送时使用 token 作为密码

### 2. 仓库名包含中文字符

如果担心中文字符兼容性，可以使用英文名：

```bash
# 使用英文仓库名
git remote add origin https://github.com/YOUR_USERNAME/inspiration-oasis.git
```

### 3. 检查当前远程仓库配置

```bash
# 查看当前远程仓库
git remote -v

# 如果需要修改远程仓库地址
git remote set-url origin https://github.com/YOUR_USERNAME/NEW_REPO_NAME.git
```

## 下一步

完成 GitHub 仓库创建后，您就可以：

1. ✅ 在 Vercel 等平台看到您的仓库
2. ✅ 配置自动部署
3. ✅ 与团队成员协作开发
4. ✅ 使用 GitHub Actions 进行 CI/CD

---

**注意**：请确保不要将 `.env` 文件推送到 GitHub，敏感信息应该在部署平台的环境变量中配置。