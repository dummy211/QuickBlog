import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { deleteBlog, getAdminBlogs, setBlogPublication } from '../../api.js'
import BlogTableItem from '../../components/admin/BlogTableItem.jsx'

function ListBlog() {
  const location = useLocation()
  const [blogs, setBlogs] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState(location.state?.notice || '')
  const [noticeType, setNoticeType] = useState('status')
  const [mutatingBlogId, setMutatingBlogId] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    getAdminBlogs({ signal: controller.signal })
      .then((data) => {
        if (data?.success !== true || !Array.isArray(data.blogs)) {
          throw new Error('The server returned an unexpected blog list.')
        }
        setBlogs(data.blogs)
        setLoadState('success')
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setLoadError(
          error.response?.data?.message ||
            'Unable to load blogs. Check your connection and try again.',
        )
        setLoadState('error')
      })

    return () => controller.abort()
  }, [reloadCount])

  const visibleBlogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return blogs
    return blogs.filter((blog) =>
      `${blog.title} ${blog.category}`.toLowerCase().includes(normalizedQuery),
    )
  }, [blogs, query])

  async function handleTogglePublication(blog) {
    setMutatingBlogId(blog._id)
    setNotice('')
    try {
      const data = await setBlogPublication(blog._id, !blog.isPublished)
      if (data?.success !== true || !data.blog) {
        throw new Error('The server did not confirm the publication change.')
      }
      setBlogs((current) =>
        current.map((item) => (item._id === blog._id ? { ...item, ...data.blog } : item)),
      )
      setNotice(data.message || 'Blog publication status updated.')
      setNoticeType('status')
    } catch (error) {
      setNotice(
        error.response?.data?.message ||
          'Unable to update publication status. Please try again.',
      )
      setNoticeType('alert')
    } finally {
      setMutatingBlogId('')
    }
  }

  async function handleDelete(blog) {
    if (!window.confirm(`Delete "${blog.title}" and its related comments?`)) return

    setMutatingBlogId(blog._id)
    setNotice('')
    try {
      const data = await deleteBlog(blog._id)
      if (data?.success !== true) {
        throw new Error('The server did not confirm the blog deletion.')
      }
      setBlogs((current) => current.filter((item) => item._id !== blog._id))
      setNotice(data.message || 'Blog and related comments deleted.')
      setNoticeType('status')
    } catch (error) {
      setNotice(
        error.response?.data?.message ||
          'Unable to delete the blog. Please try again.',
      )
      setNoticeType('alert')
    } finally {
      setMutatingBlogId('')
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">Content</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--color-ink)]">Manage blogs</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Review and manage saved posts and drafts.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
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
          <Link
            to="/admin/addblog"
            className="inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            Add blog
          </Link>
        </div>
      </div>

      <p className="mt-4 min-h-5 text-sm text-[var(--color-muted)]" role={noticeType} aria-live={noticeType === 'alert' ? 'assertive' : 'polite'}>
        {notice}
      </p>

      {loadState === 'loading' && (
        <p role="status" className="py-12 text-center text-sm text-[var(--color-muted)]">Loading blogs...</p>
      )}
      {loadState === 'error' && (
        <div className="mt-2 rounded-2xl border border-[var(--color-border)] bg-white p-6 text-center">
          <p role="alert" className="text-sm text-[var(--color-muted)]">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setLoadState('loading')
              setLoadError('')
              setReloadCount((count) => count + 1)
            }}
            className="mt-4 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            Try again
          </button>
        </div>
      )}
      {loadState === 'success' && (
        <section className="mt-2 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[60rem] border-collapse text-left">
              <thead className="bg-[var(--color-surface-soft)] text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                <tr>
                  <th scope="col" className="px-4 py-3">Blog</th>
                  <th scope="col" className="px-4 py-3">Created</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleBlogs.map((blog) => (
                  <BlogTableItem
                    key={blog._id}
                    blog={blog}
                    showActions
                    isMutating={mutatingBlogId === blog._id}
                    onTogglePublication={() => handleTogglePublication(blog)}
                    onDelete={() => handleDelete(blog)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {visibleBlogs.length === 0 && (
            <p className="px-5 py-12 text-center text-sm text-[var(--color-muted)]">
              {blogs.length === 0 ? 'No blogs have been created yet.' : 'No blogs match your search.'}
            </p>
          )}
        </section>
      )}
    </div>
  )
}

export default ListBlog
