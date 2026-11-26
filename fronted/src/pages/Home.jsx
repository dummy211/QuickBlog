import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import Header from '../components/Header.jsx'
import BlogList from '../components/BlogList.jsx'
import Newsletter from '../components/Newsletter.jsx'
import Footer from '../components/Footer.jsx'
import { getPublicBlogs } from '../api.js'

const emptyBlogs = []

function Home() {
  const [blogResult, setBlogResult] = useState({
    requestId: -1,
    status: 'loading',
    blogs: [],
    error: '',
  })
  const [reloadCount, setReloadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    const controller = new AbortController()

    getPublicBlogs({ signal: controller.signal })
      .then((data) => {
        if (data?.success !== true || !Array.isArray(data.blogs)) {
          throw new Error('The server returned an unexpected blog list.')
        }
        setBlogResult({ requestId: reloadCount, status: 'success', blogs: data.blogs, error: '' })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setBlogResult({
          requestId: reloadCount,
          status: 'error',
          blogs: [],
          error:
            error.response?.data?.message ||
            'Unable to load articles. Check your connection and try again.',
        })
      })

    return () => controller.abort()
  }, [reloadCount])

  const isLoading = blogResult.requestId !== reloadCount || blogResult.status === 'loading'
  const blogs = blogResult.requestId === reloadCount ? blogResult.blogs : emptyBlogs
  const loadError = blogResult.requestId === reloadCount ? blogResult.error : ''

  const filteredBlogs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return blogs.filter((blog) => {
      if (selectedCategory !== 'All' && blog.category !== selectedCategory) return false

      if (!normalizedQuery) return true

      return `${blog.title} ${blog.subTitle ?? ''}`
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [blogs, searchQuery, selectedCategory])

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <main>
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        {isLoading && (
          <p className="px-5 py-16 text-center text-sm text-[var(--color-muted)]" role="status">
            Loading articles...
          </p>
        )}
        {!isLoading && blogResult.status === 'error' && (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-[var(--color-muted)]" role="alert">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                setBlogResult((current) => ({ ...current, status: 'loading' }))
                setReloadCount((count) => count + 1)
              }}
              className="mt-4 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            >
              Try again
            </button>
          </div>
        )}
        {!isLoading && blogResult.status === 'success' && (
          <BlogList
            blogs={filteredBlogs}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        )}
        <Newsletter />
      </main>
      <Footer />
    </div>
  )
}

export default Home
