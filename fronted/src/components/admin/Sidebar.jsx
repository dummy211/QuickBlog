import { Link, NavLink } from 'react-router-dom'
import { assets } from '../../assets/assets.js'

const navigation = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: assets.home_icon },
  { label: 'Add blog', to: '/admin/addblog', icon: assets.add_icon },
  { label: 'Manage blogs', to: '/admin/listblog', icon: assets.list_icon },
  { label: 'Comments', to: '/admin/comments', icon: assets.comment_icon },
]

function Sidebar({ isOpen, onNavigate, onLogout }) {
  return (
    <aside
      id="admin-sidebar"
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--color-border)] bg-white px-5 py-6 transition-transform duration-200 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Admin sidebar"
    >
      <Link
        to="/admin/dashboard"
        onClick={onNavigate}
        className="mb-9 inline-flex w-fit rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary)]"
      >
        <img src={assets.logo} alt="QuickBlog admin" className="h-8 w-auto" />
      </Link>

      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        Workspace
      </p>
      <nav className="flex flex-col gap-1" aria-label="Admin navigation">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
                isActive
                  ? 'bg-[var(--color-accent)] text-[var(--color-primary)]'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)]'
              }`
            }
          >
            <img src={item.icon} alt="" className="h-5 w-5 object-contain" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-[var(--color-border)] pt-5">
        <p className="mb-4 rounded-xl bg-[var(--color-surface-soft)] px-3 py-3 text-xs leading-5 text-[var(--color-muted)]">
          Blog and comment actions are not connected to the server yet.
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="mb-3 w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          Sign out
        </button>
        <Link
          to="/"
          onClick={onNavigate}
          className="rounded-md px-3 py-2 text-sm font-semibold text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          Back to public site
        </Link>
      </div>
    </aside>
  )
}

export default Sidebar
