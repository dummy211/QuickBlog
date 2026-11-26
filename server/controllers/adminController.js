import jwt from 'jsonwebtoken'

const tokenLifetimeSeconds = 24 * 60 * 60
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getAdminAuthConfiguration() {
  const missing = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'JWT_SECRET'].filter(
    (name) => !process.env[name]?.trim()
  )

  if (missing.length > 0) {
    console.error(`Admin authentication configuration is missing: ${missing.join(', ')}`)
    return null
  }

  return {
    email: process.env.ADMIN_EMAIL.trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD,
    jwtSecret: process.env.JWT_SECRET,
  }
}

export function loginAdmin(request, response) {
  const body =
    request.body && typeof request.body === 'object' && !Array.isArray(request.body)
      ? request.body
      : {}
  const { email, password } = body

  if (
    typeof email !== 'string' ||
    !emailPattern.test(email.trim()) ||
    typeof password !== 'string' ||
    !password
  ) {
    return response.status(400).json({
      success: false,
      message: 'A valid email and password are required',
    })
  }

  const configuration = getAdminAuthConfiguration()

  if (!configuration) {
    return response.status(500).json({
      success: false,
      message: 'Authentication is temporarily unavailable',
    })
  }

  if (
    email.trim().toLowerCase() !== configuration.email ||
    password !== configuration.password
  ) {
    return response.status(401).json({
      success: false,
      message: 'Invalid email or password',
    })
  }

  const token = jwt.sign(
    { sub: 'admin' },
    configuration.jwtSecret,
    { algorithm: 'HS256', expiresIn: tokenLifetimeSeconds }
  )

  return response.status(200).json({ success: true, token })
}

export function getAdminSession(_request, response) {
  return response.status(200).json({ success: true, authenticated: true })
}
