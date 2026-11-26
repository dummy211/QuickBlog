import mongoose from 'mongoose'
import Blog from '../models/Blog.js'
import Comment from '../models/Comment.js'

function isObjectBody(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasOnlyFields(body, allowedFields) {
  return Object.keys(body).every((field) => allowedFields.includes(field))
}

function isValidId(value) {
  return typeof value === 'string' && /^[\da-f]{24}$/i.test(value)
}

function sendDatabaseError(response, operation, error) {
  const errorName = error instanceof Error ? error.name : 'UnknownError'
  console.error(`${operation} failed (${errorName})`)
  return response.status(500).json({
    success: false,
    message: 'The request could not be completed.',
  })
}

export async function submitComment(request, response) {
  const { id: blogId } = request.params
  if (!isValidId(blogId)) {
    return response.status(400).json({ success: false, message: 'Invalid blog ID.' })
  }

  const body = request.body
  if (
    !isObjectBody(body) ||
    !hasOnlyFields(body, ['name', 'content']) ||
    typeof body.name !== 'string' ||
    !body.name.trim() ||
    typeof body.content !== 'string' ||
    !body.content.trim()
  ) {
    return response.status(400).json({
      success: false,
      message: 'A name and comment are required.',
    })
  }

  try {
    const blogExists = await Blog.exists({ _id: blogId, isPublished: true })
    if (!blogExists) {
      return response.status(404).json({ success: false, message: 'Blog not found.' })
    }

    await Comment.create({
      blog: blogId,
      name: body.name.trim(),
      content: body.content.trim(),
      isApproved: false,
    })
    return response.status(201).json({
      success: true,
      message: 'Comment submitted for review.',
    })
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      return response.status(400).json({ success: false, message: 'Comment fields are invalid.' })
    }
    return sendDatabaseError(response, 'Comment submission', error)
  }
}

export async function getAdminComments(request, response) {
  const { status } = request.query
  if (status !== 'pending' && status !== 'approved') {
    return response.status(400).json({
      success: false,
      message: 'Status must be pending or approved.',
    })
  }

  try {
    const comments = await Comment.find({ isApproved: status === 'approved' })
      .populate('blog', 'title')
      .sort({ createdAt: -1 })
    return response.status(200).json({ success: true, comments })
  } catch (error) {
    return sendDatabaseError(response, 'Admin comment listing', error)
  }
}

export async function setCommentApproval(request, response) {
  const { id } = request.params
  if (!isValidId(id)) {
    return response.status(400).json({ success: false, message: 'Invalid comment ID.' })
  }

  const body = request.body
  if (
    !isObjectBody(body) ||
    !hasOnlyFields(body, ['isApproved']) ||
    typeof body.isApproved !== 'boolean'
  ) {
    return response.status(400).json({
      success: false,
      message: 'A boolean isApproved value is required.',
    })
  }

  try {
    const comment = await Comment.findByIdAndUpdate(
      id,
      { isApproved: body.isApproved },
      { new: true, runValidators: true }
    )
    if (!comment) {
      return response.status(404).json({ success: false, message: 'Comment not found.' })
    }
    return response.status(200).json({
      success: true,
      message: 'Comment moderation status updated.',
      comment,
    })
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      return response.status(400).json({ success: false, message: 'Comment fields are invalid.' })
    }
    return sendDatabaseError(response, 'Comment moderation update', error)
  }
}

export async function deleteComment(request, response) {
  const { id } = request.params
  if (!isValidId(id)) {
    return response.status(400).json({ success: false, message: 'Invalid comment ID.' })
  }

  try {
    const comment = await Comment.findByIdAndDelete(id)
    if (!comment) {
      return response.status(404).json({ success: false, message: 'Comment not found.' })
    }
    return response.status(200).json({ success: true, message: 'Comment deleted successfully.' })
  } catch (error) {
    return sendDatabaseError(response, 'Comment deletion', error)
  }
}
