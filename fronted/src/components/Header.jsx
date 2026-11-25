import { assets } from '../assets/assets.js'

function Header({ searchQuery, onSearchChange }) {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-28 md:px-8 md:pb-20 md:pt-36">
      <img
        src={assets.gradientBackground}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/90 px-3 py-1 text-sm text-[var(--color-muted)] shadow-sm">
          <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 font-semibold text-[var(--color-primary)]">New</span>
          AI-powered content discovery
        </div>
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-[var(--color-ink)] sm:text-5xl md:text-6xl">
          Ideas that inspire your <span className="text-[var(--color-primary)]">next move</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--color-muted)] md:text-lg">
          Explore thoughtful stories on technology, startups, lifestyle, and finance.
        </p>
        <form className="mx-auto mt-8 flex max-w-xl rounded-xl border border-[var(--color-border)] bg-white p-2 shadow-xl shadow-indigo-100/40" role="search" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="blog-search" className="sr-only">Search blog posts</label>
          <input
            id="blog-search"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search for articles..."
            className="min-w-0 flex-1 rounded-lg px-4 text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          />
          <button type="submit" className="rounded-lg bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">
            Search
          </button>
        </form>
      </div>
    </section>
  )
}

export default Header
