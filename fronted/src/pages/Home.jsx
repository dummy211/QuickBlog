import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import Header from '../components/Header.jsx'
import BlogList from '../components/BlogList.jsx'
import Newsletter from '../components/Newsletter.jsx'
import Footer from '../components/Footer.jsx'
import { blog_data } from '../assets/assets.js'

function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredBlogs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return blog_data.filter((blog) => {
      if (!blog.isPublished) return false
      if (selectedCategory !== 'All' && blog.category !== selectedCategory) return false

      if (!normalizedQuery) return true

      return `${blog.title} ${blog.subTitle ?? ''}`
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [searchQuery, selectedCategory])

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <main>
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <BlogList
          blogs={filteredBlogs}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        <Newsletter />
      </main>
      <Footer />
    </div>
  )
}

export default Home
