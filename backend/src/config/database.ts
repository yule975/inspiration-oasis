import { PrismaClient } from '@prisma/client'
import { testSupabaseConnection } from './supabase'

// 创建Prisma客户端实例
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
})

// 数据库连接状态
export let isDatabaseConnected = false
export let isSupabaseConnected = false

// 连接数据库
export async function connectDatabase() {
  try {
    await prisma.$connect()
    console.log('🗄️  Prisma数据库连接已建立')
    isDatabaseConnected = true
    return true
  } catch (error) {
    console.error('❌ Prisma数据库连接失败:', error)
    
    // 尝试Supabase连接
    console.log('🔄 尝试Supabase直接连接...')
    isSupabaseConnected = await testSupabaseConnection()
    
    if (isSupabaseConnected) {
      console.log('✅ Supabase连接成功，将使用Supabase客户端')
    } else {
      console.log('⚠️  所有数据库连接失败，服务将继续启动但数据库功能不可用')
    }
    
    return isSupabaseConnected
  }
}

// 断开数据库连接
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
    console.log('🗄️  数据库连接已断开')
  } catch (error) {
    console.error('❌ 数据库断开连接失败:', error)
  }
}
