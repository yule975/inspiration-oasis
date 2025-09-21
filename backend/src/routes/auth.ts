import { Router } from 'express'
import { authController } from '@/controllers/authController'
import { authenticateUser, optionalAuth } from '@/middleware/auth'

const router = Router()

// 公开路由（无需认证）
router.post('/register', authController.register.bind(authController))
router.post('/login', authController.login.bind(authController))
router.post('/refresh-token', authController.refreshToken.bind(authController))
router.post('/request-password-reset', authController.requestPasswordReset.bind(authController))
router.post('/reset-password', authController.resetPassword.bind(authController))

// 需要认证的路由
router.post('/logout', authenticateUser, authController.logout.bind(authController))
router.get('/profile', authenticateUser, authController.getProfile.bind(authController))
router.put('/profile', authenticateUser, authController.updateProfile.bind(authController))
router.post('/change-password', authenticateUser, authController.changePassword.bind(authController))
router.get('/verify-token', authenticateUser, authController.verifyToken.bind(authController))
router.get('/session', authenticateUser, authController.getSession.bind(authController))

export { router as authRouter }
