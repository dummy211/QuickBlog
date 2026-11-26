import assert from 'node:assert/strict'
import { once } from 'node:events'
import { afterEach, test } from 'node:test'
import express from 'express'
import jwt from 'jsonwebtoken'
import Blog from '../models/Blog.js'
import Comment from '../models/Comment.js'
import adminRoutes from '../routes/adminRoutes.js'

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

async function withAdminApi(callback) {
  const app = express()
  app.use(express.json())
  app.use('/api/admin', adminRoutes)
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')

  try {
    const { port } = server.address()
    await callback(`http://127.0.0.1:${port}/api/admin`)
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

test('admin comment moderation filters by status and updates or deletes comments', async () => {
  process.env.JWT_SECRET = 'test-secret'
  const commentId = '0123456789abcdef01234567'
  const comments = [{ _id: commentId, isApproved: false, blog: { title: 'Post' } }]
  let queryFilter
  let populateArgs
  let sortOrder
  let commentMissing = false
  const updates = []
  stub(Comment, 'find', (filter) => {
    queryFilter = filter
    return {
      populate(...args) {
        populateArgs = args
        return {
          async sort(order) {
            sortOrder = order
            return comments
          },
        }
      },
    }
  })
  stub(Comment, 'findByIdAndUpdate', async (id, update) => {
    updates.push({ id, update })
    if (commentMissing) return null
    return { _id: id, ...update }
  })
  stub(Comment, 'findByIdAndDelete', async (id) => (commentMissing ? null : { _id: id }))

  await withAdminApi(async (baseUrl) => {
    const noToken = await fetch(`${baseUrl}/comments?status=pending`)
    assert.equal(noToken.status, 401)

    const headers = {
      Authorization: `Bearer ${createAdminToken()}`,
      'Content-Type': 'application/json',
    }
    const missingStatus = await fetch(`${baseUrl}/comments`, { headers })
    assert.equal(missingStatus.status, 400)
    const invalidStatus = await fetch(`${baseUrl}/comments?status=all`, { headers })
    assert.equal(invalidStatus.status, 400)

    const listResponse = await fetch(`${baseUrl}/comments?status=pending`, { headers })
    assert.equal(listResponse.status, 200)
    assert.deepEqual((await listResponse.json()).comments, comments)

    const approvalResponse = await fetch(`${baseUrl}/comments/${commentId}/approval`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ isApproved: true }),
    })
    assert.equal(approvalResponse.status, 200)

    const invalidApproval = await fetch(`${baseUrl}/comments/${commentId}/approval`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ isApproved: 'yes' }),
    })
    assert.equal(invalidApproval.status, 400)

    const invalidIdApproval = await fetch(`${baseUrl}/comments/not-an-id/approval`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ isApproved: true }),
    })
    assert.equal(invalidIdApproval.status, 400)

    const deleteResponse = await fetch(`${baseUrl}/comments/${commentId}`, {
      method: 'DELETE',
      headers,
    })
    assert.equal(deleteResponse.status, 200)

    commentMissing = true
    const missingApproval = await fetch(`${baseUrl}/comments/${commentId}/approval`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ isApproved: true }),
    })
    assert.equal(missingApproval.status, 404)

    const missingDelete = await fetch(`${baseUrl}/comments/${commentId}`, {
      method: 'DELETE',
      headers,
    })
    assert.equal(missingDelete.status, 404)
  })

  assert.deepEqual(queryFilter, { isApproved: false })
  assert.deepEqual(populateArgs, ['blog', 'title'])
  assert.deepEqual(sortOrder, { createdAt: -1 })
  assert.deepEqual(updates, [
    { id: commentId, update: { isApproved: true } },
    { id: commentId, update: { isApproved: true } },
  ])
})

test('dashboard statistics include counts and five recent blogs', async () => {
  process.env.JWT_SECRET = 'test-secret'
  const recentBlogs = [{ _id: 'recent-blog' }]
  const countQueries = []
  let sortOrder
  let limit
  stub(Blog, 'countDocuments', async (filter) => {
    countQueries.push(filter)
    return filter?.isPublished === true ? 3 : filter?.isPublished === false ? 2 : 0
  })
  stub(Comment, 'countDocuments', async () => 7)
  stub(Blog, 'find', () => ({
    sort(order) {
      sortOrder = order
      return {
        async limit(value) {
          limit = value
          return recentBlogs
        },
      }
    },
  }))

  await withAdminApi(async (baseUrl) => {
    const unauthorized = await fetch(`${baseUrl}/stats`)
    assert.equal(unauthorized.status, 401)

    const response = await fetch(`${baseUrl}/stats`, {
      headers: { Authorization: `Bearer ${createAdminToken()}` },
    })
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      success: true,
      stats: { publishedBlogs: 3, draftBlogs: 2, totalComments: 7 },
      recentBlogs,
    })
  })

  assert.deepEqual(countQueries, [{ isPublished: true }, { isPublished: false }])
  assert.deepEqual(sortOrder, { createdAt: -1 })
  assert.equal(limit, 5)
})
