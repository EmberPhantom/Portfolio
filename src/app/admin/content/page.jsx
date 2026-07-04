'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Loader2, 
  ArrowRight,
  BookOpen,
  Youtube,
  User,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function ContentDashboard() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    raw_content: '',
    source_type: 'manual'
  });

  useEffect(() => {
    fetchSources();
  }, []);

  async function fetchSources() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/content/sources');
      if (!res.ok) throw new Error('Failed to retrieve content ingestion sources');
      const data = await res.json();
      setSources(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/content/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to ingest content source');
      }

      setIsModalOpen(false);
      fetchSources();
      
      // Auto redirect to queue with instructions
      alert('Content source ingested successfully! AI drafting has been queued in the background. Redirecting to review queue...');
      window.location.href = '/admin/content/queue';
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getSourceTypeIcon = (type) => {
    switch (type) {
      case 'blog':
        return <BookOpen className="w-4 h-4 text-blue-400" />;
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-500" />;
      default:
        return <User className="w-4 h-4 text-accent" />;
    }
  };

  if (loading && sources.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-text-muted">Syncing CMS vault...</span>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8 text-accent animate-pulse" />
            <h2 className="font-display text-4xl font-black text-text uppercase tracking-tighter">CMS Content Ledger</h2>
          </div>
          <p className="text-text-muted text-sm mt-2">Ingest long-form materials to trigger multi-platform social draft templates</p>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/admin/content/queue"
            className="flex items-center gap-2 px-5 py-3 bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-accent/15"
          >
            OPEN_REVIEW_QUEUE <ChevronRight className="w-4 h-4" />
          </Link>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-surface border border-muted/20 text-white font-black rounded-xl hover:border-accent/40 transition-all uppercase tracking-widest text-[10px]"
          >
            <Plus className="w-4 h-4 text-accent" /> INGEST_RAW_TEXT
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl mb-8 border border-red-500/20 font-mono text-sm">
          ERROR: {error}
        </div>
      )}

      {/* Grid List of Sources */}
      {sources.length === 0 ? (
        <div className="bg-surface border border-muted/10 rounded-[2rem] p-12 text-center text-text-muted">
          <Layers className="w-12 h-12 text-accent/30 mx-auto mb-4" />
          <p className="text-sm font-mono uppercase tracking-widest">No Ingestion Records Found.</p>
          <p className="text-xs text-text-muted/60 mt-1">Submit your first markdown blog post or transcript using the buttons above.</p>
        </div>
      ) : (
        <div className="bg-surface border border-muted/20 rounded-[2.5rem] p-8 shadow-xl">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] font-mono mb-6 px-2">
            Ingestion Sources Archive
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-muted/10 text-text-muted uppercase text-[9px] tracking-widest">
                  <th className="pb-3 font-black">Type</th>
                  <th className="pb-3 font-black">Title</th>
                  <th className="pb-3 font-black">Link Reference</th>
                  <th className="pb-3 font-black">Created At</th>
                  <th className="pb-3 font-black">Draft Status</th>
                  <th className="pb-3 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/10">
                {sources.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-4">
                      <span className="flex items-center gap-2">
                        {getSourceTypeIcon(s.source_type)}
                        <span className="text-[10px] text-text font-bold uppercase">{s.source_type}</span>
                      </span>
                    </td>
                    <td className="py-4 font-bold text-white max-w-[200px] truncate" title={s.title}>
                      {s.title}
                    </td>
                    <td className="py-4 text-text-muted">
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center gap-1">
                          Source URL <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        '--'
                      )}
                    </td>
                    <td className="py-4 text-text-muted">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                        s.status === 'processed'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        href="/admin/content/queue"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/15 text-accent font-bold rounded-lg border border-accent/20 hover:bg-accent hover:text-bg transition-all text-[10px]"
                      >
                        VIEW_DRAFTS <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Ingestion Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f1424] border border-muted/20 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in scale-in duration-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-muted/10 flex items-center justify-between bg-[#13192c]">
              <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" /> Manual Content Ingestion
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
              <div>
                <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Content Source Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-3 text-text focus:border-accent outline-none"
                  placeholder="Lessons from building in Deno Edge Contexts"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Reference URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={e => handleInputChange('url', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono text-xs"
                    placeholder="https://pranaychandra.dev/blog/deno-rebuild"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Source Type</label>
                  <select
                    value={formData.source_type}
                    onChange={e => handleInputChange('source_type', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none"
                  >
                    <option value="manual">Manual Document</option>
                    <option value="blog">Website Blog Post</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Raw Content Text (Markdown / Caption script)</label>
                <textarea
                  required
                  rows={8}
                  value={formData.raw_content}
                  onChange={e => handleInputChange('raw_content', e.target.value)}
                  className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-3 text-text focus:border-accent outline-none font-mono text-xs"
                  placeholder="Write or paste the full text of your blog post or caption transcript here. The AI will parse this to draft tailored platform posts..."
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
                  {saving ? 'INGESTING_RECORDS...' : 'COMMIT_INGESTION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
