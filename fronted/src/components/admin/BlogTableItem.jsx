import { Link } from 'react-router-dom'

function BlogTableItem({ blog, showActions = false, onPreviewAction }) {
  const date = new Date(blog.createdAt)
  const formattedDate = Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)

  return (
    <tr className="border-t border-[var(--color-border)]">
      <td className="min-w-64 px-4 py-4">
        <div className="flex items-center gap-3">
          <img src={blog.image} alt="" className="h-12 w-16 shrink-0 rounded-lg bg-[var(--color-surface-soft)] object-cover" />
          <div className="min-w-0">
            <Link
              to={`/blog/${blog._id}`}
              className="line-clamp-2 text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
            >
              {blog.title}
            </Link>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{blog.category}</p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-muted)]">{formattedDate}</td>
      <td className="whitespace-nowrap px-4 py-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            blog.isPublished
              ? 'bg-[var(--color-accent)] text-[var(--color-primary)]'
              : 'bg-[var(--color-surface-soft)] text-[var(--color-muted)]'
          }`}
        >
          {blog.isPublished ? 'Published' : 'Draft'}
        </span>
      </td>
      {showActions && (
        <td className="whitespace-nowrap px-4 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPreviewAction}
              aria-label={`Edit ${blog.title} (preview only)`}
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onPreviewAction}
              aria-label={`${blog.isPublished ? 'Unpublish' : 'Publish'} ${blog.title} (preview only)`}
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            >
              {blog.isPublished ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </td>
      )}
    </tr>
  )
}

export default BlogTableItem
