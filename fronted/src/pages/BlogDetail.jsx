import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { getPublicBlog, submitPublicComment } from '../api.js'

function BlogDetail() {
  const { id } = useParams()
  const [articleResult, setArticleResult] = useState({
    id: null,
    status: 'loading',
    blog: null,
    comments: [],
    error: '',
  })
  const [reloadCount, setReloadCount] = useState(0)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [commentState, setCommentState] = useState('idle')
  const [commentMessage, setCommentMessage] = useState('')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  useEffect(() => {
    const controller = new AbortController()

    getPublicBlog(id, { signal: controller.signal })
      .then((data) => {
        if (data?.success !== true || !data.blog || !Array.isArray(data.comments)) {
          throw new Error('The server returned an unexpected article response.')
        }
        setArticleResult({
          id,
          status: 'success',
          blog: data.blog,
          comments: data.comments,
          error: '',
        })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        if (error.response?.status === 404 || error.response?.status === 400) {
          setArticleResult({ id, status: 'not-found', blog: null, comments: [], error: '' })
          return
        }
        setArticleResult({
          id,
          status: 'error',
          blog: null,
          comments: [],
          error:
            error.response?.data?.message ||
            'Unable to load this article. Check your connection and try again.',
        })
      })

    return () => controller.abort()
  }, [id, reloadCount])

  const loadState = articleResult.id === id ? articleResult.status : 'loading'
  const blog = articleResult.id === id ? articleResult.blog : null
  const comments = articleResult.id === id ? articleResult.comments : []
  const loadError = articleResult.id === id ? articleResult.error : ''

  async function handleCommentSubmit(event) {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedContent = content.trim()
    if (!trimmedName || !trimmedContent || commentState === 'submitting') {
      setCommentState('error')
      setCommentMessage('Enter your name and a comment before submitting.')
      return
    }

    setCommentState('submitting')
    setCommentMessage('')
    try {
      const data = await submitPublicComment(id, {
        name: trimmedName,
        content: trimmedContent,
      })
      if (data?.success !== true) {
        throw new Error('The server did not confirm the comment submission.')
      }
      setName('')
      setContent('')
      setCommentState('success')
      setCommentMessage(data.message || 'Your comment was submitted for review.')
    } catch (error) {
      setCommentState('error')
      setCommentMessage(
        error.response?.data?.message ||
          'Unable to submit your comment. Please try again.',
      )
    }
  }

  if (loadState === 'loading') {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-5">
          <p role="status" className="text-sm text-[var(--color-muted)]">
            Loading article...
          </p>
        </main>
        <Footer />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-5 text-center">
          <h1 className="text-3xl font-bold text-[var(--color-ink)]">Article unavailable</h1>
          <p role="alert" className="mt-3 text-[var(--color-muted)]">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setArticleResult({ id, status: 'loading', blog: null, comments: [], error: '' })
              setReloadCount((count) => count + 1)
            }}
            className="mt-6 rounded-lg bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            Try again
          </button>
        </main>
        <Footer />
      </div>
    )
  }

  if (loadState === 'not-found' || (loadState === 'success' && !blog)) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-5 text-center">
          <h1 className="text-3xl font-bold text-[var(--color-ink)]">Article not found</h1>
          <p className="mt-3 text-[var(--color-muted)]">This blog post does not exist or is no longer available.</p>
          <Link to="/" className="mt-6 rounded-lg bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white">
            Back to home
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const formattedDate = new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(blog.createdAt))

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="px-5 pb-16 pt-28 md:px-8 md:pt-36">
        <article className="mx-auto max-w-3xl">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
          >
            ← Back to articles
          </Link>
          <span className="block w-fit rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
            {blog.category}
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-[var(--color-ink)] md:text-5xl">
            {blog.title}
          </h1>
          {(blog.subtitle || blog.subTitle) && (
            <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">{blog.subtitle || blog.subTitle}</p>
          )}
          <p className="mt-3 text-sm text-[var(--color-muted)]">By {blog.author}</p>
          <time dateTime={blog.createdAt} className="mt-2 block text-sm text-[var(--color-muted)]">
            {formattedDate}
          </time>
          <img
            src={blog.image}
            alt={blog.title}
            className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover"
          />
          <div
            className="mt-10 text-base leading-8 text-[var(--color-ink)] [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-3xl [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-4 [&_strong]:font-bold"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.description) }}
          />
        </article>
        <section className="mx-auto mt-14 max-w-3xl" aria-labelledby="comments-heading">
          <h2 id="comments-heading" className="text-2xl font-bold text-[var(--color-ink)]">
            Reader comments
          </h2>
          {comments.length > 0 ? (
            <ul className="mt-5 space-y-4">
              {comments.map((comment) => (
                <li key={comment._id} className="rounded-xl border border-[var(--color-border)] bg-white p-5">
                  <p className="font-semibold text-[var(--color-ink)]">{comment.name}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-muted)]">
                    {comment.content}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--color-muted)]">No approved comments yet.</p>
          )}
          <form onSubmit={handleCommentSubmit} className="mt-8 space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-7">
            <h3 className="text-lg font-bold text-[var(--color-ink)]">Leave a comment</h3>
            <div>
              <label htmlFor="comment-name" className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                Name
              </label>
              <input
                id="comment-name"
                name="name"
                autoComplete="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>
            <div>
              <label htmlFor="comment-content" className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                Comment
              </label>
              <textarea
                id="comment-content"
                name="content"
                required
                rows={4}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="w-full resize-y rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>
            <p
              role={commentState === 'error' ? 'alert' : 'status'}
              aria-live={commentState === 'error' ? 'assertive' : 'polite'}
              className="min-h-5 text-sm text-[var(--color-muted)]"
            >
              {commentState === 'submitting' ? 'Submitting comment...' : commentMessage}
            </p>
            <button
              type="submit"
              disabled={commentState === 'submitting'}
              className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {commentState === 'submitting' ? 'Submitting...' : 'Submit for review'}
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default BlogDetail
