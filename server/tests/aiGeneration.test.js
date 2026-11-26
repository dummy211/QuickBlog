import assert from 'node:assert/strict'
import { once } from 'node:events'
import { afterEach, test } from 'node:test'
import express from 'express'
import jwt from 'jsonwebtoken'
import { gemini } from '../configs/gemini.js'
import blogRoutes from '../routes/blogRoutes.js'

const originalJwtSecret = process.env.JWT_SECRET
const originalGeminiApiKey = process.env.GEMINI_API_KEY
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

async function withApi(callback) {
  const app = express()
  app.use(express.json())
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

function requestGeneration(baseUrl, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  return fetch(`${baseUrl}/api/blog/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

afterEach(() => {
  while (restorers.length) restorers.pop()()
  console.error = originalConsoleError

  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET
  } else {
    process.env.JWT_SECRET = originalJwtSecret
  }

  if (originalGeminiApiKey === undefined) {
    delete process.env.GEMINI_API_KEY
  } else {
    process.env.GEMINI_API_KEY = originalGeminiApiKey
  }
})

test('AI article generation requires admin authentication and does not invoke Gemini', async () => {
  process.env.JWT_SECRET = 'test-secret'
  let generationCalls = 0
  stub(gemini, 'generateArticle', async () => {
    generationCalls += 1
    return 'Generated article'
  })

  await withApi(async (baseUrl) => {
    const response = await requestGeneration(baseUrl, { title: 'A title' })
    assert.equal(response.status, 401)
    assert.equal((await response.json()).success, false)
  })

  assert.equal(generationCalls, 0)
})

test('AI article generation validates fields and limits before calling Gemini', async () => {
  process.env.JWT_SECRET = 'test-secret'
  let generationCalls = 0
  stub(gemini, 'generateArticle', async () => {
    generationCalls += 1
    return 'Generated article'
  })
  const token = createAdminToken()
  const invalidBodies = [
    {},
    { title: '  ' },
    { title: 42 },
    { title: 't'.repeat(201) },
    { title: 'A title', subtitle: 's'.repeat(501) },
    { title: 'A title', unexpected: true },
    [],
  ]

  await withApi(async (baseUrl) => {
    for (const body of invalidBodies) {
      const response = await requestGeneration(baseUrl, body, token)
      assert.equal(response.status, 400)
      assert.equal((await response.json()).success, false)
    }
  })

  assert.equal(generationCalls, 0)
})

test('AI article generation returns Markdown from the provider', async () => {
  process.env.JWT_SECRET = 'test-secret'
  let receivedInput
  stub(gemini, 'generateArticle', async (input) => {
    receivedInput = input
    return '# Generated article\n\nDraft body.'
  })
  const token = createAdminToken()

  await withApi(async (baseUrl) => {
    const response = await requestGeneration(
      baseUrl,
      { title: '  Article title  ', subtitle: '  Supporting idea  ' },
      token
    )
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      success: true,
      content: '# Generated article\n\nDraft body.',
    })
  })

  assert.deepEqual(receivedInput, {
    title: 'Article title',
    subtitle: 'Supporting idea',
  })
})

test('AI article generation reports missing provider configuration safely', async () => {
  process.env.JWT_SECRET = 'test-secret'
  delete process.env.GEMINI_API_KEY
  console.error = () => {}
  const token = createAdminToken()

  await withApi(async (baseUrl) => {
    const response = await requestGeneration(baseUrl, { title: 'A title' }, token)
    assert.equal(response.status, 500)
    const body = await response.json()
    assert.equal(body.success, false)
    assert.equal(body.message.includes('GEMINI_API_KEY'), false)
  })
})

test('AI provider failures and empty output return safe non-success responses', async () => {
  process.env.JWT_SECRET = 'test-secret'
  process.env.GEMINI_API_KEY = 'AIza123456789012345678901234567890123'
  const loggedErrors = []
  console.error = (...values) => loggedErrors.push(values.join(' '))
  const token = createAdminToken()

  stub(gemini, 'generateArticle', async () => {
    const error = new Error(
      'Internal Server Error: request failed for key AIza123456789012345678901234567890123'
    )
    error.status = 500
    throw error
  })

  await withApi(async (baseUrl) => {
    const failed = await requestGeneration(baseUrl, { title: 'A title' }, token)
    assert.equal(failed.status, 502)
    const failedBody = await failed.json()
    assert.equal(failedBody.success, false)
    assert.equal(JSON.stringify(failedBody).includes('Internal Server Error'), false)

    stub(gemini, 'generateArticle', async () => {
      const error = new Error(
        'gemini-4-hydrogen is currently experiencing high demand'
      )
      error.status = 503
      throw error
    })
    const unavailable = await requestGeneration(baseUrl, { title: 'A title' }, token)
    assert.equal(unavailable.status, 503)
    assert.deepEqual(await unavailable.json(), {
      success: false,
      message: 'The AI service is temporarily busy. Please try again shortly.',
    })

    stub(gemini, 'generateArticle', async () => '  ')
    const empty = await requestGeneration(baseUrl, { title: 'A title' }, token)
    assert.equal(empty.status, 502)
    assert.equal((await empty.json()).success, false)
  })

  assert.equal(loggedErrors.some((entry) => entry.includes('status=500')), true)
  assert.equal(loggedErrors.some((entry) => entry.includes('status=503')), true)
  assert.equal(loggedErrors.some((entry) => entry.includes('Internal Server Error')), true)
  assert.equal(loggedErrors.some((entry) => entry.includes(process.env.GEMINI_API_KEY)), false)
})
