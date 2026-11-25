import { useMemo, useState } from 'react'
import { comments_data } from '../../assets/assets.js'
import CommentTableItem from '../../components/admin/CommentTableItem.jsx'

function Comments() {
  const [activeFilter, setActiveFilter] = useState('pending')
  const [notice, setNotice] = useState('')
  const pendingCount = comments_data.filter((comment) => !comment.isApproved).length
  const approvedCount = comments_data.length - pendingCount
  const visibleComments = useMemo(
    () => comments_data.filter((comment) => comment.isApproved === (activeFilter === 'approved')),
    [activeFilter],
  )

  const filters = [
    { id: 'pending', label: 'Pending', count: pendingCount },
    { id: 'approved', label: 'Approved', count: approvedCount },
  ]

  return (
    <div>
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">Community</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--color-ink)]">Comments</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Review comment fixture data by approval status.</p>
      </div>

      <div className="mt-7 flex flex-wrap gap-2" aria-label="Filter comments">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            aria-pressed={activeFilter === filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
              activeFilter === filter.id
                ? 'border-[var(--color-primary)] bg-[var(--color-accent)] text-[var(--color-primary)]'
                : 'border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            {filter.label} <span className="ml-1 opacity-70">{filter.count}</span>
          </button>
        ))}
      </div>

      <p className="mt-4 min-h-5 text-sm text-[var(--color-muted)]" role="status" aria-live="polite">{notice}</p>

      <section className="mt-2 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] border-collapse text-left">
            <thead className="bg-[var(--color-surface-soft)] text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              <tr>
                <th scope="col" className="px-4 py-3">Reader</th>
                <th scope="col" className="px-4 py-3">Comment</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Preview action</th>
              </tr>
            </thead>
            <tbody>
              {visibleComments.map((comment) => (
                <CommentTableItem
                  key={comment._id}
                  comment={comment}
                  onPreviewAction={() => setNotice('Preview only: no comment changes were saved.')}
                />
              ))}
            </tbody>
          </table>
        </div>
        {visibleComments.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-[var(--color-muted)]">There are no comments in this category.</p>
        )}
      </section>
      <p className="mt-4 text-xs text-[var(--color-muted)]">Comment actions are previews only and do not update approval status.</p>
    </div>
  )
}

export default Comments
