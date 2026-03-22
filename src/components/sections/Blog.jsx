import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, ArrowRight, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(3)

        if (error) {
          console.log('Blog fetch error (expected if no Supabase):', error.message)
          setPosts([])
        } else {
          setPosts(data || [])
        }
      } catch (err) {
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const calculateReadTime = (content) => {
    const wordsPerMinute = 200
    const words = content?.split(/\s+/).length || 0
    return Math.ceil(words / wordsPerMinute)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const defaultPosts = [
    {
      id: 1,
      title: 'Getting Started with React 18',
      slug: 'getting-started-with-react-18',
      excerpt: 'Learn about the new features in React 18 including automatic batching, transitions, and Suspense improvements.',
      created_at: new Date().toISOString(),
      tags: ['React', 'JavaScript'],
    },
    {
      id: 2,
      title: 'Building REST APIs with Node.js',
      slug: 'building-rest-apis-nodejs',
      excerpt: 'A comprehensive guide to building scalable REST APIs using Node.js, Express, and MongoDB.',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['Node.js', 'Backend'],
    },
    {
      id: 3,
      title: 'Introduction to TypeScript',
      slug: 'introduction-to-typescript',
      excerpt: 'Why TypeScript is essential for modern web development and how to get started with it.',
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['TypeScript', 'JavaScript'],
    },
  ]

  const displayPosts = posts.length > 0 ? posts : defaultPosts

  return (
    <section id="blog" className="py-24 bg-forge-black">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Latest <span className="text-orange-500">Blog Posts</span>
          </h2>
          <div className="w-20 h-1 bg-orange-500" />
          <p className="text-gray-400 mt-4 max-w-2xl">
            Thoughts on development, technology, and building things.
          </p>
        </motion.div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-forge-surface rounded-xl border border-forge-muted/20 overflow-hidden hover:border-orange-500/50 transition-colors group"
            >
              <div className="h-40 bg-gradient-to-br from-orange-500/20 to-forge-black relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl opacity-30">📝</span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{calculateReadTime(post.content || post.excerpt)} min</span>
                  </div>
                </div>

                <h3 className="font-display text-xl font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors">
                  {post.title}
                </h3>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {post.excerpt || 'Read more to learn about this topic...'}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags?.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs bg-forge-black rounded-full text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <Link
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors"
                >
                  Read More
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <button className="px-6 py-3 border border-gray-600 text-white font-semibold rounded-lg hover:border-orange-500 hover:text-orange-500 transition-colors">
            View All Posts
          </button>
        </motion.div>
      </div>
    </section>
  )
}
