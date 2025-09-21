const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('正在测试Supabase直接连接...');
  
  const supabaseUrl = 'https://zvntueoyabwinhtbpynz.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2bnR1ZW95YWJ3aW5odGJweW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3NjYxMiwiZXhwIjoyMDczNzUyNjEyfQ.rxj3ssI42nnXQ8u78jXOMsMAY-WUa7EQ_5CQ0f-_WCM';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 测试查询用户表
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Supabase查询失败:', error.message);
      return false;
    }
    
    console.log('✅ Supabase连接成功!');
    console.log('用户数据:', data);
    return true;
    
  } catch (error) {
    console.log('❌ Supabase连接失败:', error.message);
    return false;
  }
}

testSupabaseConnection().then(() => {
  console.log('测试完成');
}).catch(console.error);