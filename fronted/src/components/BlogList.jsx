import { motion } from 'motion/react'
import BlogCard from './BlogCard.jsx'
import { blogCategories } from '../assets/assets.js'

function BlogList({ blogs, selectedCategory, onCategoryChange }) {
  return (
    <section className="px-5 py-14 md:px-8 md:py-20" aria-labelledby="latest-heading">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">Latest stories</p>
            <h2 id="latest-heading" className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-ink)] md:text-4xl">Explore all articles</h2>
          </div>
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-1" role="group" aria-label="Filter articles by category">
            {blogCategories.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={selectedCategory === category}
                onClick={() => onCategoryChange(category)}
                className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)] ${selectedCategory === category ? 'text-white' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}
              >
                {selectedCategory === category && (
                  <motion.span
                    layoutId="active-category"
                    className="absolute inset-0 -z-0 rounded-full bg-[var(--color-primary)]"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{category}</span>
              </button>
            ))}
          </div>
        </div>

        {blogs.length > 0 ? (
          <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog, index) => (
              <BlogCard key={blog._id} blog={blog} index={index} />
            ))}
          </div>
        ) : (
          <div className="mt-9 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-soft)] px-6 py-16 text-center">
            <h3 className="text-xl font-bold text-[var(--color-ink)]">No articles found</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Try a different search or category.</p>
            <button
              type="button"
              onClick={() => onCategoryChange('All')}
              className="mt-5 rounded-full border border-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            >
              Show all categories
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default BlogList
