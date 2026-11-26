import { Router } from 'express'
import { getAdminSession, loginAdmin } from '../controllers/adminController.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

router.post('/login', loginAdmin)
router.get('/session', requireAdmin, getAdminSession)

export default router
