import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 测试Supabase连接
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase连接测试失败:', error)
      return false
    }
    
    console.log('✅ Supabase连接测试成功')
    return true
  } catch (error) {
    console.error('❌ Supabase连接测试异常:', error)
    return false
  }
}