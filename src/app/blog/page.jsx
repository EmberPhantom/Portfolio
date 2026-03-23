'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Hash, ArrowUpRight, Search, BookOpen, Filter } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

function readingTime(content) {
  const words = content?.replace(/<[^>]*>/g, '').split(/\s+/).length || 0;
  return Math.max(1, Math.ceil(words / 200));
}

function BlogCard({ post, index }) {
  const rt = readingTime(post.content || '');
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="group block overflow-hidden rounded-2xl border border-muted/20 bg-surface hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5"
      >
        {/* Cover Image */}
        {post.cover_image && (
          <div className="relative h-52 overflow-hidden">
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
          </div>
        )}

        <div className="p-7">
          {/* Category + Date row */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {post.categories && (
              <span className="flex items-center gap-1 text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ color: post.categories.color || '#F97316', backgroundColor: `${post.categories.color || '#F97316'}15`, border: `1px solid ${post.categories.color || '#F97316'}30` }}>
                <Hash className="w-3 h-3" />{post.categories.name}
              </span>
            )}
            <span className="text-xs font-mono text-text-muted">
              {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1 text-xs font-mono text-text-muted ml-auto">
              <Clock className="w-3 h-3" />{rt} min read
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-display font-bold text-text mb-3 group-hover:text-accent transition-colors leading-tight">
            {post.title}
          </h2>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-text-muted text-base leading-relaxed mb-5 line-clamp-2">{post.excerpt}</p>
          )}

          {/* Tags + CTA */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {(post.tags || []).slice(0, 3).map(tag => (
                <span key={tag} className="text-xs font-mono text-gray-600 px-2 py-0.5 rounded-full border border-forge-muted/20">{tag}</span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-sm font-semibold">Read</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function BlogList() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) { setLoading(false); return; }
    const supabase = createClient(supabaseUrl, supabaseKey);

    async function fetchData() {
      const [postsRes, catsRes] = await Promise.all([
        supabase.from('blog_posts').select('*, categories(id, name, slug, color)').eq('published', true).order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ]);
      setPosts(postsRes.data || []);
      setCategories(catsRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filtered = posts.filter(p => {
    const matchCat = activeCategory === 'all' || p.category_id === activeCategory;
    const matchSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="pt-32 pb-32 px-6 md:px-12 max-w-5xl mx-auto min-h-screen w-full">
      {/* Hero */}
      <div className="mb-16">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-accent font-mono tracking-[0.2em] text-sm uppercase mb-4">// JOURNAL</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-5xl md:text-8xl font-display font-black text-text uppercase tracking-tighter mb-6">
          The <span className="text-accent">Journal.</span>
        </motion.h1>
         <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-text-muted text-xl max-w-xl">
          Research, projects, events — documented in real time.
        </motion.p>
      </div>

      {/* Search + Filter bar */}
      <div className="mb-10 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-muted/20 rounded-xl pl-11 pr-4 py-3 text-text focus:border-accent/50 outline-none transition-colors font-body"
          />
        </div>

        {/* Category Tabs */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-mono font-bold transition-all ${activeCategory === 'all' ? 'bg-orange-500 text-forge-black' : 'bg-forge-muted/10 text-gray-400 border border-forge-muted/20 hover:border-orange-500/30'}`}
            >
              <Filter className="w-3.5 h-3.5" /> All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-mono font-bold transition-all border`}
                style={activeCategory === cat.id ? { backgroundColor: cat.color, color: '#0a0a0a', borderColor: cat.color } : { color: cat.color || '#9ca3af', borderColor: `${cat.color || '#6b7280'}30`, backgroundColor: `${cat.color || '#6b7280'}10` }}
              >
                <Hash className="w-3.5 h-3.5" />{cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Article Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-forge-surface/30 border border-forge-muted/20 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{searchQuery ? 'No articles match your search.' : 'No published articles yet.'}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((post, i) => <BlogCard key={post.id} post={post} index={i} />)}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
