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
      const nextStatus = !post.published;
      await supabase
        .from('blog_posts')
        .update({ published: nextStatus })
        .eq('id', post.id);
      
      setPosts(posts.map(p => p.id === post.id ? { ...p, published: nextStatus } : p));

      // Trigger ingestion if toggled to published
      if (nextStatus) {
        fetch('/api/blog/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: post.id })
        }).catch(err => console.error('Failed to trigger ingestion on toggle:', err));
      }
    } catch (err) {
      console.error('Toggle error:', err);
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
          <h2 className="font-display text-2xl font-bold text-text">Blog Posts</h2>
          <p className="text-text-muted">Manage your articles and drafts</p>
        </div>
        <button
          onClick={() => { setIsCreating(true); setEditingPost(null) }}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent text-bg font-bold rounded-xl hover:bg-accent/80 transition-all shadow-lg shadow-accent/20"
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

      <div className="bg-surface rounded-2xl border border-muted/20 overflow-hidden shadow-xl shadow-black/5">
        <table className="w-full">
          <thead>
            <tr className="text-left text-text-muted text-xs uppercase tracking-widest border-b border-muted/10">
              <th className="p-5 font-semibold">Title</th>
              <th className="p-5 font-semibold">Status</th>
              <th className="p-5 font-semibold">Views</th>
              <th className="p-5 font-semibold">Date</th>
              <th className="p-5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted/5">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-text-muted/50 font-mono text-sm italic">
                  No posts yet. Create your first post!
                </td>
              </tr>
            ) : posts.map((post) => (
              <motion.tr
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-bg/40 transition-colors group"
              >
                <td className="p-5">
                  <span className="text-text font-medium group-hover:text-accent transition-colors">{post.title}</span>
                </td>
                <td className="p-5">
                  <button
                    onClick={() => handleTogglePublish(post)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      post.published
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-muted/10 text-text-muted border border-muted/20'
                    }`}
                  >
                    {post.published ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td className="p-5 text-text-muted">
                  <div className="flex items-center gap-1.5 font-mono text-sm">
                    <Eye className="w-4 h-4 text-accent/60" />
                    {post.views || 0}
                  </div>
                </td>
                <td className="p-5 text-text-muted font-mono text-sm">
                  {formatDate(post.created_at)}
                </td>
                <td className="p-5">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => { setEditingPost(post); setIsCreating(false) }}
                      className="p-2 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-all"
                      title="Edit Post"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Delete Post"
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
