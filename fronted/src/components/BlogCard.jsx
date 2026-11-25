import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { assets } from '../assets/assets.js'

function BlogCard({ blog, index }) {
  const formattedDate = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(blog.createdAt))

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.2) }}
      className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <Link to={`/blog/${blog._id}`} className="block focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--color-primary)]" aria-label={`Read ${blog.title}`}>
        <div className="aspect-[16/10] overflow-hidden bg-[var(--color-surface-soft)]">
          <img src={blog.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 font-semibold text-[var(--color-primary)]">{blog.category}</span>
            <time dateTime={blog.createdAt} className="text-[var(--color-muted)]">{formattedDate}</time>
          </div>
          <h3 className="mt-4 text-xl font-bold leading-snug text-[var(--color-ink)] transition group-hover:text-[var(--color-primary)]">{blog.title}</h3>
          {blog.subTitle && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-muted)]">{blog.subTitle}</p>}
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
            Read article
            <img src={assets.arrow} alt="" className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </motion.article>
  )
}

export default BlogCard
