#!/bin/bash

# 灵感绿洲项目 - GitHub 推送脚本
# 使用方法：./push-to-github.sh YOUR_GITHUB_USERNAME

set -e

# 检查参数
if [ $# -eq 0 ]; then
    echo "❌ 错误：请提供您的 GitHub 用户名"
    echo "使用方法：./push-to-github.sh YOUR_GITHUB_USERNAME"
    echo "示例：./push-to-github.sh john-doe"
    exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME="inspiration-oasis"

echo "🚀 开始推送灵感绿洲项目到 GitHub..."
echo "📁 GitHub 用户名: $GITHUB_USERNAME"
echo "📦 仓库名称: $REPO_NAME"
echo ""

# 检查是否已经添加了远程仓库
if git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  检测到已存在的远程仓库:"
    git remote -v
    echo ""
    read -p "是否要更新远程仓库地址？(y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 更新远程仓库地址..."
        git remote set-url origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    fi
else
    echo "➕ 添加远程仓库..."
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
fi

echo "🌿 设置主分支为 main..."
git branch -M main

echo "📤 推送代码到 GitHub..."
echo "注意：如果这是第一次推送，可能需要输入 GitHub 用户名和 Personal Access Token"
echo ""

if git push -u origin main; then
    echo ""
    echo "✅ 成功！灵感绿洲项目已推送到 GitHub"
    echo "🔗 仓库地址: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo ""
    echo "📋 下一步操作："
    echo "1. 访问 https://github.com/$GITHUB_USERNAME/$REPO_NAME 确认文件已上传"
    echo "2. 在 Vercel 或其他部署平台连接此仓库"
    echo "3. 配置环境变量并部署"
else
    echo ""
    echo "❌ 推送失败！"
    echo "💡 可能的解决方案："
    echo "1. 确保您已在 GitHub 创建了名为 '$REPO_NAME' 的仓库"
    echo "2. 检查网络连接"
    echo "3. 确认 GitHub 用户名正确"
    echo "4. 如果使用 HTTPS，确保使用 Personal Access Token 而不是密码"
    echo ""
    echo "📖 详细指南请查看: GITHUB_SETUP_GUIDE.md"
    exit 1
fi