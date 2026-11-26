import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/authContext.js'

function RequireAuth() {
  const { status, sessionError, retrySession } = useAuth()

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <p role="status" className="text-sm text-[var(--color-muted)]">
          Checking admin session...
        </p>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <section className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">
            Could not verify your session
          </h1>
          <p role="alert" className="mt-2 text-sm text-[var(--color-muted)]">
            {sessionError}
          </p>
          <button
            type="button"
            className="mt-5 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            onClick={() => void retrySession()}
          >
            Try again
          </button>
        </section>
      </main>
    )
  }

  if (status !== 'authenticated') {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}

export default RequireAuth
