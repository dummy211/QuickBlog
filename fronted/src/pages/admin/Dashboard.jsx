import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../../assets/assets.js'
import { getAdminStats } from '../../api.js'
import BlogTableItem from '../../components/admin/BlogTableItem.jsx'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentBlogs, setRecentBlogs] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    getAdminStats({ signal: controller.signal })
      .then((data) => {
        if (data?.success !== true || !data.stats || !Array.isArray(data.recentBlogs)) {
          throw new Error('The server returned an unexpected dashboard response.')
        }
        setStats(data.stats)
        setRecentBlogs(data.recentBlogs)
        setLoadState('success')
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setLoadError(
          error.response?.data?.message ||
            'Unable to load dashboard data. Check your connection and try again.',
        )
        setLoadState('error')
      })

    return () => controller.abort()
  }, [reloadCount])

  const metrics = stats
    ? [
        { label: 'Published blogs', value: stats.publishedBlogs, icon: assets.dashboard_icon_1 },
        { label: 'Comments', value: stats.totalComments, icon: assets.dashboard_icon_2 },
        { label: 'Drafts', value: stats.draftBlogs, icon: assets.dashboard_icon_3 },
      ]
    : []

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">Admin workspace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--color-ink)]">Dashboard</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">A live overview of your QuickBlog content.</p>
        </div>
        <Link
          to="/admin/addblog"
          className="inline-flex w-fit items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          Create a blog
        </Link>
      </div>

      {loadState === 'loading' && (
        <p role="status" className="py-12 text-center text-sm text-[var(--color-muted)]">
          Loading dashboard...
        </p>
      )}
      {loadState === 'error' && (
        <div className="mt-7 rounded-2xl border border-[var(--color-border)] bg-white p-6 text-center">
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
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <article key={metric.label} className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)]">
                  <img src={metric.icon} alt="" className="h-6 w-6 object-contain" />
                </div>
                <div>
                  <p className="text-sm text-[var(--color-muted)]">{metric.label}</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">{metric.value}</p>
                </div>
              </article>
            ))}
          </div>

          <section className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-ink)]">Recent blogs</h2>
                <p className="mt-1 text-sm text-[var(--color-muted)]">The five latest posts from your workspace.</p>
              </div>
              <Link to="/admin/listblog" className="text-sm font-semibold text-[var(--color-primary)] hover:underline">
                Manage blogs
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left">
                <thead className="bg-[var(--color-surface-soft)] text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  <tr>
                    <th scope="col" className="px-4 py-3">Blog</th>
                    <th scope="col" className="px-4 py-3">Created</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBlogs.map((blog) => (
                    <BlogTableItem key={blog._id} blog={blog} />
                  ))}
                </tbody>
              </table>
            </div>
            {recentBlogs.length === 0 && (
              <p className="px-5 py-12 text-center text-sm text-[var(--color-muted)]">No blogs have been created yet.</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default Dashboard
