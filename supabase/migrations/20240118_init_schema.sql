-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR,
    avatar VARCHAR,
    role VARCHAR DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建灵感表
CREATE TABLE IF NOT EXISTS ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建评论表
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建点赞表
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(idea_id, user_id)
);

-- 创建资产表
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    content TEXT,
    category VARCHAR NOT NULL,
    tags TEXT[] DEFAULT '{}',
    download_count INTEGER DEFAULT 0,
    version VARCHAR DEFAULT '1.0.0',
    source_type VARCHAR DEFAULT 'MANUAL',
    source_id UUID REFERENCES ideas(id),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新日志表
CREATE TABLE IF NOT EXISTS changelogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    version VARCHAR NOT NULL,
    changes TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建标签表
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建附件表
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR NOT NULL,
    file_type VARCHAR NOT NULL,
    file_size INTEGER NOT NULL,
    file_url VARCHAR NOT NULL,
    uploaded_by VARCHAR NOT NULL,
    entity_type VARCHAR NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建AI增强历史表
CREATE TABLE IF NOT EXISTS ai_enhancements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    enhancement_type VARCHAR NOT NULL,
    original_content TEXT NOT NULL,
    enhanced_content TEXT NOT NULL,
    model_used VARCHAR NOT NULL,
    tokens_used INTEGER,
    processing_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ideas_author_id ON ideas(author_id);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_likes_idea_id ON likes(idea_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_author_id ON assets(author_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);

-- 启用行级安全策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_enhancements ENABLE ROW LEVEL SECURITY;

-- 创建基本的RLS策略（允许认证用户访问）
CREATE POLICY "Allow authenticated users to read users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow users to update their own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id::uuid);

CREATE POLICY "Allow authenticated users to read ideas" ON ideas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to create ideas" ON ideas FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id::uuid);
CREATE POLICY "Allow users to update their own ideas" ON ideas FOR UPDATE TO authenticated USING (auth.uid() = author_id::uuid);
CREATE POLICY "Allow users to delete their own ideas" ON ideas FOR DELETE TO authenticated USING (auth.uid() = author_id::uuid);

CREATE POLICY "Allow authenticated users to read comments" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to create comments" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id::uuid);
CREATE POLICY "Allow users to update their own comments" ON comments FOR UPDATE TO authenticated USING (auth.uid() = author_id::uuid);
CREATE POLICY "Allow users to delete their own comments" ON comments FOR DELETE TO authenticated USING (auth.uid() = author_id::uuid);

CREATE POLICY "Allow authenticated users to read likes" ON likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to create likes" ON likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id::uuid);
CREATE POLICY "Allow users to delete their own likes" ON likes FOR DELETE TO authenticated USING (auth.uid() = user_id::uuid);

CREATE POLICY "Allow authenticated users to read assets" ON assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to create assets" ON assets FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id::uuid);
CREATE POLICY "Allow users to update their own assets" ON assets FOR UPDATE TO authenticated USING (auth.uid() = author_id::uuid);
CREATE POLICY "Allow users to delete their own assets" ON assets FOR DELETE TO authenticated USING (auth.uid() = author_id::uuid);

-- 授予权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;