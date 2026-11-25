import { Link } from 'react-router-dom'
import { assets } from '../assets/assets.js'

const socialLinks = [
  { name: 'Facebook', url: 'https://facebook.com', icon: assets.facebook_icon },
  { name: 'Twitter', url: 'https://twitter.com', icon: assets.twitter_icon },
  { name: 'Google Plus', url: 'https://plus.google.com', icon: assets.googleplus_icon },
]

function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] px-5 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 py-8 sm:flex-row">
        <Link to="/" className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary)]">
          <img src={assets.logo} alt="QuickBlog" className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noreferrer"
              aria-label={social.name}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-white transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:bg-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            >
              <img src={social.icon} alt="" className="h-4 w-4 object-contain" />
            </a>
          ))}
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-[var(--color-border)] py-5 text-center text-xs text-[var(--color-muted)] sm:flex-row">
        <p>&copy; {new Date().getFullYear()} QuickBlog. All rights reserved.</p>
        <p>Crafted with ❤️ by Manish</p>
      </div>
    </footer>
  )
}

export default Footer
