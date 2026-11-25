import { useEffect, useRef, useState } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { blogCategories } from '../../assets/assets.js'

function AddBlog() {
  const editorElementRef = useRef(null)
  const quillInstanceRef = useRef(null)
  const [category, setCategory] = useState('Technology')
  const [isPublished, setIsPublished] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!editorElementRef.current || quillInstanceRef.current) return undefined

    const quill = new Quill(editorElementRef.current, {
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
      editorElementRef.current?.replaceChildren()
    }
  }, [])

  function handleSubmit(event) {
    event.preventDefault()
    setNotice('Preview only: this blog was not saved or published.')
  }

  return (
    <div>
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">Content</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--color-ink)]">Create a blog</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Draft the article layout. Saving and uploads are not connected.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 space-y-6 rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-7">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="blog-title" className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">Title</label>
            <input id="blog-title" name="title" required className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-accent)]" placeholder="Enter a compelling title" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="blog-subtitle" className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">Subtitle</label>
            <input id="blog-subtitle" name="subtitle" className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-accent)]" placeholder="Add a short summary" />
          </div>
          <div>
            <label htmlFor="blog-category" className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">Category</label>
            <select id="blog-category" value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-accent)]">
              {blogCategories.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="blog-image" className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">Thumbnail image</label>
            <input id="blog-image" name="image" type="file" accept="image/*" required className="block w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-accent)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]" />
            <p className="mt-2 text-xs text-[var(--color-muted)]">Image selection is local to this preview; no upload occurs.</p>
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">Article content</span>
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)] [&_.ql-container]:min-h-56 [&_.ql-editor]:min-h-56 [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-[var(--color-border)] [&_.ql-container]:border-0">
            <div ref={editorElementRef} />
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl bg-[var(--color-surface-soft)] p-4">
          <input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]" />
          <span>
            <span className="block text-sm font-semibold text-[var(--color-ink)]">{isPublished ? 'Mark as published' : 'Save as draft'}</span>
            <span className="mt-1 block text-xs text-[var(--color-muted)]">This setting is only a preview; it will not change a real post.</span>
          </span>
        </label>

        <div className="flex flex-col-reverse gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-h-5 text-sm text-[var(--color-muted)]" role="status" aria-live="polite">{notice}</p>
          <button type="submit" className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">
            Preview save action
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddBlog
