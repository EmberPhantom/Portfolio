'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  FolderGit2, 
  Plus, 
  Trash2, 
  Edit2, 
  ExternalLink, 
  Github, 
  Globe, 
  Loader2, 
  ChevronRight,
  Eye,
  EyeOff,
  FolderOpen
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectsDashboard() {
  const [projects, setProjects] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    target_company: '',
    description: '',
    github_repo_url: '',
    github_repo_full_name: '',
    live_url: '',
    status: 'planned',
    tech_stack: '',
    architecture_notes: '',
    is_public_buildable: false,
    is_featured: false,
    series_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Projects via API route proxy
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects list');
      const projData = await res.json();
      setProjects(projData || []);

      // 2. Fetch Series list for mapping (public read RLS allows this)
      if (supabase) {
        const { data: seriesData } = await supabase
          .from('series')
          .select('id, title');
        setSeriesList(seriesData || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      slug: '',
      target_company: '',
      description: '',
      github_repo_url: '',
      github_repo_full_name: '',
      live_url: '',
      status: 'planned',
      tech_stack: '',
      architecture_notes: '',
      is_public_buildable: false,
      is_featured: false,
      series_id: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name || '',
      slug: project.slug || '',
      target_company: project.target_company || '',
      description: project.description || '',
      github_repo_url: project.github_repo_url || '',
      github_repo_full_name: project.github_repo_full_name || '',
      live_url: project.live_url || '',
      status: project.status || 'planned',
      tech_stack: project.tech_stack ? project.tech_stack.join(', ') : '',
      architecture_notes: project.architecture_notes || '',
      is_public_buildable: !!project.is_public_buildable,
      is_featured: !!project.is_featured,
      series_id: project.series_id || ''
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (key, val) => {
    setFormData(prev => {
      const updated = { ...prev, [key]: val };
      // Auto-generate slug from name if creating new
      if (key === 'name' && !editingProject) {
        updated.slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Convert comma-separated string back to array of strings
    const techArray = formData.tech_stack
      ? formData.tech_stack.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const payload = {
      ...formData,
      tech_stack: techArray,
      series_id: formData.series_id || null
    };

    try {
      let res;
      if (editingProject) {
        // Edit flow
        res = await fetch('/api/projects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProject.id, ...payload })
        });
      } else {
        // Create flow
        res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to save project record');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this project? All associated builds and logs will be permanently removed.')) return;
    
    setError(null);
    try {
      const res = await fetch(`/api/projects?id=${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to delete project');
      }
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'building':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'archived':
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-text-muted">Loading project space...</span>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <FolderGit2 className="w-8 h-8 text-accent animate-pulse" />
            <h2 className="font-display text-4xl font-black text-text uppercase tracking-tighter">Repository Control Panel</h2>
          </div>
          <p className="text-text-muted text-sm mt-2">Create and monitor dynamic source code verification templates</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/admin/projects/series"
            className="flex items-center gap-2 px-5 py-3 bg-surface hover:bg-white/5 border border-muted/20 text-text-muted hover:text-white font-black rounded-xl transition-all uppercase tracking-widest text-[10px]"
          >
            MANAGE_SERIES_PLAYLISTS
          </Link>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-3 bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-accent/15"
          >
            <Plus className="w-4 h-4" /> ADD_NEW_TEMPLATE
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl mb-8 border border-red-500/20 font-mono text-sm">
          ERROR: {error}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="bg-surface border border-muted/10 rounded-[2rem] p-12 text-center text-text-muted">
          <FolderOpen className="w-12 h-12 text-accent/30 mx-auto mb-4" />
          <p className="text-sm font-mono uppercase tracking-widest">No tracked templates found.</p>
          <p className="text-xs text-text-muted/60 mt-1">Click the button above to seed your first portfolio project.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-surface border border-muted/20 rounded-[2rem] p-6 shadow-xl flex flex-col hover:border-accent/40 transition-all duration-300 relative group overflow-hidden"
            >
              {/* Top Row: Series & RLS Privacy */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-mono text-accent/60 uppercase font-bold tracking-wider">
                  {project.series?.title || 'Standalone Template'}
                </span>
                <span className="flex items-center gap-1.5 text-[9px] font-mono text-text-muted bg-bg/50 px-2 py-0.5 rounded-full border border-muted/10">
                  {project.is_public_buildable ? (
                    <>
                      <Eye className="w-3 h-3 text-green-400" /> PUBLIC_LOGS_ON
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 text-red-400" /> PRIVATE_LOGS
                    </>
                  )}
                </span>
              </div>

              {/* Title & Tagline */}
              <div className="mb-4">
                <h3 className="font-display text-2xl font-black text-white group-hover:text-accent transition-colors">
                  {project.name}
                </h3>
                {project.target_company && (
                  <p className="text-xs font-mono text-text-muted mt-0.5">
                    Clone Target: <span className="text-white font-bold">{project.target_company}</span>
                  </p>
                )}
              </div>

              {/* Description */}
              <p className="text-text-muted text-sm line-clamp-3 mb-6 flex-1">
                {project.description || 'No project description configured.'}
              </p>

              {/* Tech Stack Badges */}
              {project.tech_stack && project.tech_stack.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {project.tech_stack.slice(0, 4).map((tech, i) => (
                    <span
                      key={i}
                      className="text-[9px] font-mono px-2 py-0.5 rounded bg-bg text-text-muted border border-muted/10"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.tech_stack.length > 4 && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-bg text-accent/60">
                      +{project.tech_stack.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Status and Action Buttons */}
              <div className="flex items-center justify-between border-t border-muted/10 pt-4 mt-auto">
                <span className={`text-[9px] font-mono px-2.5 py-1 rounded-full uppercase tracking-wider font-bold ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenEdit(project)}
                    className="p-2 bg-bg text-text-muted hover:text-white rounded-lg border border-muted/10 hover:border-muted/30 transition-all"
                    title="Edit Record"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-2 bg-bg text-red-500/80 hover:text-red-400 rounded-lg border border-muted/10 hover:border-red-500/20 transition-all"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-accent/10 text-accent font-mono text-[10px] font-black rounded-lg border border-accent/20 hover:bg-accent hover:text-bg transition-all"
                  >
                    CONTROL <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern Creation / Modification Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f1424] border border-muted/20 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in scale-in duration-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-muted/10 flex items-center justify-between bg-[#13192c]">
              <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">
                {editingProject ? 'Modify Project Template' : 'Configure New Template'}
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
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Project Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none"
                    placeholder="Stripe Webhook Gateway"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Project Slug (URL Path)</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={e => handleInputChange('slug', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono text-xs"
                    placeholder="stripe-webhook-gateway"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Target Company</label>
                  <input
                    type="text"
                    value={formData.target_company}
                    onChange={e => handleInputChange('target_company', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none"
                    placeholder="Stripe Inc."
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Linked Episodes Series</label>
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
              </div>

              <div>
                <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Short Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none resize-none"
                  placeholder="A microservice framework demonstrating clean webhook processing with retry queues..."
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">GitHub Repository URL</label>
                  <input
                    type="url"
                    value={formData.github_repo_url}
                    onChange={e => handleInputChange('github_repo_url', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono text-xs"
                    placeholder="https://github.com/EmberPhantom/stripe-clone"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">GitHub Full Name (owner/repo)</label>
                  <input
                    type="text"
                    value={formData.github_repo_full_name}
                    onChange={e => handleInputChange('github_repo_full_name', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono text-xs"
                    placeholder="EmberPhantom/stripe-clone"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Production Live URL</label>
                  <input
                    type="url"
                    value={formData.live_url}
                    onChange={e => handleInputChange('live_url', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono text-xs"
                    placeholder="https://stripe-clone.pranaychandra.dev"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Template Development Status</label>
                  <select
                    value={formData.status}
                    onChange={e => handleInputChange('status', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none"
                  >
                    <option value="planned">Planned</option>
                    <option value="building">Building</option>
                    <option value="live">Live Showcase</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Tech Stack (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tech_stack}
                  onChange={e => handleInputChange('tech_stack', e.target.value)}
                  className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none"
                  placeholder="Next.js, TailwindCSS, Stripe API, Prisma, PostgreSQL"
                />
              </div>

              <div>
                <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Architecture Systems Design Notes (markdown)</label>
                <textarea
                  rows={4}
                  value={formData.architecture_notes}
                  onChange={e => handleInputChange('architecture_notes', e.target.value)}
                  className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono text-xs"
                  placeholder="# Architecture Diagram\nWebhooks land on `/api/webhooks` endpoint..."
                />
              </div>

              {/* RLS Visibility Check */}
              <div className="flex flex-col gap-3 p-4 bg-bg/50 rounded-xl border border-muted/10">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_public_buildable"
                    checked={formData.is_public_buildable}
                    onChange={e => handleInputChange('is_public_buildable', e.target.checked)}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <label htmlFor="is_public_buildable" className="cursor-pointer text-xs font-mono text-text-muted">
                    EXPOSE_LIVE_BUILD_LOGS_TO_PUBLIC_VIEWERS
                  </label>
                </div>
                
                <div className="flex items-center gap-3 border-t border-muted/5 pt-3">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={e => handleInputChange('is_featured', e.target.checked)}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <label htmlFor="is_featured" className="cursor-pointer text-xs font-mono text-text-muted">
                    FEATURE_AS_BEST_PROJECT_ON_HOMEPAGE
                  </label>
                </div>
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
                  {saving ? 'SAVING_CHANGES...' : editingProject ? 'APPLY_CHANGES' : 'CREATE_TEMPLATE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
