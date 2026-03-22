import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, X, Loader2, Eye } from 'lucide-react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { supabase } from '../../lib/supabase'

export default function BlogEditor({ post, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    tags: [],
    published: false,
  })
  const [tagInput, setTagInput] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        tags: post.tags || [],
        published: post.published || false,
      })
    }
  }, [post])

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      if (name === 'title') updated.slug = generateSlug(value)
      return updated
    })
  }

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = { ...formData, updated_at: new Date().toISOString() }
      if (post?.id) {
        await supabase.from('blog_posts').update(data).eq('id', post.id)
      } else {
        data.created_at = new Date().toISOString()
        data.views = 0
        await supabase.from('blog_posts').insert([data])
      }
      onSave()
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const previewHtml = DOMPurify.sanitize(marked.parse(formData.content || '# Preview...'))

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-forge-surface rounded-xl border border-forge-muted/20 mb-8">
      <form onSubmit={handleSubmit}>
        <div className="p-6 border-b border-forge-muted/20">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display text-xl font-bold text-white">
              {post ? 'Edit Post' : 'New Post'}
            </h3>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white">
                <Eye className="w-4 h-4" />{showPreview ? 'Edit' : 'Preview'}
              </button>
              <button type="button" onClick={onCancel} className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white">
                <X className="w-4 h-4" />Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-forge-black font-medium rounded-lg hover:bg-orange-400 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save
              </button>
            </div>
          </div>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required
                className="w-full px-4 py-2 bg-forge-black rounded-lg text-white border border-forge-muted/20 focus:border-orange-500 focus:outline-none" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Slug</label>
                <input type="text" name="slug" value={formData.slug} onChange={handleChange} required
                  className="w-full px-4 py-2 bg-forge-black rounded-lg text-white border border-forge-muted/20 focus:border-orange-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Published</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.published}
                    onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-600 text-orange-500" />
                  <span className="text-gray-300">{formData.published ? 'Published' : 'Draft'}</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Excerpt</label>
              <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} rows={2}
                className="w-full px-4 py-2 bg-forge-black rounded-lg text-white border border-forge-muted/20 focus:border-orange-500 focus:outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-forge-black rounded-full text-sm text-gray-300">
                    {tag}<button type="button" onClick={() => handleRemoveTag(tag)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag}
                placeholder="Type and press Enter" className="w-full px-4 py-2 bg-forge-black rounded-lg text-white border border-forge-muted/20 focus:border-orange-500 focus:outline-none" />
            </div>
          </div>
        </div>
        {showPreview ? (
          <div className="p-6 max-h-96 overflow-y-auto prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        ) : (
          <div className="p-6">
            <label className="block text-sm text-gray-400 mb-1">Content (Markdown)</label>
            <textarea name="content" value={formData.content} onChange={handleChange} rows={15} required
              className="w-full px-4 py-2 bg-forge-black rounded-lg text-white font-mono text-sm border border-forge-muted/20 focus:border-orange-500 focus:outline-none resize-none" />
          </div>
        )}
      </form>
    </motion.div>
  )
}
