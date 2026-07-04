'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Loader2, Globe, Lock, Clock, Tag, Folder, ChevronDown, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { updateContextFromArticle } from '../../lib/blog-ai';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with TipTap + Mermaid
const RichBlogEditor = dynamic(() => import('../editor/RichBlogEditor'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-bg rounded-xl border border-muted/20 animate-pulse">
      <div className="text-text-muted font-mono text-sm uppercase tracking-widest">Initialising Core Editor...</div>
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
  const [isAuditing, setIsAuditing] = useState(false);

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

      let savedPost = null;
      if (post?.id) {
        const { data, error } = await supabase
          .from('blog_posts')
          .update(payload)
          .eq('id', post.id)
          .select()
          .single();
        if (error) throw error;
        savedPost = data;
      } else {
        const { data, error } = await supabase
          .from('blog_posts')
          .insert([{ ...payload, created_at: new Date().toISOString(), views: 0 }])
          .select()
          .single();
        if (error) throw error;
        savedPost = data;
      }

      // If published, trigger the draft ingestion pipeline
      if (payload.published && savedPost?.id) {
        try {
          const triggerRes = await fetch('/api/blog/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post_id: savedPost.id })
          });
          if (!triggerRes.ok) {
            console.warn('Draft ingestion queue trigger failed');
          }
        } catch (triggerErr) {
          console.error('Trigger drafts ingestion error:', triggerErr);
        }
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

  const handleSEOAudit = async () => {
    if (!meta.title || !content.text) return;
    setIsAuditing(true);
    try {
      const { generateHeadlines, summarizeText } = await import('../../lib/blog-ai');
      const betterSlugs = await generateHeadlines(meta.title);
      const betterSummary = await summarizeText(content.text);
      
      if (betterSlugs?.length > 0) {
        setMeta(prev => ({ 
          ...prev, 
          slug: betterSlugs[0].toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          excerpt: betterSummary || prev.excerpt 
        }));
        setSaveMsg('AI optimization applied to Slug and Excerpt.');
      }
    } catch (err) {
      console.error('SEO Audit failed:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 w-full"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl font-bold text-text">{post ? 'Edit Article' : 'New Article'}</h3>
          <p className="text-text-muted text-sm">Drafting your next thought</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onCancel} className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:text-text rounded-xl hover:bg-muted/10 transition-all">
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(null, false)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-muted/10 text-text/80 rounded-xl hover:bg-muted/20 border border-muted/20 transition-all font-medium"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(null, true)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 text-sm bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all shadow-lg shadow-accent/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} Publish
          </button>
        </div>
      </div>

      {saveMsg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${saveMsg.includes('failed') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
          {saveMsg}
        </div>
      )}

      {/* Cover Image */}
      {meta.cover_image && (
        <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-muted/20 shadow-lg">
          <img src={meta.cover_image} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Main Form Area */}
      <div className="bg-surface p-6 rounded-3xl border border-muted/20 space-y-6">
        <input
          type="text"
          name="title"
          value={meta.title}
          onChange={handleMetaChange}
          placeholder="Article title..."
          required
          className="w-full text-4xl font-display font-black text-text bg-transparent outline-none border-b border-muted/10 focus:border-accent pb-4 transition-all placeholder:text-muted/20"
        />

        {/* Meta Row */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Category */}
          <div className="flex items-center gap-2 bg-bg/50 border border-muted/20 rounded-xl px-4 py-2">
            <Folder className="w-4 h-4 text-accent" />
            <select
              name="category_id"
              value={meta.category_id}
              onChange={handleMetaChange}
              className="bg-transparent text-sm text-text font-medium outline-none pr-4 cursor-pointer"
            >
              <option value="">No Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Schedule */}
          <div className="flex items-center gap-2 bg-bg/50 border border-muted/20 rounded-xl px-4 py-2">
            <Clock className="w-4 h-4 text-accent" />
            <input
              type="datetime-local"
              name="scheduled_at"
              value={meta.scheduled_at}
              onChange={handleMetaChange}
              className="bg-transparent text-sm text-text font-medium outline-none cursor-pointer"
              title="Schedule publish time"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 flex-1 bg-bg/50 border border-muted/20 rounded-xl px-4 py-2 min-w-[280px]">
            <Tag className="w-4 h-4 text-accent shrink-0" />
            {meta.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 border border-accent/20 rounded-full text-xs font-bold text-accent">
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
              placeholder="+ tag"
              className="bg-transparent text-sm text-text outline-none min-w-[80px] flex-1"
            />
          </div>
        </div>

        {/* Advanced Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-accent uppercase tracking-widest transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          {showAdvanced ? 'Hide Details' : 'Advanced Details'}
        </button>

        {showAdvanced && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between p-4 bg-accent/5 border border-accent/20 rounded-2xl">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-accent" />
                <div>
                  <h4 className="text-sm font-black text-text uppercase tracking-tight">AI SEO Optimizer</h4>
                  <p className="text-[10px] text-text-muted">Analyze discoverability & readability</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleSEOAudit}
                disabled={isAuditing}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-bg text-[10px] font-black rounded-lg hover:bg-accent/80 transition-all uppercase tracking-widest"
              >
                {isAuditing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Run Smart Audit'}
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 p-6 bg-bg/40 border border-muted/10 rounded-2xl">
            <div className="sm:col-span-2">
              <label className="block text-[10px] text-text-muted mb-2 font-black uppercase tracking-[0.2em]">Cover Image URL</label>
              <input type="url" name="cover_image" value={meta.cover_image} onChange={handleMetaChange} placeholder="https://..." className="w-full bg-surface border border-muted/20 rounded-xl px-4 py-3 text-sm text-text focus:border-accent outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[10px] text-text-muted mb-2 font-black uppercase tracking-[0.2em]">Custom Slug</label>
              <input type="text" name="slug" value={meta.slug} onChange={handleMetaChange} required className="w-full bg-surface border border-muted/20 rounded-xl px-4 py-3 text-sm font-mono text-text focus:border-accent outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[10px] text-text-muted mb-2 font-black uppercase tracking-[0.2em]">Excerpt (Meta Description)</label>
              <textarea name="excerpt" value={meta.excerpt} onChange={handleMetaChange} rows={2} className="w-full bg-surface border border-muted/20 rounded-xl px-4 py-3 text-sm text-text focus:border-accent outline-none resize-none transition-all" />
            </div>
          </div>
        </div>
      )}
      </div>

      {/* The Editor */}
      <RichBlogEditor
        initialContent={content.html}
        onChange={handleEditorChange}
        onSave={handleAutoSave}
      />
    </motion.div>
  );
}
