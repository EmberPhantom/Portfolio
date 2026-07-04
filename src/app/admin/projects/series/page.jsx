'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { 
  FolderGit2, 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  FolderOpen,
  ArrowLeft,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function SeriesDashboard() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    cover_image_url: ''
  });

  useEffect(() => {
    fetchSeries();
  }, []);

  async function fetchSeries() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects/series');
      if (!res.ok) throw new Error('Failed to fetch series list');
      const data = await res.json();
      setSeries(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenCreate = () => {
    setEditingSeries(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      cover_image_url: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditingSeries(s);
    setFormData({
      title: s.title || '',
      slug: s.slug || '',
      description: s.description || '',
      cover_image_url: s.cover_image_url || ''
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (key, val) => {
    setFormData(prev => {
      const updated = { ...prev, [key]: val };
      // Auto-generate slug from title if creating new
      if (key === 'title' && !editingSeries) {
        updated.slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let res;
      if (editingSeries) {
        // Edit flow
        res = await fetch('/api/projects/series', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingSeries.id, ...formData })
        });
      } else {
        // Create flow
        res = await fetch('/api/projects/series', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to save series record');
      }

      setIsModalOpen(false);
      fetchSeries();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this series? Note that related projects/episodes might lose their relation.')) return;
    
    setError(null);
    try {
      const res = await fetch(`/api/projects/series?id=${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to delete series');
      }
      fetchSeries();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && series.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-text-muted">Loading build series space...</span>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back to Projects */}
      <Link
        href="/admin/projects"
        className="flex items-center gap-2 text-text-muted hover:text-accent font-mono text-[10px] font-black uppercase tracking-wider mb-6 group w-fit"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> BACK_TO_PROJECTS
      </Link>

      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <FolderGit2 className="w-8 h-8 text-accent animate-pulse" />
            <h2 className="font-display text-4xl font-black text-text uppercase tracking-tighter">Series playlists</h2>
          </div>
          <p className="text-text-muted text-sm mt-2">Manage playlists linking clone builds and episodes together</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-3 bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-accent/15"
        >
          <Plus className="w-4 h-4" /> CREATE_NEW_SERIES
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl mb-8 border border-red-500/20 font-mono text-sm">
          ERROR: {error}
        </div>
      )}

      {series.length === 0 ? (
        <div className="bg-surface border border-muted/10 rounded-[2rem] p-12 text-center text-text-muted">
          <FolderOpen className="w-12 h-12 text-accent/30 mx-auto mb-4" />
          <p className="text-sm font-mono uppercase tracking-widest">No series playlists found.</p>
          <p className="text-xs text-text-muted/60 mt-1">Click the button above to start your first playlist series.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {series.map((s) => (
            <div
              key={s.id}
              className="bg-surface border border-muted/20 rounded-[2rem] p-6 shadow-xl flex flex-col hover:border-accent/40 transition-all duration-300 relative group overflow-hidden"
            >
              {/* Cover Image Placeholder or Real */}
              {s.cover_image_url ? (
                <div className="w-full h-32 rounded-xl mb-4 overflow-hidden border border-muted/10">
                  <img src={s.cover_image_url} alt={s.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-32 rounded-xl mb-4 bg-bg/50 border border-muted/10 flex items-center justify-center font-mono text-[9px] uppercase tracking-widest text-text-muted">
                  [Cover Image Unconfigured]
                </div>
              )}

              {/* Title & Slug */}
              <div className="mb-4">
                <h3 className="font-display text-2xl font-black text-white group-hover:text-accent transition-colors">
                  {s.title}
                </h3>
                <p className="text-xs font-mono text-text-muted mt-0.5">
                  Slug: <span className="text-white font-bold">{s.slug}</span>
                </p>
              </div>

              {/* Description */}
              <p className="text-text-muted text-sm line-clamp-3 mb-6 flex-1">
                {s.description || 'No series description configured.'}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-end border-t border-muted/10 pt-4 mt-auto gap-3">
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="p-2 bg-bg text-text-muted hover:text-white rounded-lg border border-muted/10 hover:border-muted/30 transition-all"
                  title="Edit Series"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-2 bg-bg text-red-500/80 hover:text-red-400 rounded-lg border border-muted/10 hover:border-red-500/20 transition-all"
                  title="Delete Series"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Series Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f1424] border border-muted/20 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in scale-in duration-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-muted/10 flex items-center justify-between bg-[#13192c]">
              <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">
                {editingSeries ? 'Modify Series Playlist' : 'Create Series Playlist'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6 flex-1 text-sm text-text scrollbar-thin">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Series Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => handleInputChange('title', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none"
                    placeholder="FAANG Clones 2026"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Series Slug</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={e => handleInputChange('slug', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono text-xs"
                    placeholder="faang-clones-2026"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Cover Image URL</label>
                <input
                  type="url"
                  value={formData.cover_image_url}
                  onChange={e => handleInputChange('cover_image_url', e.target.value)}
                  className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono text-xs"
                  placeholder="https://example.com/cover-image.jpg"
                />
              </div>

              <div>
                <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none resize-none"
                  placeholder="Building full-stack implementations of leading engineering architectures in Deno & Supabase..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 items-center justify-end border-t border-muted/10 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 border border-muted/20 text-text-muted hover:text-white rounded-xl uppercase tracking-widest text-[10px] font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-3 bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all disabled:opacity-50 uppercase tracking-widest text-[10px] shadow-lg shadow-accent/15"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {saving ? 'SAVING_CHANGES...' : editingSeries ? 'APPLY_CHANGES' : 'CREATE_SERIES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
