import { Router } from 'express'
import { getAdminSession, getAdminStats, loginAdmin } from '../controllers/adminController.js'
import { getAdminBlogs } from '../controllers/blogController.js'
import {
  deleteComment,
  getAdminComments,
  setCommentApproval,
} from '../controllers/commentController.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

router.post('/login', loginAdmin)
router.get('/session', requireAdmin, getAdminSession)
router.get('/blogs', requireAdmin, getAdminBlogs)
router.get('/stats', requireAdmin, getAdminStats)
router.get('/comments', requireAdmin, getAdminComments)
router.patch('/comments/:id/approval', requireAdmin, setCommentApproval)
router.delete('/comments/:id', requireAdmin, deleteComment)

export default router
