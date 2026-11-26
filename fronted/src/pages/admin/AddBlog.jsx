import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Quill from 'quill'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import 'quill/dist/quill.snow.css'
import { blogCategories } from '../../assets/assets.js'
import { createBlog, generateBlogContent, getAdminBlogs, updateBlog, uploadBlogImage } from '../../api.js'

function AddBlog() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const editorElementRef = useRef(null)
  const quillInstanceRef = useRef(null)
  const imageInputRef = useRef(null)
  const [blogLoadResult, setBlogLoadResult] = useState({ id: null, status: 'loading', error: '' })
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('Technology')
  const [isPublished, setIsPublished] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeType, setNoticeType] = useState('status')
  const [isSaving, setIsSaving] = useState(false)
  const [generationStatus, setGenerationStatus] = useState('idle')
  const [generationMessage, setGenerationMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [uploadStatus, setUploadStatus] = useState('idle')
  const [uploadMessage, setUploadMessage] = useState('')
  const blogLoadState = !id
    ? 'ready'
    : blogLoadResult.id === id
      ? blogLoadResult.status
      : 'loading'
  const blogLoadError = blogLoadResult.id === id ? blogLoadResult.error : ''

  useEffect(() => {
    if (!editorElementRef.current || quillInstanceRef.current) return undefined

    const editorElement = editorElementRef.current
    const quill = new Quill(editorElement, {
      theme: 'snow',
      placeholder: 'Write your article here...',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'clean'],
        ],
      },
    })
    quillInstanceRef.current = quill

    return () => {
      quillInstanceRef.current = null
      editorElement.replaceChildren()
    }
  }, [])

  useEffect(() => {
    if (!id) return undefined

    const controller = new AbortController()

    getAdminBlogs({ signal: controller.signal })
      .then((data) => {
        if (data?.success !== true || !Array.isArray(data.blogs)) {
          throw new Error('The server returned an unexpected blog list.')
        }

        const blog = data.blogs.find((item) => item._id === id)
        if (!blog) {
          setBlogLoadResult({ id, status: 'not-found', error: '' })
          return
        }

        setTitle(blog.title || '')
        setSubtitle(blog.subtitle ?? blog.subTitle ?? '')
        setAuthor(blog.author || '')
        setCategory(blog.category || 'Technology')
        setIsPublished(Boolean(blog.isPublished))
        setImageUrl(blog.image || '')
        quillInstanceRef.current?.clipboard.dangerouslyPasteHTML(
          DOMPurify.sanitize(blog.description || ''),
        )
        setBlogLoadResult({ id, status: 'ready', error: '' })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setBlogLoadResult({
          id,
          status: 'error',
          error:
            error.response?.data?.message ||
            'Unable to load this blog. Check your connection and try again.',
        })
      })

    return () => controller.abort()
  }, [id])

  async function handleGenerate() {
    if (!title.trim() || generationStatus === 'loading') return

    setGenerationStatus('loading')
    setGenerationMessage('Generating article...')

    try {
      const data = await generateBlogContent({ title: title.trim(), subtitle: subtitle.trim() })
      if (data?.success !== true || typeof data.content !== 'string' || !data.content.trim()) {
        throw new Error('The server returned an unexpected generation response.')
      }

      const generatedHtml = DOMPurify.sanitize(marked.parse(data.content))
      if (!generatedHtml.trim()) {
        throw new Error('The generated article did not contain usable content.')
      }

      const quill = quillInstanceRef.current
      if (!quill) {
        throw new Error('The article editor is not ready. Please try again.')
      }

      quill.clipboard.dangerouslyPasteHTML(generatedHtml)
      setGenerationStatus('success')
      setGenerationMessage('AI draft added to the editor. Review and edit it before saving.')
    } catch (error) {
      const responseMessage = error.response?.data?.message
      setGenerationStatus('error')
      setGenerationMessage(
        typeof responseMessage === 'string'
          ? responseMessage
          : error.message === 'The server returned an unexpected generation response.'
            ? 'Unable to generate an article. Check your connection and try again.'
            : error.message,
      )
    }
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0] ?? null
    setSelectedImage(file)
    setImageUrl('')
    setUploadStatus('idle')
    setUploadMessage('')
  }

  function handleImageClear() {
    setSelectedImage(null)
    setImageUrl('')
    setUploadStatus('idle')
    setUploadMessage('')
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  async function handleImageUpload() {
    if (!selectedImage || uploadStatus === 'uploading') return

    const formData = new FormData()
    formData.append('image', selectedImage)
    setImageUrl('')
    setUploadStatus('uploading')
    setUploadMessage('Uploading image...')

    try {
      const data = await uploadBlogImage(formData)
      if (data?.success !== true || typeof data.imageUrl !== 'string' || !data.imageUrl) {
        throw new Error('The server returned an unexpected upload response.')
      }
      setImageUrl(data.imageUrl)
      setUploadStatus('success')
      setUploadMessage('Image uploaded successfully.')
    } catch (error) {
      setImageUrl('')
      setUploadStatus('error')
      setUploadMessage(
        error.response?.data?.message ||
          'Unable to upload the image. Check your connection and try again.',
      )
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSaving) return

    const quill = quillInstanceRef.current
    const articleText = quill?.getText().trim() || ''
    if (!articleText) {
      setNoticeType('alert')
      setNotice('Add article content before saving.')
      return
    }
    if (!imageUrl) {
      setNoticeType('alert')
      setNotice('Upload a thumbnail image before saving.')
      return
    }

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      author: author.trim(),
      description: DOMPurify.sanitize(quill.root.innerHTML),
      category,
      image: imageUrl,
    }
    if (!isEditing) payload.isPublished = isPublished

    setIsSaving(true)
    setNotice('')
    try {
      const data = isEditing
        ? await updateBlog(id, payload)
        : await createBlog(payload)
      if (data?.success !== true || !data.blog) {
        throw new Error('The server did not confirm the blog save.')
      }
      navigate('/admin/listblog', {
        replace: true,
        state: { notice: isEditing ? 'Blog updated successfully.' : 'Blog created successfully.' },
      })
    } catch (error) {
      setNoticeType('alert')
      setNotice(
        error.response?.data?.message ||
          'Unable to save the blog. Check your connection and try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (blogLoadState === 'loading') {
    return <p role="status" className="py-12 text-center text-sm text-[var(--color-muted)]">Loading blog...</p>
  }

  if (blogLoadState === 'error' || blogLoadState === 'not-found') {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6 text-center">
        <h1 className="text-xl font-bold text-[var(--color-ink)]">
          {blogLoadState === 'not-found' ? 'Blog not found' : 'Unable to load blog'}
        </h1>
        <p role={blogLoadState === 'error' ? 'alert' : 'status'} className="mt-2 text-sm text-[var(--color-muted)]">
          {blogLoadState === 'not-found' ? 'This blog may have been deleted.' : blogLoadError}
        </p>
        <button
          type="button"
          onClick={() => navigate('/admin/listblog')}
          className="mt-5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          Return to blog list
        </button>
      </section>
    )
  }

  return (
    <div>
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">Content</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--color-ink)]">
          {isEditing ? 'Edit blog' : 'Create a blog'}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {isEditing ? 'Update the content and save your changes.' : 'Create an article draft or publish it when ready.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 space-y-6 rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-7">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="blog-title" className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">Title</label>
            <input id="blog-title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-accent)]" placeholder="Enter a compelling title" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="blog-subtitle" className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">Subtitle</label>
            <input id="blog-subtitle" name="subtitle" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-accent)]" placeholder="Add a short summary" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="blog-author" className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">Author</label>
            <input id="blog-author" name="author" type="text" autoComplete="name" required value={author} onChange={(event) => setAuthor(event.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-accent)]" placeholder="Enter the author's name" />
          </div>
          <div>
            <label htmlFor="blog-category" className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">Category</label>
            <select id="blog-category" value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-accent)]">
              {blogCategories.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="blog-image" className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">Thumbnail image</label>
            <input
              ref={imageInputRef}
              id="blog-image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              disabled={uploadStatus === 'uploading'}
              onChange={handleImageChange}
              className="block w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-accent)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="mt-2 text-xs text-[var(--color-muted)]">JPEG, PNG, or WebP up to 5 MiB.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleImageUpload}
                disabled={!selectedImage || uploadStatus === 'uploading'}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload image'}
              </button>
              <button
                type="button"
                onClick={handleImageClear}
                disabled={(!selectedImage && !imageUrl) || uploadStatus === 'uploading'}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear image
              </button>
            </div>
            <p
              className="mt-2 min-h-5 text-sm text-[var(--color-muted)]"
              role={uploadStatus === 'error' ? 'alert' : 'status'}
              aria-live={uploadStatus === 'error' ? 'assertive' : 'polite'}
            >
              {uploadMessage || (isEditing && imageUrl ? 'Current thumbnail retained.' : '')}
            </p>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Blog thumbnail preview"
                className="mt-3 max-h-48 w-auto max-w-full rounded-lg border border-[var(--color-border)] object-contain"
              />
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <span className="block text-sm font-semibold text-[var(--color-ink)]">Article content</span>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!title.trim() || generationStatus === 'loading'}
              className="rounded-lg border border-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generationStatus === 'loading' ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>
          <p
            className={`mb-3 min-h-5 text-sm ${generationStatus === 'error' ? 'text-red-700' : 'text-[var(--color-muted)]'}`}
            role={generationStatus === 'error' ? 'alert' : 'status'}
            aria-live={generationStatus === 'error' ? 'assertive' : 'polite'}
          >
            {generationMessage}
          </p>
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)] [&_.ql-container]:min-h-56 [&_.ql-editor]:min-h-56 [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-[var(--color-border)] [&_.ql-container]:border-0">
            <div ref={editorElementRef} />
          </div>
        </div>

        {isEditing ? (
          <p className="rounded-xl bg-[var(--color-surface-soft)] p-4 text-sm text-[var(--color-muted)]">
            This blog is currently <strong>{isPublished ? 'published' : 'a draft'}</strong>. Use the blog list to change its publication status.
          </p>
        ) : (
          <label className="flex items-start gap-3 rounded-xl bg-[var(--color-surface-soft)] p-4">
            <input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]" />
            <span>
              <span className="block text-sm font-semibold text-[var(--color-ink)]">{isPublished ? 'Publish now' : 'Save as draft'}</span>
              <span className="mt-1 block text-xs text-[var(--color-muted)]">You can change publication status from the blog list later.</span>
            </span>
          </label>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-h-5 text-sm text-[var(--color-muted)]" role={noticeType} aria-live={noticeType === 'alert' ? 'assertive' : 'polite'}>{notice}</p>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : isEditing ? 'Save changes' : 'Save blog'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddBlog
