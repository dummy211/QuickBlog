import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import jwt from 'jsonwebtoken'
import { getAdminSession, loginAdmin } from '../controllers/adminController.js'
import { requireAdmin } from '../middleware/auth.js'

const authEnvironmentKeys = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'JWT_SECRET']
const originalEnvironment = Object.fromEntries(
  authEnvironmentKeys.map((key) => [key, process.env[key]])
)
const originalConsoleError = console.error

function restoreEnvironment() {
  for (const key of authEnvironmentKeys) {
    if (originalEnvironment[key] === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = originalEnvironment[key]
    }
  }
}

function configureAuthEnvironment() {
  process.env.ADMIN_EMAIL = 'admin@example.com'
  process.env.ADMIN_PASSWORD = 'correct horse battery staple'
  process.env.JWT_SECRET = 'test-secret-that-is-only-used-by-the-test-suite'
}

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(statusCode) {
      this.statusCode = statusCode
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
}

afterEach(() => {
  restoreEnvironment()
  console.error = originalConsoleError
})

test('login issues an HS256 admin token with a 24-hour expiry', () => {
  configureAuthEnvironment()
  const response = createResponse()

  loginAdmin(
    { body: { email: ' ADMIN@example.com ', password: process.env.ADMIN_PASSWORD } },
    response
  )

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.success, true)

  const payload = jwt.verify(response.body.token, process.env.JWT_SECRET, {
    algorithms: ['HS256'],
  })
  assert.equal(payload.sub, 'admin')
  assert.equal(payload.exp - payload.iat, 24 * 60 * 60)
})

test('login rejects missing fields and incorrect credentials', () => {
  configureAuthEnvironment()
  const missingFieldsResponse = createResponse()
  loginAdmin({ body: { email: 'admin@example.com' } }, missingFieldsResponse)
  assert.equal(missingFieldsResponse.statusCode, 400)

  const invalidEmailResponse = createResponse()
  loginAdmin({ body: { email: 'not-an-email', password: 'password' } }, invalidEmailResponse)
  assert.equal(invalidEmailResponse.statusCode, 400)

  const invalidCredentialsResponse = createResponse()
  loginAdmin(
    { body: { email: 'admin@example.com', password: 'wrong password' } },
    invalidCredentialsResponse
  )
  assert.equal(invalidCredentialsResponse.statusCode, 401)
  assert.equal(invalidCredentialsResponse.body.message, 'Invalid email or password')
})

test('login reports missing server auth configuration as an internal error', () => {
  delete process.env.ADMIN_EMAIL
  delete process.env.ADMIN_PASSWORD
  delete process.env.JWT_SECRET
  console.error = () => {}
  const response = createResponse()

  loginAdmin(
    { body: { email: 'admin@example.com', password: 'password' } },
    response
  )

  assert.equal(response.statusCode, 500)
  assert.equal(response.body.success, false)
  assert.equal(response.body.message, 'Authentication is temporarily unavailable')
})

test('session middleware accepts a valid admin token and session handler confirms it', () => {
  configureAuthEnvironment()
  const token = jwt.sign({ sub: 'admin' }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  })
  const request = { headers: { authorization: `Bearer ${token}` } }
  const response = createResponse()
  let nextCalled = false

  requireAdmin(
    request,
    response,
    () => {
      nextCalled = true
    }
  )

  assert.equal(nextCalled, true)
  assert.deepEqual(request.admin, { id: 'admin' })

  const sessionResponse = createResponse()
  getAdminSession({}, sessionResponse)
  assert.deepEqual(sessionResponse.body, { success: true, authenticated: true })
})

test('session middleware rejects missing, tampered, and expired tokens', () => {
  configureAuthEnvironment()
  const validToken = jwt.sign({ sub: 'admin' }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  })
  const nonAdminToken = jwt.sign({ sub: 'not-admin' }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  })
  const expiredToken = jwt.sign({ sub: 'admin' }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '-1s',
  })
  const requests = [
    { headers: {} },
    { headers: { authorization: 'Bearer not-a-token' } },
    { headers: { authorization: `Bearer ${validToken.slice(0, -1)}x` } },
    { headers: { authorization: `Bearer ${nonAdminToken}` } },
    { headers: { authorization: `Bearer ${expiredToken}` } },
  ]

  for (const request of requests) {
    const response = createResponse()
    let nextCalled = false

    requireAdmin(request, response, () => {
      nextCalled = true
    })

    assert.equal(response.statusCode, 401)
    assert.equal(response.body.success, false)
    assert.equal(nextCalled, false)
  }
})

test('session middleware reports missing JWT configuration as an internal error', () => {
  delete process.env.JWT_SECRET
  console.error = () => {}
  const response = createResponse()
  let nextCalled = false

  requireAdmin(
    { headers: { authorization: 'Bearer some-token' } },
    response,
    () => {
      nextCalled = true
    }
  )

  assert.equal(response.statusCode, 500)
  assert.equal(response.body.success, false)
  assert.equal(nextCalled, false)
})
