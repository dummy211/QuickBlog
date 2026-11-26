import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/authContext.js'

function Login() {
  const { login, status } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  if (status === 'authenticated') {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (status === 'loading') {
    return (
      <p role="status" className="mt-8 text-center text-sm text-[var(--color-muted)]">
        Checking admin session...
      </p>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setIsSubmitting(true)

    try {
      await login(email, password)
    } catch (error) {
      const responseMessage = error.response?.data?.message
      setMessage(
        typeof responseMessage === 'string'
          ? responseMessage
          : error.message || 'Unable to sign in. Check your connection and try again.'
      )
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto mt-12 w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm sm:mt-16 sm:p-9">
      <div className="text-center">
        <p className="text-sm font-semibold text-[var(--color-primary)]">Admin workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-ink)]">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          Sign in to manage your QuickBlog workspace.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-[var(--color-ink)]">
            Email address
          </label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-accent)]"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-[var(--color-ink)]">
            Password
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-accent)]"
            placeholder="Enter your password"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="min-h-5 text-center text-sm text-[var(--color-muted)]" role="alert" aria-live="polite">
          {message}
        </p>
      </form>

      <div className="mt-4 border-t border-[var(--color-border)] pt-5 text-center">
        <Link
          to="/"
          className="text-sm font-semibold text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          Back to the public site
        </Link>
      </div>
    </section>
  )
}

export default Login
