'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  FolderOpen,
  ArrowLeft,
  X,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

export default function CommunityActivityDashboard() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState({
    platform: 'reddit',
    activity_type: 'comment',
    url: '',
    notes: '',
    engagement_count: '0',
    logged_at: ''
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  async function fetchActivities() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/content/community');
      if (!res.ok) throw new Error('Failed to fetch activity logs');
      const data = await res.json();
      setActivities(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenCreate = () => {
    setEditingActivity(null);
    setFormData({
      platform: 'reddit',
      activity_type: 'comment',
      url: '',
      notes: '',
      engagement_count: '0',
      logged_at: new Date().toISOString().slice(0, 16)
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (act) => {
    setEditingActivity(act);
    setFormData({
      platform: act.platform || 'reddit',
      activity_type: act.activity_type || 'comment',
      url: act.url || '',
      notes: act.notes || '',
      engagement_count: act.engagement_count?.toString() || '0',
      logged_at: act.logged_at ? act.logged_at.substring(0, 16) : ''
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
      engagement_count: parseInt(formData.engagement_count, 10) || 0,
      logged_at: formData.logged_at ? new Date(formData.logged_at).toISOString() : new Date().toISOString()
    };

    try {
      let res;
      if (editingActivity) {
        res = await fetch('/api/content/community', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingActivity.id, ...payload })
        });
      } else {
        res = await fetch('/api/content/community', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to save activity log');
      }

      setIsModalOpen(false);
      fetchActivities();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this activity log?')) return;
    
    setError(null);
    try {
      const res = await fetch(`/api/content/community?id=${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to delete activity log');
      }
      fetchActivities();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-text-muted">Syncing community logs...</span>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 text-accent animate-pulse" />
            <h2 className="font-display text-4xl font-black text-text uppercase tracking-tighter">Community outreach</h2>
          </div>
          <p className="text-text-muted text-sm mt-2">Log Reddit replies, comments, and community discussions</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-3 bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-accent/15"
        >
          <Plus className="w-4 h-4" /> LOG_COMMUNITY_ENGAGEMENT
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl mb-8 border border-red-500/20 font-mono text-sm">
          ERROR: {error}
        </div>
      )}

      {activities.length === 0 ? (
        <div className="bg-surface border border-muted/10 rounded-[2rem] p-12 text-center text-text-muted">
          <FolderOpen className="w-12 h-12 text-accent/30 mx-auto mb-4" />
          <p className="text-sm font-mono uppercase tracking-widest">No activities logged yet.</p>
          <p className="text-xs text-text-muted/60 mt-1">Start tracking your audience interactions by clicking the button above.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-3xl border border-muted/20 overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-muted/10 text-text-muted uppercase text-[9px] tracking-widest">
                <th className="p-5 font-black">Date</th>
                <th className="p-5 font-black">Platform</th>
                <th className="p-5 font-black">Action</th>
                <th className="p-5 font-black">Engagement</th>
                <th className="p-5 font-black">Notes</th>
                <th className="p-5 font-black text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {activities.map((act) => (
                <tr key={act.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-5 text-text-muted">
                    {new Date(act.logged_at).toLocaleDateString()}
                  </td>
                  <td className="p-5 text-white uppercase font-bold text-[10px]">
                    {act.platform}
                  </td>
                  <td className="p-5">
                    <span className="bg-bg border border-muted/10 px-2.5 py-1 rounded-full uppercase text-[9px] font-bold text-accent">
                      {act.activity_type}
                    </span>
                  </td>
                  <td className="p-5 text-text font-bold">
                    {act.engagement_count || 0}
                  </td>
                  <td className="p-5 text-text-muted max-w-[200px] truncate" title={act.notes}>
                    {act.notes || '--'}
                  </td>
                  <td className="p-5">
                    <div className="flex justify-end items-center gap-3">
                      {act.url && (
                        <a
                          href={act.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-bg text-text-muted hover:text-white rounded-lg border border-muted/10 hover:border-muted/30 transition-all"
                          title="Visit Thread Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenEdit(act)}
                        className="p-2 bg-bg text-text-muted hover:text-white rounded-lg border border-muted/10 hover:border-muted/30 transition-all"
                        title="Edit Log"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(act.id)}
                        className="p-2 bg-bg text-red-500/80 hover:text-red-400 rounded-lg border border-muted/10 hover:border-red-500/20 transition-all"
                        title="Delete Log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Activity Log modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f1424] border border-muted/20 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in scale-in duration-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-muted/10 flex items-center justify-between bg-[#13192c]">
              <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">
                {editingActivity ? 'Modify Engagement Entry' : 'Log Community Engagement'}
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
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Platform</label>
                  <select
                    value={formData.platform}
                    onChange={e => handleInputChange('platform', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none"
                  >
                    <option value="reddit">Reddit</option>
                    <option value="threads">Threads</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Engagement Action</label>
                  <select
                    value={formData.activity_type}
                    onChange={e => handleInputChange('activity_type', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none"
                  >
                    <option value="comment">Comment / Thread Post</option>
                    <option value="post">Original Post Creation</option>
                    <option value="reply_to_others">Reply to Others' Posts</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Engagement Count</label>
                  <input
                    type="number"
                    value={formData.engagement_count}
                    onChange={e => handleInputChange('engagement_count', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Logged At</label>
                  <input
                    type="datetime-local"
                    value={formData.logged_at}
                    onChange={e => handleInputChange('logged_at', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono text-xs text-text-muted"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Thread / Post URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={e => handleInputChange('url', e.target.value)}
                  className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono text-xs"
                  placeholder="https://reddit.com/r/..."
                />
              </div>

              <div>
                <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> Notes / Thread Summary
                </label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono text-xs resize-none"
                  placeholder="Shared deep dive architecture to r/webdev, answered questions about Deno workers..."
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
                  {saving ? 'SAVING_CHANGES...' : editingActivity ? 'APPLY_CHANGES' : 'CREATE_LOG'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
