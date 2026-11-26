function CommentTableItem({
  comment,
  isMutating = false,
  onToggleApproval,
  onDelete,
}) {
  const date = new Date(comment.createdAt)
  const formattedDate = Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)

  return (
    <tr className="border-t border-[var(--color-border)] align-top">
      <td className="min-w-52 px-4 py-4">
        <p className="text-sm font-semibold text-[var(--color-ink)]">{comment.name}</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">{formattedDate}</p>
      </td>
      <td className="min-w-64 px-4 py-4">
        <p className="text-sm leading-6 text-[var(--color-ink)]">{comment.content}</p>
        <p className="mt-2 line-clamp-1 text-xs text-[var(--color-muted)]">
          On: {comment.blog?.title ?? 'Blog unavailable'}
        </p>
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            comment.isApproved
              ? 'bg-[var(--color-accent)] text-[var(--color-primary)]'
              : 'bg-[var(--color-surface-soft)] text-[var(--color-muted)]'
          }`}
        >
          {comment.isApproved ? 'Approved' : 'Pending'}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleApproval}
            disabled={isMutating}
            aria-label={`${comment.isApproved ? 'Unapprove' : 'Approve'} comment by ${comment.name}`}
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {comment.isApproved ? 'Unapprove' : 'Approve'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isMutating}
            aria-label={`Delete comment by ${comment.name}`}
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}

export default CommentTableItem
