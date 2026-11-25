import { useState } from 'react'
import { Link } from 'react-router-dom'

function Login() {
  const [message, setMessage] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setMessage('Preview only: sign-in is not connected, and no credentials were sent.')
  }

  return (
    <section className="mx-auto mt-12 w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm sm:mt-16 sm:p-9">
      <div className="text-center">
        <p className="text-sm font-semibold text-[var(--color-primary)]">Admin workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-ink)]">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          Sign-in is a visual preview and is not connected to authentication.
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
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-accent)]"
            placeholder="Enter your password"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          Sign in
        </button>
        <p className="min-h-5 text-center text-sm text-[var(--color-muted)]" role="status" aria-live="polite">
          {message}
        </p>
      </form>

      <div className="mt-4 border-t border-[var(--color-border)] pt-5 text-center">
        <Link
          to="/admin/dashboard"
          className="text-sm font-semibold text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          Preview admin dashboard
        </Link>
      </div>
    </section>
  )
}

export default Login
