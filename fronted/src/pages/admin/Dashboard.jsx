import { Link } from 'react-router-dom'
import { assets, dashboard_data } from '../../assets/assets.js'
import BlogTableItem from '../../components/admin/BlogTableItem.jsx'

const metrics = [
  { label: 'Published blogs', value: dashboard_data.blogs, icon: assets.dashboard_icon_1 },
  { label: 'Comments', value: dashboard_data.comments, icon: assets.dashboard_icon_2 },
  { label: 'Drafts', value: dashboard_data.drafts, icon: assets.dashboard_icon_3 },
]

function Dashboard() {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">Admin workspace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--color-ink)]">Dashboard</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">A quick overview of your QuickBlog content.</p>
        </div>
        <Link
          to="/admin/addblog"
          className="inline-flex w-fit items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          Create a blog
        </Link>
      </div>

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
            <p className="mt-1 text-sm text-[var(--color-muted)]">Preview data from the local blog fixture.</p>
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
              {dashboard_data.recentBlogs.map((blog) => (
                <BlogTableItem key={blog._id} blog={blog} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="mt-5 text-xs text-[var(--color-muted)]">
        Dashboard figures are fixture data and may not reflect live content.
      </p>
    </div>
  )
}

export default Dashboard
