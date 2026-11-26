import { Router } from 'express'
import { uploadBlogImage } from '../controllers/imageUploadController.js'
import { requireAdmin } from '../middleware/auth.js'
import {
  handleImageUploadError,
  receiveImage,
  validateImageContent,
} from '../middleware/multer.js'

const router = Router()

router.post(
  '/upload',
  requireAdmin,
  receiveImage,
  validateImageContent,
  uploadBlogImage
)
router.use(handleImageUploadError)

export default router
