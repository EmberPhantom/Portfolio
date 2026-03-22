'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Loader2, Globe, Lock, Clock, Tag, Folder, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { updateContextFromArticle } from '../../lib/blog-ai';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with TipTap + Mermaid
const RichBlogEditor = dynamic(() => import('../editor/RichBlogEditor'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-[#0c0c0c] rounded-xl border border-forge-muted/20 animate-pulse">
      <div className="text-gray-600 font-mono text-sm">Loading editor...</div>
    </div>
  )
});

export default function BlogEditor({ post, onSave, onCancel }) {
  const [meta, setMeta] = useState({
    title: '',
    slug: '',
    excerpt: '',
    tags: [],
    category_id: '',
    cover_image: '',
    published: false,
    scheduled_at: '',
  });
  const [content, setContent] = useState({ html: '', json: null, text: '' });
  const [categories, setCategories] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load categories and populate form if editing
  useEffect(() => {
    if (supabase) {
      supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []));
    }
    if (post) {
      setMeta({
        title: post.title || '',
        slug: post.slug || '',
        excerpt: post.excerpt || '',
        tags: post.tags || [],
        category_id: post.category_id || '',
        cover_image: post.cover_image || '',
        published: post.published || false,
        scheduled_at: post.scheduled_at ? new Date(post.scheduled_at).toISOString().slice(0, 16) : '',
      });
      setContent({
        html: post.content || '',
        json: post.content_json || null,
        text: '',
      });
    }
  }, [post]);

  const generateSlug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleMetaChange = (e) => {
    const { name, value } = e.target;
    setMeta(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'title') updated.slug = generateSlug(value);
      return updated;
    });
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!meta.tags.includes(tagInput.trim())) setMeta(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleEditorChange = useCallback((data) => setContent(data), []);

  const handleAutoSave = useCallback(async (data, mode) => {
    if (mode !== 'autosave' || !post?.id || !supabase) return;
    await supabase.from('blog_posts').update({ content: data.html, content_json: data.json, updated_at: new Date().toISOString() }).eq('id', post.id);
  }, [post]);

  const handleSubmit = async (e, publishOverride) => {
    e?.preventDefault();
    if (!meta.title || !content.html) return;
    setSaving(true);
    setSaveMsg('');

    try {
      const payload = {
        title: meta.title,
        slug: meta.slug || generateSlug(meta.title),
        excerpt: meta.excerpt || '',
        content: content.html,
        content_json: content.json,
        tags: meta.tags || [],
        published: publishOverride !== undefined ? publishOverride : meta.published,
        category_id: meta.category_id && meta.category_id !== '' ? meta.category_id : null,
        cover_image: meta.cover_image && meta.cover_image !== '' ? meta.cover_image : null,
        scheduled_at: meta.scheduled_at ? new Date(meta.scheduled_at).toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      console.log('Final Payload:', payload);

      if (post?.id) {
        const { error } = await supabase.from('blog_posts').update(payload).eq('id', post.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('blog_posts').insert([{ ...payload, created_at: new Date().toISOString(), views: 0 }]);
        if (error) throw error;
      }

      // Update AI memory from article content
      updateContextFromArticle(meta.title, content.text).catch(() => {});

      setSaveMsg('Saved successfully!');
      setTimeout(onSave, 800);
    } catch (err) {
      console.error('Save error full:', err);
      const errorMsg = err?.message || err?.details || 'Unknown error';
      setSaveMsg(`Save failed: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 w-full"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-bold text-white">{post ? 'Edit Article' : 'New Article'}</h3>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-forge-muted/20 transition-colors">
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(null, false)}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-forge-muted/20 text-gray-300 rounded-lg hover:bg-forge-muted/40 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(null, true)}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-500 text-forge-black font-bold rounded-lg hover:bg-orange-400 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} Publish
          </button>
        </div>
      </div>

      {saveMsg && (
        <div className={`px-4 py-2 rounded-lg text-sm ${saveMsg.includes('failed') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
          {saveMsg}
        </div>
      )}

      {/* Cover Image */}
      {meta.cover_image && (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-forge-muted/20">
          <img src={meta.cover_image} alt="Cover" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Title */}
      <input
        type="text"
        name="title"
        value={meta.title}
        onChange={handleMetaChange}
        placeholder="Article title..."
        required
        className="w-full text-3xl font-display font-bold text-white bg-transparent outline-none border-b border-forge-muted/20 focus:border-orange-500 pb-3 transition-colors placeholder:text-gray-700"
      />

      {/* Quick Meta Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Category */}
        <div className="relative flex items-center gap-1.5 bg-forge-muted/10 border border-forge-muted/20 rounded-lg px-3 py-1.5">
          <Folder className="w-3.5 h-3.5 text-gray-500" />
          <select
            name="category_id"
            value={meta.category_id}
            onChange={handleMetaChange}
            className="bg-transparent text-sm text-gray-300 outline-none pr-4 cursor-pointer"
          >
            <option value="">No Category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Schedule */}
        <div className="flex items-center gap-1.5 bg-forge-muted/10 border border-forge-muted/20 rounded-lg px-3 py-1.5">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <input
            type="datetime-local"
            name="scheduled_at"
            value={meta.scheduled_at}
            onChange={handleMetaChange}
            className="bg-transparent text-sm text-gray-300 outline-none cursor-pointer"
            title="Schedule publish time (optional)"
          />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1 bg-forge-muted/10 border border-forge-muted/20 rounded-lg px-3 py-1.5 min-w-48">
          <Tag className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          {meta.tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-forge-black/60 border border-forge-muted/30 rounded-full text-xs text-gray-300">
              {tag}
              <button type="button" onClick={() => setMeta(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Add tag + Enter"
            className="bg-transparent text-xs text-gray-300 outline-none min-w-20 flex-1"
          />
        </div>
      </div>

      {/* Advanced Options */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 w-fit transition-colors"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        {showAdvanced ? 'Hide' : 'Show'} advanced options (slug, excerpt, cover image)
      </button>

      {showAdvanced && (
        <div className="grid sm:grid-cols-2 gap-3 p-4 bg-forge-muted/5 border border-forge-muted/20 rounded-xl">
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-500 mb-1 font-mono uppercase tracking-wider">Cover Image URL</label>
            <input type="url" name="cover_image" value={meta.cover_image} onChange={handleMetaChange} placeholder="https://..." className="w-full bg-forge-black/60 border border-forge-muted/20 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-mono uppercase tracking-wider">Slug</label>
            <input type="text" name="slug" value={meta.slug} onChange={handleMetaChange} required className="w-full bg-forge-black/60 border border-forge-muted/20 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-mono uppercase tracking-wider">Excerpt</label>
            <textarea name="excerpt" value={meta.excerpt} onChange={handleMetaChange} rows={2} className="w-full bg-forge-black/60 border border-forge-muted/20 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 outline-none resize-none" />
          </div>
        </div>
      )}

      {/* The Editor */}
      <RichBlogEditor
        initialContent={content.html}
        onChange={handleEditorChange}
        onSave={handleAutoSave}
      />
    </motion.div>
  );
}
