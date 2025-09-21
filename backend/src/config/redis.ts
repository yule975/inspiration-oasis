import { createClient } from 'redis'

// Redis客户端
let redisClient: ReturnType<typeof createClient> | null = null

// 初始化Redis连接
export async function initRedis() {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL环境变量未设置')
  }

  redisClient = createClient({
    url: process.env.REDIS_URL
  })

  redisClient.on('error', (err) => {
    console.error('Redis连接错误:', err)
  })

  redisClient.on('connect', () => {
    console.log('Redis连接已建立')
  })

  await redisClient.connect()
}

// 获取Redis客户端
export function getRedisClient() {
  return redisClient
}

// 缓存工具函数
export class CacheService {
  private client = redisClient

  // 设置缓存
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    if (!this.client) return
    
    const serializedValue = JSON.stringify(value)
    await this.client.setEx(key, ttl, serializedValue)
  }

  // 获取缓存
  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null
    
    const value = await this.client.get(key)
    if (!value) return null
    
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  // 删除缓存
  async del(key: string): Promise<void> {
    if (!this.client) return
    
    await this.client.del(key)
  }

  // 批量删除缓存
  async delPattern(pattern: string): Promise<void> {
    if (!this.client) return
    
    const keys = await this.client.keys(pattern)
    if (keys.length > 0) {
      await this.client.del(keys)
    }
  }

  // 增加计数器
  async incr(key: string, ttl?: number): Promise<number> {
    if (!this.client) return 1
    
    const value = await this.client.incr(key)
    if (ttl && value === 1) {
      await this.client.expire(key, ttl)
    }
    return value
  }
}

// 导出缓存服务实例
export const cacheService = new CacheService()
