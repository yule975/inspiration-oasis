import { Request, Response } from 'express'
import { AIServiceError } from '@/middleware/errorHandler'
import { openRouterService } from '@/services/openRouterService'

class AIController {
  // AI内容增强
  async enhanceContent(req: Request, res: Response) {
    const { content, type, context } = req.body
    const userId = req.user!.id

    try {
      const result = await openRouterService.enhanceContent(content, type, context)
      
      // 记录AI增强历史 (如果有关联的idea)
      // 这里可以扩展记录到数据库的逻辑

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      throw new AIServiceError('AI内容增强服务暂时不可用', error)
    }
  }

  // 智能总结
  async summarizeContent(req: Request, res: Response) {
    const { content, summary_type } = req.body
    const userId = req.user!.id

    try {
      const result = await openRouterService.summarizeContent(content, summary_type)

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      throw new AIServiceError('AI总结服务暂时不可用', error)
    }
  }

  // AI对话
  async chatWithAI(req: Request, res: Response) {
    const { message, context, conversation_id } = req.body
    const userId = req.user!.id

    try {
      const result = await openRouterService.chatWithAI(
        message, 
        context, 
        conversation_id || `conv_${userId}_${Date.now()}`
      )

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      throw new AIServiceError('AI对话服务暂时不可用', error)
    }
  }

  // 标签推荐
  async suggestTags(req: Request, res: Response) {
    const { content, max_tags } = req.body

    try {
      const result = await openRouterService.suggestTags(content, max_tags)

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      throw new AIServiceError('AI标签推荐服务暂时不可用', error)
    }
  }

  // 每日AI简报
  async getDailyBrief(req: Request, res: Response) {
    const { date, categories } = req.query as any
    const targetDate = date || new Date().toISOString().split('T')[0]
    const categoryList = categories ? categories.split(',') : ['AI', '技术', '创新']

    try {
      const result = await openRouterService.generateDailyBrief(targetDate, categoryList)

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      throw new AIServiceError('AI简报服务暂时不可用', error)
    }
  }
}

export const aiController = new AIController()
