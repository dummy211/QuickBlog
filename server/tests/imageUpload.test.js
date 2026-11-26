import assert from 'node:assert/strict'
import { once } from 'node:events'
import { afterEach, test } from 'node:test'
import express from 'express'
import jwt from 'jsonwebtoken'
import { getImageKitClient } from '../configs/imagekit.js'
import { detectImageType } from '../middleware/multer.js'
import blogRoutes from '../routes/blogRoutes.js'

const environmentKeys = [
  'IMAGEKIT_PUBLIC_KEY',
  'IMAGEKIT_PRIVATE_KEY',
  'IMAGEKIT_URL_ENDPOINT',
  'JWT_SECRET',
]
const originalEnvironment = Object.fromEntries(
  environmentKeys.map((key) => [key, process.env[key]])
)
const originalConsoleError = console.error
let restoreImageKitMethods = () => {}

function configureEnvironment() {
  process.env.IMAGEKIT_PUBLIC_KEY = 'test-public-key'
  process.env.IMAGEKIT_PRIVATE_KEY = 'test-private-key'
  process.env.IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/test-id'
  process.env.JWT_SECRET = 'test-jwt-secret'
}

function createPng() {
  function createChunk(type, data) {
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length)
    return Buffer.concat([length, Buffer.from(type), data, Buffer.alloc(4)])
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(1, 0)
  header.writeUInt32BE(1, 4)
  header[8] = 8
  header[9] = 2

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    createChunk('IHDR', header),
    createChunk('IDAT', Buffer.from([0])),
    createChunk('IEND', Buffer.alloc(0)),
  ])
}

function createJpeg() {
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    Buffer.from([
      0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
    ]),
    Buffer.from([0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00]),
    Buffer.from([0x00, 0xff, 0xd9]),
  ])
}

function createWebp() {
  const riffSize = Buffer.alloc(4)
  riffSize.writeUInt32LE(22)
  const chunkSize = Buffer.alloc(4)
  chunkSize.writeUInt32LE(10)

  return Buffer.concat([
    Buffer.from('RIFF'),
    riffSize,
    Buffer.from('WEBPVP8X'),
    chunkSize,
    Buffer.alloc(10),
  ])
}

function mockImageKit({ upload, url }) {
  const imageKit = getImageKitClient()
  const originalUpload = imageKit.upload
  const originalUrl = imageKit.url
  imageKit.upload = upload
  imageKit.url = url
  restoreImageKitMethods = () => {
    imageKit.upload = originalUpload
    imageKit.url = originalUrl
  }
}

function createFormData({
  file = createPng(),
  type = 'image/png',
  name = 'thumbnail.png',
} = {}) {
  const formData = new FormData()
  formData.append('image', new Blob([file], { type }), name)
  return formData
}

function createAdminToken() {
  return jwt.sign({ sub: 'admin' }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  })
}

async function withBlogRouter(callback) {
  const app = express()
  app.use('/api/blog', blogRoutes)
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')

  try {
    const { port } = server.address()
    await callback(`http://127.0.0.1:${port}/api/blog/upload`)
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
}

afterEach(() => {
  restoreImageKitMethods()
  restoreImageKitMethods = () => {}
  console.error = originalConsoleError

  for (const key of environmentKeys) {
    if (originalEnvironment[key] === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = originalEnvironment[key]
    }
  }
})

test('detects valid JPEG, PNG, and WebP content and rejects invalid bytes', () => {
  assert.deepEqual(detectImageType(createJpeg()), { mimeType: 'image/jpeg', extension: 'jpg' })
  assert.deepEqual(detectImageType(createPng()), { mimeType: 'image/png', extension: 'png' })
  assert.deepEqual(detectImageType(createWebp()), { mimeType: 'image/webp', extension: 'webp' })
  assert.equal(detectImageType(Buffer.from('not an image')), null)
  assert.equal(detectImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47])), null)
})

test('authenticated upload returns an optimized ImageKit URL', async () => {
  configureEnvironment()
  let uploadOptions
  let urlOptions
  const imageUrl =
    'https://ik.imagekit.io/test-id/tr:q-auto,f-webp,w-1280/blog-thumbnail.webp'

  mockImageKit({
    upload: async (options) => {
      uploadOptions = options
      return { filePath: '/blog-thumbnail.png' }
    },
    url: (options) => {
      urlOptions = options
      return imageUrl
    },
  })

  await withBlogRouter(async (endpoint) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${createAdminToken()}` },
      body: createFormData({ name: '../../untrusted.png' }),
    })

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { success: true, imageUrl })
  })

  assert.deepEqual(uploadOptions.file, createPng())
  assert.match(uploadOptions.fileName, /^blog-thumbnail-[0-9a-f-]{36}\.png$/)
  assert.deepEqual(urlOptions, {
    path: '/blog-thumbnail.png',
    transformation: [{ quality: 'auto', format: 'webp', width: '1280' }],
  })
})

test('rejects unauthenticated uploads before calling ImageKit', async () => {
  configureEnvironment()
  let uploadCalled = false
  mockImageKit({
    upload: async () => {
      uploadCalled = true
      return { filePath: '/unexpected.png' }
    },
    url: () => 'https://ik.imagekit.io/test-id/unexpected.png',
  })

  await withBlogRouter(async (endpoint) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: createFormData(),
    })

    assert.equal(response.status, 401)
    assert.deepEqual(await response.json(), {
      success: false,
      message: 'Authentication required',
    })
  })

  assert.equal(uploadCalled, false)
})

test('rejects missing, invalid, mismatched, multiple, and oversized uploads', async () => {
  configureEnvironment()
  let uploadCalled = false
  mockImageKit({
    upload: async () => {
      uploadCalled = true
      return { filePath: '/unexpected.png' }
    },
    url: () => 'https://ik.imagekit.io/test-id/unexpected.png',
  })
  const authorization = { Authorization: `Bearer ${createAdminToken()}` }

  await withBlogRouter(async (endpoint) => {
    const missingResponse = await fetch(endpoint, {
      method: 'POST',
      headers: authorization,
      body: new FormData(),
    })
    assert.equal(missingResponse.status, 400)

    const invalidResponse = await fetch(endpoint, {
      method: 'POST',
      headers: authorization,
      body: createFormData({ file: Buffer.from('not an image') }),
    })
    assert.equal(invalidResponse.status, 400)

    const mismatchedResponse = await fetch(endpoint, {
      method: 'POST',
      headers: authorization,
      body: createFormData({ type: 'image/jpeg' }),
    })
    assert.equal(mismatchedResponse.status, 400)

    const multipleFiles = new FormData()
    multipleFiles.append('image', new Blob([createPng()], { type: 'image/png' }), 'one.png')
    multipleFiles.append('image', new Blob([createPng()], { type: 'image/png' }), 'two.png')
    const multipleResponse = await fetch(endpoint, {
      method: 'POST',
      headers: authorization,
      body: multipleFiles,
    })
    assert.equal(multipleResponse.status, 400)

    const oversizedResponse = await fetch(endpoint, {
      method: 'POST',
      headers: authorization,
      body: createFormData({ file: Buffer.alloc(5 * 1024 * 1024 + 1) }),
    })
    assert.equal(oversizedResponse.status, 413)
  })

  assert.equal(uploadCalled, false)
})

test('returns a safe error when ImageKit upload fails', async () => {
  configureEnvironment()
  const loggedErrors = []
  console.error = (...values) => loggedErrors.push(values.join(' '))
  mockImageKit({
    upload: async () => {
      throw new Error('sensitive provider response')
    },
    url: () => 'https://ik.imagekit.io/test-id/unexpected.png',
  })

  await withBlogRouter(async (endpoint) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${createAdminToken()}` },
      body: createFormData(),
    })

    assert.equal(response.status, 502)
    const body = await response.json()
    assert.equal(body.success, false)
    assert.equal(body.message.includes('sensitive provider response'), false)
  })

  assert.equal(loggedErrors.some((entry) => entry.includes('sensitive provider response')), false)
})

test('returns a server error when ImageKit configuration is missing', async () => {
  configureEnvironment()
  delete process.env.IMAGEKIT_PUBLIC_KEY
  delete process.env.IMAGEKIT_PRIVATE_KEY
  delete process.env.IMAGEKIT_URL_ENDPOINT
  const loggedErrors = []
  console.error = (...values) => loggedErrors.push(values.join(' '))

  await withBlogRouter(async (endpoint) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt.sign({ sub: 'admin' }, 'test-jwt-secret', {
          algorithm: 'HS256',
        })}`,
      },
      body: createFormData(),
    })

    assert.equal(response.status, 500)
    assert.deepEqual(await response.json(), {
      success: false,
      message: 'Image uploads are temporarily unavailable.',
    })
  })

  assert.equal(loggedErrors.length, 1)
  assert.match(loggedErrors[0], /IMAGEKIT_PUBLIC_KEY/)
  assert.equal(loggedErrors[0].includes('test-private-key'), false)
})
