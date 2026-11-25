import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { blog_data } from '../assets/assets.js'

function BlogDetail() {
  const { id } = useParams()
  const blog = blog_data.find((item) => item._id === id)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  if (!blog) {
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
          {blog.subTitle && (
            <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">{blog.subTitle}</p>
          )}
          <time dateTime={blog.createdAt} className="mt-5 block text-sm text-[var(--color-muted)]">
            {formattedDate}
          </time>
          <img
            src={blog.image}
            alt={blog.title}
            className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover"
          />
          <div
            className="mt-10 text-base leading-8 text-[var(--color-ink)] [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-4 [&_strong]:font-bold"
            dangerouslySetInnerHTML={{ __html: blog.description }}
          />
        </article>
      </main>
      <Footer />
    </div>
  )
}

export default BlogDetail
