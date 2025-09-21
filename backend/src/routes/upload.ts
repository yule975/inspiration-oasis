import { Router } from 'express'
import { z } from 'zod'
import { uploadController } from '@/controllers/uploadController'
import { authenticateUser, optionalAuth } from '@/middleware/auth'

const router = Router()

// 验证schemas
const updateEntitySchema = z.object({
  entity_type: z.enum(['IDEA', 'ASSET']),
  entity_id: z.string().min(1, '实体ID不能为空')
})

const fileQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  type: z.enum(['image', 'document', 'other']).optional(),
  entity_type: z.enum(['IDEA', 'ASSET']).optional(),
  entity_id: z.string().optional()
})

// 验证中间件
function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      next(error)
    }
  }
}

function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      req.query = schema.parse(req.query)
      next()
    } catch (error) {
      next(error)
    }
  }
}

// 路由定义

// 单文件上传
router.post('/', 
  authenticateUser,
  (req, res, next) => {
    uploadController.singleUpload(req, res, (err) => {
      if (err) {
        return uploadController.handleMulterError(err, req, res, next)
      }
      next()
    })
  },
  uploadController.handleSingleUpload.bind(uploadController)
)

// 多文件上传
router.post('/multiple', 
  authenticateUser,
  (req, res, next) => {
    uploadController.multipleUpload(req, res, (err) => {
      if (err) {
        return uploadController.handleMulterError(err, req, res, next)
      }
      next()
    })
  },
  uploadController.handleMultipleUpload.bind(uploadController)
)

// 获取文件统计
router.get('/stats', 
  authenticateUser,
  uploadController.getFileStats.bind(uploadController)
)

// 获取文件列表
router.get('/files', 
  optionalAuth,
  validateQuery(fileQuerySchema),
  uploadController.getFiles.bind(uploadController)
)

// 获取文件信息
router.get('/files/:id', 
  optionalAuth,
  uploadController.getFileInfo.bind(uploadController)
)

// 更新文件关联
router.put('/files/:id/entity', 
  authenticateUser,
  validateBody(updateEntitySchema),
  uploadController.updateFileEntity.bind(uploadController)
)

// 删除文件
router.delete('/files/:id', 
  authenticateUser,
  uploadController.deleteFile.bind(uploadController)
)

export { router as uploadRouter }
