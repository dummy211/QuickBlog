import { useState } from 'react'

function Newsletter() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim()) {
      setMessage('Enter your email address.')
      return
    }
    if (!event.currentTarget.elements.email.checkValidity()) {
      setMessage('Enter a valid email address.')
      return
    }
    setMessage('You are on the list. Welcome to QuickBlog!')
    setEmail('')
  }

  return (
    <section className="px-5 pb-16 md:px-8 md:pb-20" aria-labelledby="newsletter-heading">
      <div className="mx-auto max-w-6xl rounded-3xl bg-[var(--color-ink)] px-6 py-10 text-center text-white sm:px-10 md:py-14">
        <h2 id="newsletter-heading" className="text-3xl font-bold tracking-tight">Never miss a new story</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/70 md:text-base">
          Get fresh ideas and practical insights delivered to your inbox.
        </p>
        <form className="mx-auto mt-7 flex max-w-xl flex-col gap-2 rounded-xl bg-white p-2 sm:flex-row" onSubmit={handleSubmit} noValidate>
          <label htmlFor="newsletter-email" className="sr-only">Email address</label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            className="min-w-0 flex-1 rounded-lg px-4 py-3 text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          />
          <button type="submit" className="rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold transition hover:bg-[var(--color-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Subscribe
          </button>
        </form>
        <p className="mt-3 min-h-5 text-sm text-white/80" role="status" aria-live="polite">{message}</p>
      </div>
    </section>
  )
}

export default Newsletter
