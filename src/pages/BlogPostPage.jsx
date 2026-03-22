import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Clock, ArrowLeft, Loader2 } from 'lucide-react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { supabase } from '../lib/supabase'

export default function BlogPostPage() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPost() {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .single()

        if (error) {
          console.log('Post fetch error (expected if no Supabase):', error.message)
          setPost(null)
        } else {
          setPost(data)
          
          if (data?.id) {
            await supabase.rpc('increment_views', { row_id: data.id }).catch(() => {})
          }
        }
      } catch (err) {
        setPost(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  const defaultPost = {
    title: 'Getting Started with React 18',
    content: `# Getting Started with React 18

React 18 brings exciting new features and improvements that make building user interfaces more powerful than ever.

## New Features in React 18

### Automatic Batching
React 18 now batches state updates automatically, even inside promises, timeouts, and event handlers.

### Transitions
The new \`startTransition\` API lets you mark updates as non-urgent, keeping your app responsive during heavy renders.

### Suspense Improvements
Suspense now works with server-side rendering and has better support for data fetching.

## Getting Started

\`\`\`bash
npm create vite@latest my-app -- --template react
cd my-app
npm install react@18 react-dom@18
npm run dev
\`\`\`

## Conclusion

React 18 is a major step forward in the React ecosystem. Start upgrading your apps today!`,
    created_at: new Date().toISOString(),
    tags: ['React', 'JavaScript'],
  }

  const displayPost = post || defaultPost
  const htmlContent = DOMPurify.sanitize(marked.parse(displayPost.content || displayPost.excerpt || ''))

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const calculateReadTime = (content) => {
    const wordsPerMinute = 200
    const words = content?.split(/\s+/).length || 0
    return Math.ceil(words / wordsPerMinute)
  }

  return (
    <div className="min-h-screen bg-forge-black pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-500 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}

        {!loading && (
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(displayPost.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{calculateReadTime(displayPost.content || displayPost.excerpt)} min read</span>
                </div>
              </div>

              <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
                {displayPost.title}
              </h1>

              <div className="flex flex-wrap gap-2">
                {displayPost.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-orange-500/10 rounded-full text-orange-500 text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="prose prose-invert prose-lg max-w-none
                prose-headings:font-display prose-headings:text-white
                prose-p:text-gray-300 prose-p:leading-relaxed
                prose-a:text-orange-500 prose-a:no-underline hover:prose-a:text-orange-400
                prose-code:text-orange-500 prose-code:bg-forge-surface prose-code:px-2 prose-code:rounded
                prose-pre:bg-forge-surface prose-pre:border prose-pre:border-forge-muted/20
                prose-blockquote:border-orange-500 prose-blockquote:bg-forge-surface prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:rounded-r-lg
                prose-li:text-gray-300"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </motion.article>
        )}
      </div>
    </div>
  )
}
