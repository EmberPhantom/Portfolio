'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { 
  Settings, 
  Save, 
  Loader2, 
  CheckCircle, 
  ChevronLeft,
  Sliders,
  Globe,
  Share2,
  Cpu,
  Bookmark
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SiteSettings() {
  const [config, setConfig] = useState({
    'site.tagline': '',
    'site.owner_name': '',
    'social.github_url': '',
    'social.linkedin_url': '',
    'social.twitter_url': '',
    'social.email': '',
    'homepage.hero_subtitle': '',
    'featured_project_id': '',
    'ai.provider': 'gemini',
    'ai.api_key': ''
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        // Load all config rows
        const { data: configData } = await supabase
          .from('site_config')
          .select('key, value');
        
        if (configData) {
          const loadedConfig = { ...config };
          configData.forEach(row => {
            loadedConfig[row.key] = row.value || '';
          });
          setConfig(loadedConfig);
        }

        // Load projects for featured dropdown
        const { data: projectData } = await supabase
          .from('clone_projects')
          .select('id, name');
        setProjects(projectData || []);
      } catch (err) {
        setError("Failed to load settings data: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    if (!supabase) {
      setError("Supabase client is not available.");
      setSaving(false);
      return;
    }

    try {
      const updates = Object.entries(config).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
      }));

      const { error: saveError } = await supabase
        .from('site_config')
        .upsert(updates, { onConflict: 'key' });

      if (saveError) throw saveError;
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Failed to save configuration: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, val) => {
    setConfig(prev => ({ ...prev, [key]: val }));
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link
            href="/admin/settings"
            className="text-accent/50 text-xs font-mono tracking-widest hover:text-accent transition-all flex items-center gap-2 group mb-4"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> BACK_TO_SETTINGS
          </Link>
          <div className="flex items-center gap-4">
            <Sliders className="w-8 h-8 text-accent animate-pulse" />
            <h2 className="font-display text-4xl font-black text-text uppercase tracking-tighter">Site Control Configuration</h2>
          </div>
          <p className="text-text-muted text-sm mt-2">Manage dynamic portfolio content, socials, and secret credentials</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl mb-8 border border-red-500/20 font-mono text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 text-green-400 p-4 rounded-2xl mb-8 border border-green-500/20 font-mono text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" /> SITE_CONFIGURATION_UPDATED_SUCCESSFULLY
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Card: Core Settings */}
        <div className="bg-surface border border-muted/20 rounded-[2rem] p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-muted/10 pb-4 mb-6">
            <Globe className="w-5 h-5 text-accent" />
            <h3 className="font-display text-lg font-black text-white uppercase tracking-tight">Public Metadata</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Owner Name</label>
              <input
                type="text"
                required
                value={config['site.owner_name']}
                onChange={e => handleChange('site.owner_name', e.target.value)}
                className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent outline-none"
                placeholder="Pranay Chandra"
              />
            </div>
            <div>
              <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Hero Tagline</label>
              <input
                type="text"
                required
                value={config['site.tagline']}
                onChange={e => handleChange('site.tagline', e.target.value)}
                className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent outline-none"
                placeholder="Operating System __ v2.5"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Homepage Hero Subtitle / Intro</label>
            <textarea
              required
              rows={3}
              value={config['homepage.hero_subtitle']}
              onChange={e => handleChange('homepage.hero_subtitle', e.target.value)}
              className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent outline-none resize-none"
              placeholder="Full Stack Architect & UI Engineer building systems..."
            />
          </div>
        </div>

        {/* Card: Social Linkage */}
        <div className="bg-surface border border-muted/20 rounded-[2rem] p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-muted/10 pb-4 mb-6">
            <Share2 className="w-5 h-5 text-accent" />
            <h3 className="font-display text-lg font-black text-white uppercase tracking-tight">Socials & Identity Network</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">GitHub Profile URL</label>
              <input
                type="url"
                value={config['social.github_url']}
                onChange={e => handleChange('social.github_url', e.target.value)}
                className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent outline-none"
                placeholder="https://github.com/username"
              />
            </div>
            <div>
              <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">LinkedIn Profile URL</label>
              <input
                type="url"
                value={config['social.linkedin_url']}
                onChange={e => handleChange('social.linkedin_url', e.target.value)}
                className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent outline-none"
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div>
              <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">X/Twitter Profile URL</label>
              <input
                type="url"
                value={config['social.twitter_url']}
                onChange={e => handleChange('social.twitter_url', e.target.value)}
                className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent outline-none"
                placeholder="https://x.com/username"
              />
            </div>
            <div>
              <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Contact Email</label>
              <input
                type="email"
                value={config['social.email']}
                onChange={e => handleChange('social.email', e.target.value)}
                className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent outline-none"
                placeholder="email@example.com"
              />
            </div>
          </div>
        </div>

        {/* Card: Portfolio Wiring */}
        <div className="bg-surface border border-muted/20 rounded-[2rem] p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-muted/10 pb-4 mb-6">
            <Bookmark className="w-5 h-5 text-accent" />
            <h3 className="font-display text-lg font-black text-white uppercase tracking-tight">Showcase Curation</h3>
          </div>
          <div>
            <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Featured Project</label>
            <select
              value={config['featured_project_id']}
              onChange={e => handleChange('featured_project_id', e.target.value)}
              className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent outline-none"
            >
              <option value="">-- No project selected --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-text-muted/60 font-mono mt-2">Determines which database project is featured inside the homepage showcase card.</p>
          </div>
        </div>

        {/* Card: AI Configuration */}
        <div className="bg-surface border border-muted/20 rounded-[2rem] p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-muted/10 pb-4 mb-6">
            <Cpu className="w-5 h-5 text-accent" />
            <h3 className="font-display text-lg font-black text-white uppercase tracking-tight">AI Orchestration Engine</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">AI Provider Provider</label>
              <select
                value={config['ai.provider']}
                onChange={e => handleChange('ai.provider', e.target.value)}
                className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent outline-none"
              >
                <option value="gemini">Google Gemini</option>
                <option value="groq">GROQ API (Llama 3)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Provider API Key</label>
              <input
                type="password"
                value={config['ai.api_key']}
                onChange={e => handleChange('ai.api_key', e.target.value)}
                className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent outline-none font-mono"
                placeholder="••••••••••••••••••••••••••••••••"
              />
            </div>
          </div>
        </div>

        {/* Save Controls */}
        <div className="flex gap-4 items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-3 px-8 py-4 bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all disabled:opacity-50 uppercase tracking-widest text-xs shadow-lg shadow-accent/15"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'SAVING_CHANGES...' : 'SAVE_SITE_CONFIGURATION'}
          </button>
        </div>
      </form>
    </div>
  );
}
