import { Link } from 'react-router-dom'
import { assets } from '../assets/assets.js'

function Navbar() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8" aria-label="Primary navigation">
        <Link to="/" className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary)]">
          <img src={assets.logo} alt="QuickBlog" className="h-9 w-auto" />
        </Link>
        <Link
          to="/admin"
          className="rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-[var(--color-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-primary)]"
        >
          Admin
        </Link>
      </nav>
    </header>
  )
}

export default Navbar
