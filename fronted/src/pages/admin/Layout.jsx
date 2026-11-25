import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { assets } from '../../assets/assets.js'
import Sidebar from '../../components/admin/Sidebar.jsx'

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const isLoginPage = pathname === '/admin' || pathname === '/admin/'

  if (isLoginPage) {
    return (
      <main className="min-h-screen bg-[var(--color-surface-soft)] px-5 py-10">
        <Link
          to="/"
          className="mx-auto block w-fit rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary)]"
        >
          <img src={assets.logo} alt="QuickBlog" className="h-9 w-auto" />
        </Link>
        <Outlet />
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-soft)]">
      <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-border)] bg-white px-5 py-3 md:hidden">
          <Link to="/admin/dashboard" className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">
            <img src={assets.logo} alt="QuickBlog admin" className="h-7 w-auto" />
          </Link>
          <button
            type="button"
            aria-controls="admin-sidebar"
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? 'Close admin navigation' : 'Open admin navigation'}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] text-xl text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <span aria-hidden="true">{sidebarOpen ? '×' : '☰'}</span>
          </button>
        </header>
        <main className="mx-auto w-full max-w-7xl px-5 py-7 md:px-8 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
