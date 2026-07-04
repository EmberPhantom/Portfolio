'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../../lib/supabase';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  FolderOpen,
  ArrowLeft,
  X,
  Youtube,
  FileText,
  Calendar,
  Play
} from 'lucide-react';
import Link from 'next/link';

export default function EpisodesDashboard({ params }) {
  const { id: projectId } = React.use(params);

  const [project, setProject] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    episode_number: '',
    status: 'planned',
    youtube_url: '',
    script_md: '',
    published_at: '',
    series_id: ''
  });

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchEpisodes();
      fetchSeries();
    }
  }, [projectId]);

  async function fetchProject() {
    try {
      const res = await fetch(`/api/projects?id=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (err) {
      console.error('Failed to fetch project', err);
    }
  }

  async function fetchEpisodes() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/episodes?project_id=${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch episodes list');
      const data = await res.json();
      setEpisodes(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSeries() {
    try {
      const res = await fetch('/api/projects/series');
      if (res.ok) {
        const data = await res.json();
        setSeriesList(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch series list', err);
    }
  }

  const handleOpenCreate = () => {
    setEditingEpisode(null);
    setFormData({
      title: '',
      episode_number: episodes.length + 1,
      status: 'planned',
      youtube_url: '',
      script_md: '',
      published_at: '',
      series_id: project?.series_id || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ep) => {
    setEditingEpisode(ep);
    setFormData({
      title: ep.title || '',
      episode_number: ep.episode_number || '',
      status: ep.status || 'planned',
      youtube_url: ep.youtube_url || '',
      script_md: ep.script_md || '',
      published_at: ep.published_at ? ep.published_at.substring(0, 16) : '',
      series_id: ep.series_id || ''
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...formData,
      project_id: projectId,
      episode_number: formData.episode_number ? parseInt(formData.episode_number, 10) : null,
      published_at: formData.published_at ? new Date(formData.published_at).toISOString() : null,
      series_id: formData.series_id || null
    };

    try {
      let res;
      if (editingEpisode) {
        // Edit flow
        res = await fetch('/api/projects/episodes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingEpisode.id, ...payload })
        });
      } else {
        // Create flow
        res = await fetch('/api/projects/episodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to save episode record');
      }

      setIsModalOpen(false);
      fetchEpisodes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this episode?')) return;
    
    setError(null);
    try {
      const res = await fetch(`/api/projects/episodes?id=${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to delete episode');
      }
      fetchEpisodes();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'editing':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'recording':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'scripting':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  if (loading && episodes.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-text-muted">Loading project episode desk...</span>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back to Project Panel */}
      <Link
        href={`/admin/projects/${projectId}`}
        className="flex items-center gap-2 text-text-muted hover:text-accent font-mono text-[10px] font-black uppercase tracking-wider mb-6 group w-fit"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> BACK_TO_CONTROL_ROOM
      </Link>

      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <Youtube className="w-8 h-8 text-accent animate-pulse" />
            <h2 className="font-display text-4xl font-black text-text uppercase tracking-tighter">
              {project ? `${project.name} // Episodes` : 'Project Episodes'}
            </h2>
          </div>
          <p className="text-text-muted text-sm mt-2">Create and sequence video log builds for this project</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-3 bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-accent/15"
        >
          <Plus className="w-4 h-4" /> ADD_NEW_EPISODE
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl mb-8 border border-red-500/20 font-mono text-sm">
          ERROR: {error}
        </div>
      )}

      {episodes.length === 0 ? (
        <div className="bg-surface border border-muted/10 rounded-[2rem] p-12 text-center text-text-muted">
          <FolderOpen className="w-12 h-12 text-accent/30 mx-auto mb-4" />
          <p className="text-sm font-mono uppercase tracking-widest">No episodes sequenced yet.</p>
          <p className="text-xs text-text-muted/60 mt-1">Click the button above to declare your first video build session.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {episodes.map((ep) => (
            <div
              key={ep.id}
              className="bg-surface border border-muted/20 rounded-[2rem] p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between hover:border-accent/40 transition-all duration-300 gap-6"
            >
              {/* Left Side: Number, Title, Series Info */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-bg border border-muted/10 rounded-xl flex items-center justify-center font-mono text-sm text-accent font-black shrink-0">
                  {ep.episode_number || '#'}
                </div>
                <div>
                  <h3 className="text-xl font-display font-black text-white hover:text-accent transition-colors">
                    {ep.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1 text-xs text-text-muted">
                    {ep.series && (
                      <span className="font-mono text-[9px] uppercase bg-bg/50 px-2 py-0.5 border border-muted/10 rounded-full">
                        Series: {ep.series.title}
                      </span>
                    )}
                    {ep.youtube_url && (
                      <a
                        href={ep.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-accent hover:underline font-mono text-[10px]"
                      >
                        <Play className="w-3 h-3" /> WATCH_VIDEO
                      </a>
                    )}
                    {ep.published_at && (
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Calendar className="w-3.5 h-3.5" /> {new Date(ep.published_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Status and Actions */}
              <div className="flex items-center gap-4 ml-auto md:ml-0 shrink-0">
                <span className={`text-[9px] font-mono px-2.5 py-1 rounded-full uppercase tracking-wider font-bold ${getStatusColor(ep.status)}`}>
                  {ep.status}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(ep)}
                    className="p-2 bg-bg text-text-muted hover:text-white rounded-lg border border-muted/10 hover:border-muted/30 transition-all"
                    title="Edit Episode"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ep.id)}
                    className="p-2 bg-bg text-red-500/80 hover:text-red-400 rounded-lg border border-muted/10 hover:border-red-500/20 transition-all"
                    title="Delete Episode"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Episode Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f1424] border border-muted/20 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in scale-in duration-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-muted/10 flex items-center justify-between bg-[#13192c]">
              <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">
                {editingEpisode ? 'Modify Episode Frame' : 'Add Episode Frame'}
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
              <div className="grid sm:grid-cols-3 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Episode Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => handleInputChange('title', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none"
                    placeholder="Implementing Live Logs streaming"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Episode Number</label>
                  <input
                    type="number"
                    value={formData.episode_number}
                    onChange={e => handleInputChange('episode_number', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono"
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Linked Series</label>
                  <select
                    value={formData.series_id}
                    onChange={e => handleInputChange('series_id', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none"
                  >
                    <option value="">-- No Series --</option>
                    {seriesList.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Production status</label>
                  <select
                    value={formData.status}
                    onChange={e => handleInputChange('status', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none"
                  >
                    <option value="planned">Planned</option>
                    <option value="scripting">Scripting</option>
                    <option value="recording">Recording</option>
                    <option value="editing">Editing</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">YouTube URL</label>
                  <input
                    type="url"
                    value={formData.youtube_url}
                    onChange={e => handleInputChange('youtube_url', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono text-xs"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Published At</label>
                  <input
                    type="datetime-local"
                    value={formData.published_at}
                    onChange={e => handleInputChange('published_at', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono text-xs text-text-muted"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Script Excerpts (Markdown)
                </label>
                <textarea
                  rows={6}
                  value={formData.script_md}
                  onChange={e => handleInputChange('script_md', e.target.value)}
                  className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono text-xs resize-none"
                  placeholder="# Introduction\nHey guys! Today we're building..."
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
                  {saving ? 'SAVING_CHANGES...' : editingEpisode ? 'APPLY_CHANGES' : 'CREATE_EPISODE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
