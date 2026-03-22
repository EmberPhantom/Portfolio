import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, Save, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import dynamic from 'next/dynamic'
const BlogEditor = dynamic(() => import('./BlogEditor'), { ssr: false })

export default function PostManager() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPost, setEditingPost] = useState(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })
      
      setPosts(data || [])
    } catch (err) {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    try {
      await supabase.from('blog_posts').delete().eq('id', id)
      setPosts(posts.filter(p => p.id !== id))
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  async function handleTogglePublish(post) {
    try {
      await supabase
        .from('blog_posts')
        .update({ published: !post.published })
        .eq('id', post.id)
      
      setPosts(posts.map(p => p.id === post.id ? { ...p, published: !p.published } : p))
    } catch (err) {
      console.error('Toggle error:', err)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Blog Posts</h2>
          <p className="text-gray-400">Manage your blog posts</p>
        </div>
        <button
          onClick={() => { setIsCreating(true); setEditingPost(null) }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-forge-black font-medium rounded-lg hover:bg-orange-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {(isCreating || editingPost) && (
        <BlogEditor
          post={editingPost}
          onSave={() => { setIsCreating(false); setEditingPost(null); fetchPosts() }}
          onCancel={() => { setIsCreating(false); setEditingPost(null) }}
        />
      )}

      <div className="bg-forge-surface rounded-xl border border-forge-muted/20 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-forge-muted/20">
            <tr className="text-left text-gray-400 text-sm">
              <th className="p-4 font-medium">Title</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Views</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No posts yet. Create your first post!
                </td>
              </tr>
            ) : posts.map((post) => (
              <motion.tr
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-forge-muted/10 hover:bg-forge-black/50"
              >
                <td className="p-4">
                  <span className="text-white font-medium">{post.title}</span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleTogglePublish(post)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      post.published
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-gray-500/20 text-gray-500'
                    }`}
                  >
                    {post.published ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td className="p-4 text-gray-400">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post.views || 0}
                  </div>
                </td>
                <td className="p-4 text-gray-400">
                  {formatDate(post.created_at)}
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => { setEditingPost(post); setIsCreating(false) }}
                      className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
