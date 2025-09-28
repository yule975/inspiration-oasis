# 📋 Vercel 环境变量完整配置指南

## 👋 欢迎！这是您的第一次配置指南

这份指南专门为初学者准备，每个步骤都会详细说明，所有数据都可以直接复制粘贴！

---

## 🎯 第一步：理解环境变量

**什么是环境变量？**
- 就像是给应用程序的"配置文件"
- 告诉程序连接哪个数据库、使用哪个邮箱服务等
- 在 Vercel 中，我们需要手动添加这些配置

---

## 📝 第二步：完整环境变量列表（直接复制）

### ✅ 必需配置（一定要添加的14个变量）

#### **1. 应用基础配置**
```
变量名: NODE_ENV
变量值: production
```

```
变量名: NEXT_PUBLIC_APP_URL
变量值: https://inspiration-oasis.vercel.app
```

```
变量名: NEXT_PUBLIC_API_URL
变量值: https://inspiration-oasis.vercel.app
```

#### **2. 数据库配置（Supabase）**
```
变量名: NEXT_PUBLIC_SUPABASE_URL
变量值: https://knldinavbpqyyautgmaz.supabase.co
```

```
变量名: NEXT_PUBLIC_SUPABASE_ANON_KEY
变量值: <your_supabase_anon_key>
```

```
变量名: SUPABASE_SERVICE_ROLE_KEY
变量值: <your_supabase_service_role_key>
```

```
变量名: DATABASE_URL
变量值: <your_database_url>
```

```
变量名: DIRECT_URL
变量值: <your_direct_url>
```

#### **3. 用户登录安全配置**
```
变量名: JWT_SECRET
变量值: <your_jwt_secret>
```

```
变量名: JWT_EXPIRES_IN
变量值: 7d
```

#### **4. 邮箱验证码服务（阿里云）**
```
变量名: ALIYUN_ACCESS_KEY_ID
变量值: <your_aliyun_access_key_id>
```

```
变量名: ALIYUN_ACCESS_KEY_SECRET
变量值: <your_aliyun_access_key_secret>
```

```
变量名: ALIYUN_FROM_ADDRESS
变量值: support@mail.mydevlab88.top
```

```
变量名: ALIYUN_FROM_NAME
变量值: 灵感绿洲
```

### 🔶 推荐配置（建议添加，让应用更完善）

```
变量名: NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET
变量值: attachments
```

```
变量名: MAX_FILE_SIZE
变量值: 10
```

```
变量名: NEXT_PUBLIC_VERCEL_ANALYTICS
变量值: true
```

```
变量名: CORS_ORIGIN
变量值: https://inspiration-oasis.vercel.app
```

```
变量名: RATE_LIMIT_MAX
变量值: 1000
```

```
变量名: LOG_LEVEL
变量值: warn
```

---

## 🚀 第三步：在 Vercel 中添加环境变量

### **详细操作步骤：**

#### **步骤1：登录 Vercel**
1. 打开浏览器，访问 [vercel.com](https://vercel.com)
2. 点击右上角 "Log in" 按钮
3. 选择 "Continue with GitHub"
4. 输入您的 GitHub 账号和密码

#### **步骤2：导入您的项目**
1. 登录后，点击 "New Project" 按钮
2. 找到 "inspiration-oasis" 项目（您的GitHub仓库）
3. 点击 "Import" 按钮

#### **步骤3：添加环境变量（重要！）**
1. 在项目导入页面，找到 "Environment Variables" 部分
2. **一个一个地添加**上面列出的所有变量：
   
   **第1个变量：**
   - 在 "NAME" 框中输入：`NODE_ENV`
   - 在 "VALUE" 框中输入：`production`
   - 点击 "Add" 按钮
   
   **第2个变量：**
   - 在 "NAME" 框中输入：`NEXT_PUBLIC_APP_URL`
   - 在 "VALUE" 框中输入：`https://inspiration-oasis.vercel.app`
   - 点击 "Add" 按钮
   
   **第3个变量：**
   - 在 "NAME" 框中输入：`NEXT_PUBLIC_API_URL`
   - 在 "VALUE" 框中输入：`https://inspiration-oasis.vercel.app`
   - 点击 "Add" 按钮

   **继续添加剩下的11个必需变量...**（按照上面的列表，一个一个复制粘贴）

#### **步骤4：开始部署**
1. 确认所有14个必需变量都添加完了
2. 点击底部的 "Deploy" 按钮
3. 等待部署完成（大约2-5分钟）

---

## 🔍 第四步：检查部署是否成功

### **部署完成后，您会看到：**
- ✅ 一个绿色的成功页面
- ✅ 一个访问链接，类似：`https://inspiration-oasis-xxx.vercel.app`（xxx是随机字符）

### **测试您的网站：**
1. 点击访问链接
2. 如果能正常打开网站 = 成功！
3. 尝试登录功能，发送验证码测试

---

## 🛠️ 第五步：如果遇到问题

### **常见问题和解决方案：**

#### **问题1：部署失败**
- **原因**：可能是环境变量没添加完整
- **解决**：检查是否添加了所有14个必需变量

#### **问题2：网站能打开，但登录不了**
- **原因**：阿里云邮箱服务配置有问题
- **解决**：检查 ALIYUN 开头的4个变量是否正确

#### **问题3：显示数据库连接错误**
- **原因**：Supabase 配置有问题
- **解决**：检查所有 SUPABASE 和 DATABASE 相关的变量

---

## 📋 最终检查清单

部署前，请确认以下事项：

- [ ] 已登录 Vercel 账号
- [ ] 已导入 GitHub 项目 "inspiration-oasis"
- [ ] 已添加全部14个必需环境变量（项目名已配置为 `inspiration-oasis`）
- [ ] 已点击 "Deploy" 按钮
- [ ] 等待部署完成
- [ ] 测试网站访问和登录功能

---

## 🎉 恭喜！

如果一切顺利，您现在拥有了：
- ✅ 一个在线的 AI 创意管理平台
- ✅ 全球都能访问的网址
- ✅ 完整的用户登录和验证码功能
- ✅ 自动备份和更新的系统

**您的第一次 Vercel 部署就成功了！** 🚀

---

## 📞 需要帮助？

如果在任何步骤遇到问题：
1. 仔细检查是否按照步骤操作
2. 确认所有变量名和变量值都正确复制
3. 检查是否遗漏了任何必需的环境变量
4. 在 Vercel 的部署日志中查看具体错误信息

**记住：第一次配置总是最困难的，但您已经在学习很酷的技术了！** 💪✨
