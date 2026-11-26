import assert from 'node:assert/strict'
import { once } from 'node:events'
import { afterEach, test } from 'node:test'
import express from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import Blog from '../models/Blog.js'
import Comment from '../models/Comment.js'
import adminRoutes from '../routes/adminRoutes.js'
import blogRoutes from '../routes/blogRoutes.js'

const originalJwtSecret = process.env.JWT_SECRET
const originalConsoleError = console.error
const restorers = []

function stub(target, name, replacement) {
  const original = target[name]
  target[name] = replacement
  restorers.push(() => {
    target[name] = original
  })
}

function createAdminToken() {
  return jwt.sign({ sub: 'admin' }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  })
}

function sortedQuery(value, onSort = () => {}) {
  return {
    async sort(order) {
      onSort(order)
      return value
    },
  }
}

async function withApi(callback) {
  const app = express()
  app.use(express.json())
  app.use('/api/admin', adminRoutes)
  app.use('/api/blog', blogRoutes)
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')

  try {
    const { port } = server.address()
    await callback(`http://127.0.0.1:${port}`)
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
}

afterEach(() => {
  while (restorers.length) restorers.pop()()
  console.error = originalConsoleError

  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET
  } else {
    process.env.JWT_SECRET = originalJwtSecret
  }
})

test('public listing includes only published blogs and sorts newest first', async () => {
  const blogs = [{ _id: 'published-blog', isPublished: true }]
  let filter
  let sortOrder
  stub(Blog, 'find', (query) => {
    filter = query
    return sortedQuery(blogs, (order) => {
      sortOrder = order
    })
  })

  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/blog/all`)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { success: true, blogs })
  })

  assert.deepEqual(filter, { isPublished: true })
  assert.deepEqual(sortOrder, { createdAt: -1 })
})

test('public detail returns only approved comments and hides drafts', async () => {
  const blogId = '0123456789abcdef01234567'
  const blog = { _id: blogId, isPublished: true }
  const comments = [{ _id: 'approved-comment', isApproved: true }]
  let commentFilter
  stub(Blog, 'findOne', async (filter) => (filter.isPublished ? blog : null))
  stub(Comment, 'find', (filter) => {
    commentFilter = filter
    return sortedQuery(comments)
  })

  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/blog/${blogId}`)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { success: true, blog, comments })

    const invalidIdResponse = await fetch(`${baseUrl}/api/blog/not-an-object-id`)
    assert.equal(invalidIdResponse.status, 400)

    stub(Blog, 'findOne', async () => null)
    const draftResponse = await fetch(`${baseUrl}/api/blog/${blogId}`)
    assert.equal(draftResponse.status, 404)
  })

  assert.deepEqual(commentFilter, { blog: blogId, isApproved: true })
})

test('public comment submission creates pending comments and rejects approval fields', async () => {
  const blogId = '0123456789abcdef01234567'
  let createdComment
  stub(Blog, 'exists', async () => ({ _id: blogId }))
  stub(Comment, 'create', async (comment) => {
    createdComment = comment
    return comment
  })

  await withApi(async (baseUrl) => {
    const endpoint = `${baseUrl}/api/blog/${blogId}/comments`
    const attemptedApproval = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Reader', content: 'Nice post', isApproved: true }),
    })
    assert.equal(attemptedApproval.status, 400)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: ' Reader ', content: ' Nice post ' }),
    })
    assert.equal(response.status, 201)
    assert.deepEqual(await response.json(), {
      success: true,
      message: 'Comment submitted for review.',
    })
  })

  assert.deepEqual(createdComment, {
    blog: blogId,
    name: 'Reader',
    content: 'Nice post',
    isApproved: false,
  })
})

test('admin blog list and create/update/publish routes require auth and preserve publication state', async () => {
  process.env.JWT_SECRET = 'test-secret'
  const blogId = '0123456789abcdef01234567'
  const blogs = [{ _id: blogId, isPublished: false }]
  const updateCalls = []
  stub(Blog, 'find', () => sortedQuery(blogs))
  stub(Blog, 'create', async (data) => ({ _id: blogId, ...data, isPublished: false }))
  stub(Blog, 'findByIdAndUpdate', async (id, update) => {
    updateCalls.push({ id, update })
    return { _id: id, ...update }
  })

  await withApi(async (baseUrl) => {
    const unauthorized = await fetch(`${baseUrl}/api/admin/blogs`)
    assert.equal(unauthorized.status, 401)

    const headers = {
      Authorization: `Bearer ${createAdminToken()}`,
      'Content-Type': 'application/json',
    }
    const listResponse = await fetch(`${baseUrl}/api/admin/blogs`, { headers })
    assert.equal(listResponse.status, 200)
    assert.deepEqual((await listResponse.json()).blogs, blogs)

    const createResponse = await fetch(`${baseUrl}/api/blog`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Title',
        author: 'Author',
        description: '<p>Body</p>',
        category: 'Technology',
        image: 'https://images.example.test/blog.webp',
      }),
    })
    assert.equal(createResponse.status, 201)
    assert.equal((await createResponse.json()).blog.isPublished, false)

    const updateResponse = await fetch(`${baseUrl}/api/blog/${blogId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        title: 'Updated',
        author: 'Author',
        description: '<p>Updated body</p>',
        category: 'Startup',
        image: 'https://images.example.test/blog.webp',
      }),
    })
    assert.equal(updateResponse.status, 200)

    const publishResponse = await fetch(`${baseUrl}/api/blog/${blogId}/publish`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ isPublished: true }),
    })
    assert.equal(publishResponse.status, 200)

    const invalidPublishResponse = await fetch(`${baseUrl}/api/blog/${blogId}/publish`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ isPublished: 'true' }),
    })
    assert.equal(invalidPublishResponse.status, 400)
  })

  assert.deepEqual(updateCalls, [
    {
      id: blogId,
      update: {
        title: 'Updated',
        author: 'Author',
        description: '<p>Updated body</p>',
        category: 'Startup',
        image: 'https://images.example.test/blog.webp',
        subtitle: '',
      },
    },
    { id: blogId, update: { isPublished: true } },
  ])
})

test('blog deletion removes related comments in a transaction and returns failure on cleanup error', async () => {
  process.env.JWT_SECRET = 'test-secret'
  const blogId = '0123456789abcdef01234567'
  const transactionCalls = []
  let shouldFailCleanup = false
  const session = {
    async withTransaction(operation) {
      transactionCalls.push('start')
      await operation()
      transactionCalls.push('commit')
    },
    async endSession() {
      transactionCalls.push('end')
    },
  }
  stub(mongoose, 'startSession', async () => session)
  stub(Blog, 'findByIdAndDelete', async (_id, options) => {
    assert.equal(options.session, session)
    return { _id: blogId }
  })
  stub(Comment, 'deleteMany', async (filter, options) => {
    assert.deepEqual(filter, { blog: blogId })
    assert.equal(options.session, session)
    if (shouldFailCleanup) throw new Error('database details must not reach clients')
    return { deletedCount: 2 }
  })
  const loggedErrors = []
  console.error = (...values) => loggedErrors.push(values.join(' '))

  await withApi(async (baseUrl) => {
    const headers = { Authorization: `Bearer ${createAdminToken()}` }
    const success = await fetch(`${baseUrl}/api/blog/${blogId}`, {
      method: 'DELETE',
      headers,
    })
    assert.equal(success.status, 200)
    assert.match((await success.json()).message, /related comments deleted/)

    shouldFailCleanup = true
    const failed = await fetch(`${baseUrl}/api/blog/${blogId}`, {
      method: 'DELETE',
      headers,
    })
    assert.equal(failed.status, 500)
    const body = await failed.json()
    assert.equal(body.message.includes('database details'), false)
  })

  assert.equal(transactionCalls.filter((call) => call === 'start').length, 2)
  assert.equal(transactionCalls.filter((call) => call === 'end').length, 2)
  assert.equal(transactionCalls.filter((call) => call === 'commit').length, 1)
  assert.equal(loggedErrors.some((entry) => entry.includes('database details')), false)
})
