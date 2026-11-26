import { Router } from 'express'
import {
  createBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
  setBlogPublication,
  updateBlog,
} from '../controllers/blogController.js'
import { submitComment } from '../controllers/commentController.js'
import { uploadBlogImage } from '../controllers/imageUploadController.js'
import { requireAdmin } from '../middleware/auth.js'
import {
  handleImageUploadError,
  receiveImage,
  validateImageContent,
} from '../middleware/multer.js'

const router = Router()

router.get('/all', getAllBlogs)
router.post(
  '/upload',
  requireAdmin,
  receiveImage,
  validateImageContent,
  uploadBlogImage
)

router.post('/:id/comments', submitComment)
router.post('/', requireAdmin, createBlog)
router.put('/:id', requireAdmin, updateBlog)
router.patch('/:id/publish', requireAdmin, setBlogPublication)
router.delete('/:id', requireAdmin, deleteBlog)
router.get('/:id', getBlogById)
router.use(handleImageUploadError)

export default router
