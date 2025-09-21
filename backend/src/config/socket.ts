import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import { prisma } from './database'
import { cacheService } from './redis'

// Socket.io服务配置
export class SocketService {
  private io: Server
  private onlineUsers = new Map<string, { socketId: string, userId: string, userInfo: any }>()

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    })

    this.setupEventHandlers()
  }

  // 设置事件处理器
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔗 Socket连接: ${socket.id}`)

      // 用户加入
      socket.on('user:join', async (userData) => {
        await this.handleUserJoin(socket, userData)
      })

      // 用户离开特定房间
      socket.on('room:leave', (roomId) => {
        socket.leave(roomId)
        console.log(`📤 用户 ${socket.id} 离开房间: ${roomId}`)
      })

      // 用户加入特定房间（如特定话题讨论）
      socket.on('room:join', (roomId) => {
        socket.join(roomId)
        console.log(`📥 用户 ${socket.id} 加入房间: ${roomId}`)
        
        // 通知房间内其他用户
        socket.to(roomId).emit('room:user_joined', {
          userId: this.onlineUsers.get(socket.id)?.userId,
          timestamp: new Date().toISOString()
        })
      })

      // 实时打字状态
      socket.on('typing:start', (data) => {
        socket.to(data.roomId).emit('typing:user_typing', {
          userId: this.onlineUsers.get(socket.id)?.userId,
          userName: this.onlineUsers.get(socket.id)?.userInfo?.name,
          timestamp: new Date().toISOString()
        })
      })

      socket.on('typing:stop', (data) => {
        socket.to(data.roomId).emit('typing:user_stopped', {
          userId: this.onlineUsers.get(socket.id)?.userId,
          timestamp: new Date().toISOString()
        })
      })

      // 断开连接
      socket.on('disconnect', () => {
        this.handleUserDisconnect(socket)
      })

      // 错误处理
      socket.on('error', (error) => {
        console.error(`❌ Socket错误 ${socket.id}:`, error)
      })
    })
  }

  // 处理用户加入
  private async handleUserJoin(socket: any, userData: any) {
    try {
      const { userId, userName } = userData

      if (!userId) {
        socket.emit('error', { message: '用户ID不能为空' })
        return
      }

      // 存储用户信息
      this.onlineUsers.set(socket.id, {
        socketId: socket.id,
        userId,
        userInfo: { name: userName || '匿名用户' }
      })

      // 加入用户专属房间（用于接收个人通知）
      socket.join(`user:${userId}`)

      // 加入全局房间
      socket.join('global')

      // 发送欢迎消息
      socket.emit('user:connected', {
        message: '连接成功',
        userId,
        onlineCount: this.onlineUsers.size
      })

      // 广播在线用户数更新
      this.io.emit('stats:online_users', {
        count: this.onlineUsers.size
      })

      console.log(`👋 用户 ${userName}(${userId}) 已连接，在线用户数: ${this.onlineUsers.size}`)
    } catch (error) {
      console.error('处理用户加入失败:', error)
      socket.emit('error', { message: '连接失败' })
    }
  }

  // 处理用户断开连接
  private handleUserDisconnect(socket: any) {
    const userInfo = this.onlineUsers.get(socket.id)
    
    if (userInfo) {
      this.onlineUsers.delete(socket.id)
      
      // 广播在线用户数更新
      this.io.emit('stats:online_users', {
        count: this.onlineUsers.size
      })

      console.log(`👋 用户 ${userInfo.userInfo.name}(${userInfo.userId}) 已断开连接，在线用户数: ${this.onlineUsers.size}`)
    }
  }

  // 发送通知给特定用户
  public sendNotificationToUser(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification:new', notification)
  }

  // 发送通知给所有在线用户
  public broadcastNotification(notification: any) {
    this.io.to('global').emit('notification:broadcast', notification)
  }

  // 发送实时数据更新
  public broadcastDataUpdate(eventType: string, data: any) {
    this.io.to('global').emit('data:update', {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    })
  }

  // 发送给特定房间
  public sendToRoom(roomId: string, event: string, data: any) {
    this.io.to(roomId).emit(event, data)
  }

  // 获取在线用户列表
  public getOnlineUsers() {
    return Array.from(this.onlineUsers.values()).map(user => ({
      userId: user.userId,
      userName: user.userInfo.name
    }))
  }

  // 获取在线用户数
  public getOnlineCount() {
    return this.onlineUsers.size
  }

  // 检查用户是否在线
  public isUserOnline(userId: string) {
    return Array.from(this.onlineUsers.values()).some(user => user.userId === userId)
  }

  // 获取Socket.io实例
  public getIO() {
    return this.io
  }
}

// 全局Socket服务实例
let socketService: SocketService | null = null

export function initSocketService(httpServer: HttpServer) {
  socketService = new SocketService(httpServer)
  return socketService
}

export function getSocketService(): SocketService {
  if (!socketService) {
    throw new Error('Socket服务未初始化')
  }
  return socketService
}
