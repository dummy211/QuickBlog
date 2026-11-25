import { useMemo, useState } from 'react'
import { blog_data } from '../../assets/assets.js'
import BlogTableItem from '../../components/admin/BlogTableItem.jsx'

function ListBlog() {
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const blogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return blog_data
    return blog_data.filter((blog) => `${blog.title} ${blog.category}`.toLowerCase().includes(normalizedQuery))
  }, [query])

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">Content</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--color-ink)]">Manage blogs</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Review local preview posts and their publication status.</p>
        </div>
        <label className="w-full sm:max-w-xs">
          <span className="sr-only">Search blogs</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title or category"
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </label>
      </div>

      <p className="mt-4 min-h-5 text-sm text-[var(--color-muted)]" role="status" aria-live="polite">{notice}</p>

      <section className="mt-2 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-left">
            <thead className="bg-[var(--color-surface-soft)] text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              <tr>
                <th scope="col" className="px-4 py-3">Blog</th>
                <th scope="col" className="px-4 py-3">Created</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Preview actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <BlogTableItem
                  key={blog._id}
                  blog={blog}
                  showActions
                  onPreviewAction={() => setNotice('Preview only: no blog changes were saved.')}
                />
              ))}
            </tbody>
          </table>
        </div>
        {blogs.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-[var(--color-muted)]">No blogs match your search.</p>
        )}
      </section>
      <p className="mt-4 text-xs text-[var(--color-muted)]">Actions are previews only; editing and publishing are not connected to a server.</p>
    </div>
  )
}

export default ListBlog
