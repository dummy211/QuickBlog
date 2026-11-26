import jwt from 'jsonwebtoken'

function sendUnauthorized(response) {
  return response.status(401).json({
    success: false,
    message: 'Authentication required',
  })
}

export function requireAdmin(request, response, next) {
  const authorization = request.headers?.authorization
  const match = typeof authorization === 'string'
    ? /^Bearer\s+(\S+)$/i.exec(authorization)
    : null

  if (!match) {
    return sendUnauthorized(response)
  }

  const { JWT_SECRET: jwtSecret } = process.env

  if (!jwtSecret) {
    console.error('Admin authentication configuration is missing: JWT_SECRET')
    return response.status(500).json({
      success: false,
      message: 'Authentication is temporarily unavailable',
    })
  }

  try {
    const payload = jwt.verify(match[1], jwtSecret, { algorithms: ['HS256'] })

    if (!payload || typeof payload !== 'object' || payload.sub !== 'admin') {
      return sendUnauthorized(response)
    }

    request.admin = { id: payload.sub }
    return next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return sendUnauthorized(response)
    }

    return next(error)
  }
}
