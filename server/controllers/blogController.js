import mongoose from 'mongoose'
import Blog from '../models/Blog.js'
import Comment from '../models/Comment.js'

const categories = new Set(['Technology', 'Startup', 'Lifestyle', 'Finance'])
const blogFields = ['title', 'subtitle', 'author', 'description', 'category', 'image']

function isObjectBody(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasOnlyFields(body, allowedFields) {
  return Object.keys(body).every((field) => allowedFields.includes(field))
}

function isValidId(value) {
  return typeof value === 'string' && /^[\da-f]{24}$/i.test(value)
}

function isHttpUrl(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname)
  } catch {
    return false
  }
}

function normalizeBlogBody(body, { creating }) {
  const allowedFields = creating ? [...blogFields, 'isPublished'] : blogFields
  if (!isObjectBody(body) || !hasOnlyFields(body, allowedFields)) return null

  const values = {}
  for (const field of ['title', 'author', 'description', 'category', 'image']) {
    if (typeof body[field] !== 'string' || !body[field].trim()) return null
    values[field] = body[field].trim()
  }

  if (body.subtitle !== undefined) {
    if (typeof body.subtitle !== 'string') return null
    values.subtitle = body.subtitle.trim()
  } else if (!creating) {
    values.subtitle = ''
  }

  if (!categories.has(values.category) || !isHttpUrl(values.image)) return null

  if (creating && body.isPublished !== undefined) {
    if (typeof body.isPublished !== 'boolean') return null
    values.isPublished = body.isPublished
  }

  return values
}

function sendDatabaseError(response, operation, error) {
  const errorName = error instanceof Error ? error.name : 'UnknownError'
  console.error(`${operation} failed (${errorName})`)
  return response.status(500).json({
    success: false,
    message: 'The request could not be completed.',
  })
}

export async function getAllBlogs(_request, response) {
  try {
    const blogs = await Blog.find({ isPublished: true }).sort({ createdAt: -1 })
    return response.status(200).json({ success: true, blogs })
  } catch (error) {
    return sendDatabaseError(response, 'Public blog listing', error)
  }
}

export async function getBlogById(request, response) {
  const { id } = request.params
  if (!isValidId(id)) {
    return response.status(400).json({ success: false, message: 'Invalid blog ID.' })
  }

  try {
    const blog = await Blog.findOne({ _id: id, isPublished: true })
    if (!blog) {
      return response.status(404).json({ success: false, message: 'Blog not found.' })
    }

    const comments = await Comment.find({ blog: id, isApproved: true }).sort({
      createdAt: -1,
    })
    return response.status(200).json({ success: true, blog, comments })
  } catch (error) {
    return sendDatabaseError(response, 'Public blog detail', error)
  }
}

export async function getAdminBlogs(_request, response) {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 })
    return response.status(200).json({ success: true, blogs })
  } catch (error) {
    return sendDatabaseError(response, 'Admin blog listing', error)
  }
}

export async function createBlog(request, response) {
  const blogData = normalizeBlogBody(request.body, { creating: true })
  if (!blogData) {
    return response.status(400).json({
      success: false,
      message: 'A valid title, author, description, category, and HTTP(S) image URL are required.',
    })
  }

  try {
    const blog = await Blog.create(blogData)
    return response.status(201).json({
      success: true,
      message: 'Blog created successfully.',
      blog,
    })
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      return response.status(400).json({ success: false, message: 'Blog fields are invalid.' })
    }
    return sendDatabaseError(response, 'Blog creation', error)
  }
}

export async function updateBlog(request, response) {
  const { id } = request.params
  if (!isValidId(id)) {
    return response.status(400).json({ success: false, message: 'Invalid blog ID.' })
  }

  const blogData = normalizeBlogBody(request.body, { creating: false })
  if (!blogData) {
    return response.status(400).json({
      success: false,
      message: 'Valid title, author, description, category, and HTTP(S) image URL are required.',
    })
  }

  try {
    const blog = await Blog.findByIdAndUpdate(id, blogData, {
      new: true,
      runValidators: true,
    })
    if (!blog) {
      return response.status(404).json({ success: false, message: 'Blog not found.' })
    }
    return response.status(200).json({ success: true, message: 'Blog updated successfully.', blog })
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      return response.status(400).json({ success: false, message: 'Blog fields are invalid.' })
    }
    return sendDatabaseError(response, 'Blog update', error)
  }
}

export async function setBlogPublication(request, response) {
  const { id } = request.params
  if (!isValidId(id)) {
    return response.status(400).json({ success: false, message: 'Invalid blog ID.' })
  }

  const body = request.body
  if (
    !isObjectBody(body) ||
    !hasOnlyFields(body, ['isPublished']) ||
    typeof body.isPublished !== 'boolean'
  ) {
    return response.status(400).json({
      success: false,
      message: 'A boolean isPublished value is required.',
    })
  }

  try {
    const blog = await Blog.findByIdAndUpdate(
      id,
      { isPublished: body.isPublished },
      { new: true, runValidators: true }
    )
    if (!blog) {
      return response.status(404).json({ success: false, message: 'Blog not found.' })
    }
    return response.status(200).json({
      success: true,
      message: 'Blog publication status updated.',
      blog,
    })
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      return response.status(400).json({ success: false, message: 'Blog fields are invalid.' })
    }
    return sendDatabaseError(response, 'Blog publication update', error)
  }
}

export async function deleteBlog(request, response) {
  const { id } = request.params
  if (!isValidId(id)) {
    return response.status(400).json({ success: false, message: 'Invalid blog ID.' })
  }

  let session
  try {
    session = await mongoose.startSession()
    let deletedBlog

    await session.withTransaction(async () => {
      deletedBlog = await Blog.findByIdAndDelete(id, { session })
      if (deletedBlog) {
        await Comment.deleteMany({ blog: id }, { session })
      }
    })

    if (!deletedBlog) {
      return response.status(404).json({ success: false, message: 'Blog not found.' })
    }

    return response.status(200).json({
      success: true,
      message: 'Blog and related comments deleted successfully.',
    })
  } catch (error) {
    return sendDatabaseError(response, 'Blog deletion', error)
  } finally {
    if (session) await session.endSession()
  }
}
