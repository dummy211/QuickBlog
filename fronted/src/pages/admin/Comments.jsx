import { useEffect, useState } from 'react'
import { deleteComment, getAdminComments, setCommentApproval } from '../../api.js'
import CommentTableItem from '../../components/admin/CommentTableItem.jsx'

function Comments() {
  const [activeFilter, setActiveFilter] = useState('pending')
  const [commentsByStatus, setCommentsByStatus] = useState({ pending: [], approved: [] })
  const [loadState, setLoadState] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)
  const [notice, setNotice] = useState('')
  const [noticeType, setNoticeType] = useState('status')
  const [mutatingCommentId, setMutatingCommentId] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      getAdminComments('pending', { signal: controller.signal }),
      getAdminComments('approved', { signal: controller.signal }),
    ])
      .then(([pendingData, approvedData]) => {
        if (
          pendingData?.success !== true ||
          approvedData?.success !== true ||
          !Array.isArray(pendingData.comments) ||
          !Array.isArray(approvedData.comments)
        ) {
          throw new Error('The server returned an unexpected comments response.')
        }
        setCommentsByStatus({
          pending: pendingData.comments,
          approved: approvedData.comments,
        })
        setLoadState('success')
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setLoadError(
          error.response?.data?.message ||
            'Unable to load comments. Check your connection and try again.',
        )
        setLoadState('error')
      })

    return () => controller.abort()
  }, [reloadCount])

  const visibleComments = commentsByStatus[activeFilter]

  async function handleToggleApproval(comment) {
    const nextApproval = !comment.isApproved
    setMutatingCommentId(comment._id)
    setNotice('')
    try {
      const data = await setCommentApproval(comment._id, nextApproval)
      if (data?.success !== true) {
        throw new Error('The server did not confirm the moderation update.')
      }

      const updatedComment = { ...comment, isApproved: nextApproval }
      setCommentsByStatus((current) => ({
        pending: nextApproval
          ? current.pending.filter((item) => item._id !== comment._id)
          : [...current.pending.filter((item) => item._id !== comment._id), updatedComment],
        approved: nextApproval
          ? [...current.approved.filter((item) => item._id !== comment._id), updatedComment]
          : current.approved.filter((item) => item._id !== comment._id),
      }))
      setNotice(data.message || 'Comment moderation status updated.')
      setNoticeType('status')
    } catch (error) {
      setNotice(
        error.response?.data?.message ||
          'Unable to update comment approval. Please try again.',
      )
      setNoticeType('alert')
    } finally {
      setMutatingCommentId('')
    }
  }

  async function handleDelete(comment) {
    if (!window.confirm(`Delete the comment from ${comment.name}?`)) return

    setMutatingCommentId(comment._id)
    setNotice('')
    try {
      const data = await deleteComment(comment._id)
      if (data?.success !== true) {
        throw new Error('The server did not confirm the comment deletion.')
      }
      setCommentsByStatus((current) => ({
        pending: current.pending.filter((item) => item._id !== comment._id),
        approved: current.approved.filter((item) => item._id !== comment._id),
      }))
      setNotice(data.message || 'Comment deleted successfully.')
      setNoticeType('status')
    } catch (error) {
      setNotice(
        error.response?.data?.message ||
          'Unable to delete comment. Please try again.',
      )
      setNoticeType('alert')
    } finally {
      setMutatingCommentId('')
    }
  }

  const filters = [
    { id: 'pending', label: 'Pending', count: commentsByStatus.pending.length },
    { id: 'approved', label: 'Approved', count: commentsByStatus.approved.length },
  ]

  return (
    <div>
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">Community</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--color-ink)]">Comments</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Review and moderate reader comments.</p>
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

      <p className={`mt-4 min-h-5 text-sm text-[var(--color-muted)]`} role={noticeType} aria-live={noticeType === 'alert' ? 'assertive' : 'polite'}>
        {notice}
      </p>

      {loadState === 'loading' && (
        <p role="status" className="py-12 text-center text-sm text-[var(--color-muted)]">Loading comments...</p>
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
            <table className="w-full min-w-[56rem] border-collapse text-left">
              <thead className="bg-[var(--color-surface-soft)] text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                <tr>
                  <th scope="col" className="px-4 py-3">Reader</th>
                  <th scope="col" className="px-4 py-3">Comment</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleComments.map((comment) => (
                  <CommentTableItem
                    key={comment._id}
                    comment={comment}
                    isMutating={mutatingCommentId === comment._id}
                    onToggleApproval={() => handleToggleApproval(comment)}
                    onDelete={() => handleDelete(comment)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {visibleComments.length === 0 && (
            <p className="px-5 py-12 text-center text-sm text-[var(--color-muted)]">
              There are no {activeFilter} comments.
            </p>
          )}
        </section>
      )}
    </div>
  )
}

export default Comments
