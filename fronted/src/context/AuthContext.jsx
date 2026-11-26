import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAdminSession, loginAdmin, setAdminToken, setUnauthorizedHandler } from '../api.js'
import { AuthContext } from './authContext.js'

const tokenStorageKey = 'quickblog_admin_token'

export function AuthProvider({ children }) {
  const [status, setStatus] = useState(() =>
    window.localStorage.getItem(tokenStorageKey) ? 'loading' : 'unauthenticated'
  )
  const [sessionError, setSessionError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(tokenStorageKey)
    setAdminToken(null)
    setSessionError('')
    setStatus('unauthenticated')
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(clearSession)
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  useEffect(() => {
    const token = window.localStorage.getItem(tokenStorageKey)

    if (!token) {
      setAdminToken(null)
      return undefined
    }

    setAdminToken(token)
    const controller = new AbortController()

    getAdminSession({ signal: controller.signal })
      .then((data) => {
        if (data?.success !== true || data?.authenticated !== true) {
          setStatus('error')
          setSessionError('The server returned an unexpected session response.')
          return
        }

        setStatus('authenticated')
        setSessionError('')
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return
        }

        if (error.response?.status === 401) {
          clearSession()
          return
        }

        const responseMessage = error.response?.data?.message
        setSessionError(
          typeof responseMessage === 'string'
            ? responseMessage
            : 'Unable to verify your admin session. Check your connection and try again.'
        )
        setStatus('error')
      })

    return () => controller.abort()
  }, [clearSession, retryCount])

  const login = useCallback(async (email, password) => {
    const data = await loginAdmin(email, password)

    if (data?.success !== true || typeof data.token !== 'string' || !data.token) {
      throw new Error('The server returned an unexpected login response.')
    }

    window.localStorage.setItem(tokenStorageKey, data.token)
    setAdminToken(data.token)
    setSessionError('')
    setStatus('authenticated')
  }, [])

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const retrySession = useCallback(() => {
    setSessionError('')
    setStatus('loading')
    setRetryCount((count) => count + 1)
  }, [])

  const value = useMemo(
    () => ({ status, sessionError, login, logout, retrySession }),
    [status, sessionError, login, logout, retrySession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
