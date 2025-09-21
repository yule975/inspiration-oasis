import { prisma } from '@/config/database'
import { getSocketService } from '@/config/socket'
import { cacheService } from '@/config/redis'

// 通知类型定义
export enum NotificationType {
  IDEA_LIKED = 'idea_liked',
  IDEA_COMMENTED = 'idea_commented',
  IDEA_ARCHIVED = 'idea_archived',
  ASSET_CREATED = 'asset_created',
  ASSET_DOWNLOADED = 'asset_downloaded',
  USER_MENTIONED = 'user_mentioned',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  AI_BRIEF_READY = 'ai_brief_ready'
}

// 通知数据结构
export interface NotificationData {
  id?: string
  type: NotificationType
  title: string
  message: string
  userId: string
  actorId?: string
  actorName?: string
  entityType?: 'idea' | 'asset' | 'comment'
  entityId?: string
  metadata?: any
  isRead?: boolean
  createdAt?: Date
}

class NotificationService {
  // 创建并发送通知
  async createAndSendNotification(notificationData: NotificationData) {
    try {
      // 保存到数据库（如果有通知表的话）
      const notification = await this.saveNotification(notificationData)

      // 发送实时通知
      const socketService = getSocketService()
      socketService.sendNotificationToUser(notificationData.userId, {
        ...notification,
        timestamp: new Date().toISOString()
      })

      // 更新用户未读通知计数
      await this.updateUnreadCount(notificationData.userId)

      return notification
    } catch (error) {
      console.error('创建通知失败:', error)
      throw error
    }
  }

  // 批量发送通知
  async createBulkNotifications(notifications: NotificationData[]) {
    const results = []
    
    for (const notificationData of notifications) {
      try {
        const notification = await this.createAndSendNotification(notificationData)
        results.push(notification)
      } catch (error) {
        console.error(`发送通知失败 (用户: ${notificationData.userId}):`, error)
      }
    }

    return results
  }

  // 发送系统广播通知
  async sendSystemBroadcast(title: string, message: string, metadata?: any) {
    try {
      const socketService = getSocketService()
      const broadcast = {
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title,
        message,
        metadata,
        timestamp: new Date().toISOString()
      }

      socketService.broadcastNotification(broadcast)

      // 可选：保存到系统广播记录
      console.log(`📢 系统广播: ${title} - ${message}`)
      
      return broadcast
    } catch (error) {
      console.error('发送系统广播失败:', error)
      throw error
    }
  }

  // 灵感被点赞通知
  async notifyIdeaLiked(ideaId: string, ideaContent: string, likedByUserId: string, likedByUserName: string, ideaAuthorId: string) {
    if (likedByUserId === ideaAuthorId) return // 自己点赞自己不通知

    const notification: NotificationData = {
      type: NotificationType.IDEA_LIKED,
      title: '有人点赞了你的灵感',
      message: `${likedByUserName} 点赞了你的灵感："${ideaContent.substring(0, 50)}..."`,
      userId: ideaAuthorId,
      actorId: likedByUserId,
      actorName: likedByUserName,
      entityType: 'idea',
      entityId: ideaId,
      metadata: { ideaContent: ideaContent.substring(0, 100) }
    }

    return await this.createAndSendNotification(notification)
  }

  // 灵感被评论通知
  async notifyIdeaCommented(ideaId: string, ideaContent: string, commentContent: string, commenterId: string, commenterName: string, ideaAuthorId: string) {
    if (commenterId === ideaAuthorId) return // 自己评论自己不通知

    const notification: NotificationData = {
      type: NotificationType.IDEA_COMMENTED,
      title: '有人评论了你的灵感',
      message: `${commenterName} 评论了你的灵感："${commentContent.substring(0, 50)}..."`,
      userId: ideaAuthorId,
      actorId: commenterId,
      actorName: commenterName,
      entityType: 'idea',
      entityId: ideaId,
      metadata: { 
        ideaContent: ideaContent.substring(0, 100),
        commentContent: commentContent.substring(0, 100)
      }
    }

    return await this.createAndSendNotification(notification)
  }

  // 灵感被归档通知
  async notifyIdeaArchived(ideaId: string, ideaContent: string, assetTitle: string, userId: string) {
    const notification: NotificationData = {
      type: NotificationType.IDEA_ARCHIVED,
      title: '你的灵感已归档为资产',
      message: `你的灵感已成功归档为资产："${assetTitle}"`,
      userId,
      entityType: 'idea',
      entityId: ideaId,
      metadata: { 
        ideaContent: ideaContent.substring(0, 100),
        assetTitle
      }
    }

    return await this.createAndSendNotification(notification)
  }

  // 新资产创建通知（可选择发送给团队）
  async notifyAssetCreated(assetId: string, assetTitle: string, creatorId: string, creatorName: string, notifyTeam = false) {
    if (notifyTeam) {
      // 获取团队成员（这里简化为获取最近活跃用户）
      const activeUsers = await this.getActiveUsers(creatorId)
      
      const notifications = activeUsers.map(user => ({
        type: NotificationType.ASSET_CREATED,
        title: '团队新增资产',
        message: `${creatorName} 创建了新资产："${assetTitle}"`,
        userId: user.id,
        actorId: creatorId,
        actorName: creatorName,
        entityType: 'asset' as const,
        entityId: assetId,
        metadata: { assetTitle }
      }))

      return await this.createBulkNotifications(notifications)
    }
  }

  // AI简报就绪通知
  async notifyAIBriefReady(date: string) {
    // 获取所有活跃用户
    const activeUsers = await this.getActiveUsers()
    
    const notifications = activeUsers.map(user => ({
      type: NotificationType.AI_BRIEF_READY,
      title: '每日AI简报已更新',
      message: `${date} 的AI简报已生成，快来查看最新资讯吧！`,
      userId: user.id,
      metadata: { date }
    }))

    return await this.createBulkNotifications(notifications)
  }

  // 提及用户通知（@功能）
  async notifyUserMentioned(mentionedUserId: string, mentionerName: string, content: string, entityType: 'idea' | 'comment', entityId: string) {
    const notification: NotificationData = {
      type: NotificationType.USER_MENTIONED,
      title: '有人在内容中提到了你',
      message: `${mentionerName} 在${entityType === 'idea' ? '灵感' : '评论'}中提到了你`,
      userId: mentionedUserId,
      actorName: mentionerName,
      entityType,
      entityId,
      metadata: { content: content.substring(0, 100) }
    }

    return await this.createAndSendNotification(notification)
  }

  // 获取用户通知列表
  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    try {
      // 这里应该从数据库获取通知，现在返回模拟数据
      const cacheKey = `notifications:${userId}:${page}:${limit}`
      
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached

      // 模拟通知数据
      const notifications = [
        {
          id: '1',
          type: NotificationType.IDEA_LIKED,
          title: '有人点赞了你的灵感',
          message: '李四 点赞了你的灵感："创建一个AI助手..."',
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5分钟前
          metadata: { actorName: '李四' }
        },
        {
          id: '2',
          type: NotificationType.IDEA_COMMENTED,
          title: '有人评论了你的灵感',
          message: '王五 评论了你的灵感："这个想法很有创意..."',
          isRead: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30分钟前
          metadata: { actorName: '王五' }
        },
        {
          id: '3',
          type: NotificationType.AI_BRIEF_READY,
          title: '每日AI简报已更新',
          message: '2023-11-16 的AI简报已生成，快来查看最新资讯吧！',
          isRead: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
          metadata: { date: '2023-11-16' }
        }
      ]

      const result = {
        notifications,
        pagination: {
          current_page: page,
          per_page: limit,
          total: notifications.length,
          has_next: false,
          has_prev: false
        },
        unread_count: notifications.filter(n => !n.isRead).length
      }

      // 缓存结果
      await cacheService.set(cacheKey, result, 300) // 5分钟

      return result
    } catch (error) {
      console.error('获取用户通知失败:', error)
      throw error
    }
  }

  // 标记通知为已读
  async markNotificationAsRead(notificationId: string, userId: string) {
    try {
      // 这里应该更新数据库
      console.log(`标记通知 ${notificationId} 为已读 (用户: ${userId})`)

      // 清除相关缓存
      await cacheService.delPattern(`notifications:${userId}:*`)
      await cacheService.delPattern(`unread_count:${userId}`)

      // 发送实时更新
      const socketService = getSocketService()
      socketService.sendNotificationToUser(userId, {
        type: 'notification:read',
        notificationId,
        timestamp: new Date().toISOString()
      })

      return { success: true }
    } catch (error) {
      console.error('标记通知已读失败:', error)
      throw error
    }
  }

  // 标记所有通知为已读
  async markAllNotificationsAsRead(userId: string) {
    try {
      // 这里应该批量更新数据库
      console.log(`标记用户 ${userId} 所有通知为已读`)

      // 清除相关缓存
      await cacheService.delPattern(`notifications:${userId}:*`)
      await cacheService.delPattern(`unread_count:${userId}`)

      // 发送实时更新
      const socketService = getSocketService()
      socketService.sendNotificationToUser(userId, {
        type: 'notification:all_read',
        timestamp: new Date().toISOString()
      })

      return { success: true }
    } catch (error) {
      console.error('标记所有通知已读失败:', error)
      throw error
    }
  }

  // 获取用户未读通知数
  async getUnreadCount(userId: string) {
    try {
      const cacheKey = `unread_count:${userId}`
      
      const cached = await cacheService.get(cacheKey)
      if (cached !== null) return cached

      // 这里应该从数据库查询，现在返回模拟数据
      const count = Math.floor(Math.random() * 10)
      
      // 缓存结果
      await cacheService.set(cacheKey, count, 300)

      return count
    } catch (error) {
      console.error('获取未读通知数失败:', error)
      return 0
    }
  }

  // 私有方法：保存通知到数据库
  private async saveNotification(notificationData: NotificationData) {
    // 这里应该保存到数据库，现在返回模拟数据
    const notification = {
      id: `notif_${Date.now()}`,
      ...notificationData,
      isRead: false,
      createdAt: new Date()
    }

    console.log(`💾 保存通知:`, notification)
    return notification
  }

  // 私有方法：更新未读计数
  private async updateUnreadCount(userId: string) {
    try {
      // 清除缓存，下次查询时重新计算
      await cacheService.del(`unread_count:${userId}`)
      
      // 发送实时更新
      const unreadCount = await this.getUnreadCount(userId)
      const socketService = getSocketService()
      socketService.sendNotificationToUser(userId, {
        type: 'notification:unread_count',
        count: unreadCount,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('更新未读计数失败:', error)
    }
  }

  // 私有方法：获取活跃用户
  private async getActiveUsers(excludeUserId?: string) {
    try {
      // 获取最近活跃的用户（简化实现）
      const users = await prisma.user.findMany({
        where: excludeUserId ? {
          id: { not: excludeUserId }
        } : undefined,
        take: 10,
        orderBy: { createdAt: 'desc' }
      })

      return users
    } catch (error) {
      console.error('获取活跃用户失败:', error)
      return []
    }
  }
}

export const notificationService = new NotificationService()
