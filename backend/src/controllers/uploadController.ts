import { Request, Response } from 'express'
import { prisma } from '@/config/database'
import { AppError } from '@/middleware/errorHandler'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

class UploadController {
  // 配置multer存储
  private storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = process.env.UPLOAD_DIR || './uploads'
      
      // 根据文件类型创建子目录
      let subDir = 'other'
      if (file.mimetype.startsWith('image/')) {
        subDir = 'images'
      } else if (file.mimetype.includes('pdf') || file.mimetype.includes('document')) {
        subDir = 'documents'
      }
      
      const fullPath = path.join(uploadDir, subDir)
      
      // 确保目录存在
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
      }
      
      cb(null, fullPath)
    },
    filename: (req, file, cb) => {
      // 生成唯一文件名
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
      cb(null, uniqueName)
    }
  })

  // 文件过滤器
  private fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // 允许的文件类型
    const allowedTypes = [
      // 图片类型
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // 文档类型
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // 文本类型
      'text/plain',
      'text/csv',
      'application/json',
      // 压缩文件
      'application/zip',
      'application/x-rar-compressed'
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new AppError(`不支持的文件类型: ${file.mimetype}`, 400, 'UNSUPPORTED_FILE_TYPE'))
    }
  }

  // 配置multer
  private upload = multer({
    storage: this.storage,
    fileFilter: this.fileFilter,
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
      files: 5 // 最多5个文件
    }
  })

  // 单文件上传中间件
  public singleUpload = this.upload.single('file')

  // 多文件上传中间件
  public multipleUpload = this.upload.array('files', 5)

  // 处理单文件上传
  async handleSingleUpload(req: Request, res: Response) {
    try {
      const file = req.file
      const userId = req.user?.id
      const { type = 'other', entity_type, entity_id } = req.body

      if (!file) {
        throw new AppError('没有上传文件', 400, 'NO_FILE_UPLOADED')
      }

      // 验证文件大小
      if (file.size > parseInt(process.env.MAX_FILE_SIZE || '10485760')) {
        // 删除已上传的文件
        fs.unlinkSync(file.path)
        throw new AppError('文件大小超过限制', 400, 'FILE_SIZE_EXCEEDED')
      }

      // 生成文件URL
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`
      const fileUrl = `${baseUrl}/uploads/${path.basename(path.dirname(file.path))}/${file.filename}`

      // 保存文件信息到数据库
      const attachment = await prisma.attachment.create({
        data: {
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          fileUrl: fileUrl,
          uploadedBy: userId || 'anonymous',
          entityType: entity_type as any || 'IDEA',
          entityId: entity_id || uuidv4() // 临时ID，后续可以更新
        }
      })

      // 返回文件信息
      res.json({
        success: true,
        data: {
          file_id: attachment.id,
          file_name: attachment.fileName,
          file_size: attachment.fileSize,
          file_type: attachment.fileType,
          file_url: attachment.fileUrl,
          upload_time: attachment.createdAt
        },
        message: '文件上传成功'
      })
    } catch (error) {
      // 如果出错，删除已上传的文件
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }

      if (error instanceof AppError) throw error
      throw new AppError('文件上传失败', 500, 'UPLOAD_ERROR')
    }
  }

  // 处理多文件上传
  async handleMultipleUpload(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[]
      const userId = req.user?.id
      const { entity_type, entity_id } = req.body

      if (!files || files.length === 0) {
        throw new AppError('没有上传文件', 400, 'NO_FILES_UPLOADED')
      }

      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`
      const uploadedFiles = []

      try {
        // 处理每个文件
        for (const file of files) {
          // 验证文件大小
          if (file.size > parseInt(process.env.MAX_FILE_SIZE || '10485760')) {
            fs.unlinkSync(file.path)
            throw new AppError(`文件 ${file.originalname} 大小超过限制`, 400, 'FILE_SIZE_EXCEEDED')
          }

          const fileUrl = `${baseUrl}/uploads/${path.basename(path.dirname(file.path))}/${file.filename}`

          // 保存到数据库
          const attachment = await prisma.attachment.create({
            data: {
              fileName: file.originalname,
              fileType: file.mimetype,
              fileSize: file.size,
              fileUrl: fileUrl,
              uploadedBy: userId || 'anonymous',
              entityType: entity_type as any || 'IDEA',
              entityId: entity_id || uuidv4()
            }
          })

          uploadedFiles.push({
            file_id: attachment.id,
            file_name: attachment.fileName,
            file_size: attachment.fileSize,
            file_type: attachment.fileType,
            file_url: attachment.fileUrl,
            upload_time: attachment.createdAt
          })
        }

        res.json({
          success: true,
          data: {
            files: uploadedFiles,
            total_count: uploadedFiles.length
          },
          message: `成功上传 ${uploadedFiles.length} 个文件`
        })
      } catch (error) {
        // 如果出错，删除所有已上传的文件
        for (const file of files) {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path)
          }
        }
        throw error
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('文件上传失败', 500, 'UPLOAD_ERROR')
    }
  }

  // 删除文件
  async deleteFile(req: Request, res: Response) {
    const { id } = req.params
    const userId = req.user?.id

    try {
      // 查找文件记录
      const attachment = await prisma.attachment.findUnique({
        where: { id }
      })

      if (!attachment) {
        throw new AppError('文件不存在', 404, 'FILE_NOT_FOUND')
      }

      // 检查权限（只有上传者可以删除）
      if (attachment.uploadedBy !== userId && userId !== 'admin') {
        throw new AppError('无权限删除此文件', 403, 'FORBIDDEN')
      }

      // 删除物理文件
      const filePath = this.getFilePathFromUrl(attachment.fileUrl)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }

      // 删除数据库记录
      await prisma.attachment.delete({
        where: { id }
      })

      res.json({
        success: true,
        message: '文件删除成功'
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('删除文件失败', 500, 'DELETE_FILE_ERROR')
    }
  }

  // 获取文件列表
  async getFiles(req: Request, res: Response) {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      entity_type, 
      entity_id 
    } = req.query as any
    const userId = req.user?.id

    try {
      const where: any = {}

      // 筛选条件
      if (type) {
        if (type === 'image') {
          where.fileType = { startsWith: 'image/' }
        } else if (type === 'document') {
          where.OR = [
            { fileType: { contains: 'pdf' } },
            { fileType: { contains: 'document' } },
            { fileType: { contains: 'sheet' } },
            { fileType: { contains: 'presentation' } }
          ]
        } else {
          where.fileType = { contains: type }
        }
      }

      if (entity_type) {
        where.entityType = entity_type
      }

      if (entity_id) {
        where.entityId = entity_id
      }

      // 如果指定了用户，只显示该用户的文件
      if (userId) {
        where.uploadedBy = userId
      }

      const skip = (page - 1) * limit

      const [files, total] = await Promise.all([
        prisma.attachment.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.attachment.count({ where })
      ])

      res.json({
        success: true,
        data: {
          files,
          pagination: {
            current_page: page,
            per_page: limit,
            total_pages: Math.ceil(total / limit),
            has_next: page * limit < total,
            has_prev: page > 1
          },
          total
        }
      })
    } catch (error) {
      throw new AppError('获取文件列表失败', 500, 'FETCH_FILES_ERROR')
    }
  }

  // 获取文件信息
  async getFileInfo(req: Request, res: Response) {
    const { id } = req.params

    try {
      const attachment = await prisma.attachment.findUnique({
        where: { id }
      })

      if (!attachment) {
        throw new AppError('文件不存在', 404, 'FILE_NOT_FOUND')
      }

      // 检查文件是否还存在于磁盘上
      const filePath = this.getFilePathFromUrl(attachment.fileUrl)
      const fileExists = fs.existsSync(filePath)

      res.json({
        success: true,
        data: {
          ...attachment,
          file_exists: fileExists,
          file_path: fileExists ? filePath : null
        }
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('获取文件信息失败', 500, 'FETCH_FILE_INFO_ERROR')
    }
  }

  // 更新文件关联
  async updateFileEntity(req: Request, res: Response) {
    const { id } = req.params
    const { entity_type, entity_id } = req.body
    const userId = req.user?.id

    try {
      const attachment = await prisma.attachment.findUnique({
        where: { id }
      })

      if (!attachment) {
        throw new AppError('文件不存在', 404, 'FILE_NOT_FOUND')
      }

      // 检查权限
      if (attachment.uploadedBy !== userId && userId !== 'admin') {
        throw new AppError('无权限修改此文件', 403, 'FORBIDDEN')
      }

      // 更新关联信息
      const updatedAttachment = await prisma.attachment.update({
        where: { id },
        data: {
          entityType: entity_type,
          entityId: entity_id
        }
      })

      res.json({
        success: true,
        data: updatedAttachment,
        message: '文件关联更新成功'
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('更新文件关联失败', 500, 'UPDATE_FILE_ENTITY_ERROR')
    }
  }

  // 获取文件统计信息
  async getFileStats(req: Request, res: Response) {
    const userId = req.user?.id

    try {
      const where = userId ? { uploadedBy: userId } : {}

      const [
        totalFiles,
        totalSize,
        imageCount,
        documentCount,
        recentFiles
      ] = await Promise.all([
        prisma.attachment.count({ where }),
        prisma.attachment.aggregate({
          where,
          _sum: { fileSize: true }
        }),
        prisma.attachment.count({
          where: {
            ...where,
            fileType: { startsWith: 'image/' }
          }
        }),
        prisma.attachment.count({
          where: {
            ...where,
            OR: [
              { fileType: { contains: 'pdf' } },
              { fileType: { contains: 'document' } },
              { fileType: { contains: 'sheet' } },
              { fileType: { contains: 'presentation' } }
            ]
          }
        }),
        prisma.attachment.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            createdAt: true
          }
        })
      ])

      res.json({
        success: true,
        data: {
          total_files: totalFiles,
          total_size: totalSize._sum.fileSize || 0,
          image_count: imageCount,
          document_count: documentCount,
          other_count: totalFiles - imageCount - documentCount,
          recent_files: recentFiles,
          size_formatted: this.formatFileSize(totalSize._sum.fileSize || 0)
        }
      })
    } catch (error) {
      throw new AppError('获取文件统计失败', 500, 'FETCH_FILE_STATS_ERROR')
    }
  }

  // 私有辅助方法

  private getFilePathFromUrl(fileUrl: string): string {
    // 从URL提取文件路径
    const urlParts = fileUrl.split('/uploads/')
    if (urlParts.length === 2) {
      const uploadDir = process.env.UPLOAD_DIR || './uploads'
      return path.join(uploadDir, urlParts[1])
    }
    return ''
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  // 中间件方法，用于处理multer错误
  public handleMulterError = (error: any, req: Request, res: Response, next: any) => {
    if (error instanceof multer.MulterError) {
      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          throw new AppError('文件大小超过限制', 400, 'FILE_SIZE_EXCEEDED')
        case 'LIMIT_FILE_COUNT':
          throw new AppError('文件数量超过限制', 400, 'FILE_COUNT_EXCEEDED')
        case 'LIMIT_UNEXPECTED_FILE':
          throw new AppError('意外的文件字段', 400, 'UNEXPECTED_FILE')
        default:
          throw new AppError('文件上传错误', 400, 'UPLOAD_ERROR')
      }
    }
    next(error)
  }
}

export const uploadController = new UploadController()
