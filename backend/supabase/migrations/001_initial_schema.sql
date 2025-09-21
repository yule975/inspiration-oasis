-- 创建枚举类型
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'GUEST');
CREATE TYPE "SourceType" AS ENUM ('IDEA', 'MANUAL');
CREATE TYPE "AttachmentType" AS ENUM ('IDEA', 'ASSET');
CREATE TYPE "EnhancementType" AS ENUM ('OPTIMIZE', 'EXPAND', 'TONE', 'SUMMARIZE');

-- 创建用户表
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- 创建灵感表
CREATE TABLE "ideas" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ideas_pkey" PRIMARY KEY ("id")
);

-- 创建评论表
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- 创建点赞表
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- 创建资产表
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "source_type" "SourceType" NOT NULL DEFAULT 'MANUAL',
    "source_id" TEXT,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- 创建更新日志表
CREATE TABLE "changelogs" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "changes" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "changelogs_pkey" PRIMARY KEY ("id")
);

-- 创建标签表
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- 创建附件表
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "entity_type" "AttachmentType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- 创建AI增强历史表
CREATE TABLE "ai_enhancements" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "enhancement_type" "EnhancementType" NOT NULL,
    "original_content" TEXT NOT NULL,
    "enhanced_content" TEXT NOT NULL,
    "model_used" TEXT NOT NULL,
    "tokens_used" INTEGER,
    "processing_time" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_enhancements_pkey" PRIMARY KEY ("id")
);

-- 创建AI对话历史表
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "context" TEXT,
    "messages" JSONB NOT NULL,
    "model_used" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- 创建每日简报表
CREATE TABLE "daily_briefs" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "news_items" JSONB NOT NULL,
    "categories" TEXT[],
    "generated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_briefs_pkey" PRIMARY KEY ("id")
);

-- 创建系统统计表
CREATE TABLE "system_stats" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total_ideas" INTEGER NOT NULL,
    "total_assets" INTEGER NOT NULL,
    "active_users" INTEGER NOT NULL,
    "api_calls" INTEGER NOT NULL,
    "ai_tokens_used" INTEGER NOT NULL,
    "top_contributor" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_stats_pkey" PRIMARY KEY ("id")
);

-- 创建唯一索引
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "likes_idea_id_user_id_key" ON "likes"("idea_id", "user_id");
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");
CREATE UNIQUE INDEX "daily_briefs_date_key" ON "daily_briefs"("date");
CREATE UNIQUE INDEX "system_stats_date_key" ON "system_stats"("date");

-- 添加外键约束
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "likes" ADD CONSTRAINT "likes_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assets" ADD CONSTRAINT "assets_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assets" ADD CONSTRAINT "assets_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "ideas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "changelogs" ADD CONSTRAINT "changelogs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_enhancements" ADD CONSTRAINT "ai_enhancements_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 启用行级安全策略
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ideas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "changelogs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_enhancements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "daily_briefs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "system_stats" ENABLE ROW LEVEL SECURITY;

-- 为匿名用户授予基本读取权限
GRANT SELECT ON "users" TO anon;
GRANT SELECT ON "ideas" TO anon;
GRANT SELECT ON "comments" TO anon;
GRANT SELECT ON "likes" TO anon;
GRANT SELECT ON "assets" TO anon;
GRANT SELECT ON "changelogs" TO anon;
GRANT SELECT ON "tags" TO anon;
GRANT SELECT ON "attachments" TO anon;
GRANT SELECT ON "daily_briefs" TO anon;

-- 为认证用户授予完整权限
GRANT ALL PRIVILEGES ON "users" TO authenticated;
GRANT ALL PRIVILEGES ON "ideas" TO authenticated;
GRANT ALL PRIVILEGES ON "comments" TO authenticated;
GRANT ALL PRIVILEGES ON "likes" TO authenticated;
GRANT ALL PRIVILEGES ON "assets" TO authenticated;
GRANT ALL PRIVILEGES ON "changelogs" TO authenticated;
GRANT ALL PRIVILEGES ON "tags" TO authenticated;
GRANT ALL PRIVILEGES ON "attachments" TO authenticated;
GRANT ALL PRIVILEGES ON "ai_enhancements" TO authenticated;
GRANT ALL PRIVILEGES ON "ai_conversations" TO authenticated;
GRANT ALL PRIVILEGES ON "daily_briefs" TO authenticated;
GRANT ALL PRIVILEGES ON "system_stats" TO authenticated;