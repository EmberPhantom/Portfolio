'use client';

import { useState } from 'react';
import { 
  ChevronLeft, 
  Linkedin, 
  Save, 
  Loader2, 
  CheckCircle,
  Calendar,
  Users,
  Eye,
  Activity
} from 'lucide-react';
import Link from 'next/link';

export default function LinkedInManualEntry() {
  const [formData, setFormData] = useState({
    metric_date: new Date().toISOString().split('T')[0],
    followers: '',
    impressions: '',
    engagement_count: '',
    likes: '',
    comments: ''
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const payload = {
      platform: 'linkedin',
      metric_date: formData.metric_date,
      followers: formData.followers ? parseInt(formData.followers, 10) : null,
      impressions: formData.impressions ? parseInt(formData.impressions, 10) : null,
      engagement_count: formData.engagement_count ? parseInt(formData.engagement_count, 10) : null,
      extra: {
        likes: formData.likes ? parseInt(formData.likes, 10) : null,
        comments: formData.comments ? parseInt(formData.comments, 10) : null,
        manual_logged_at: new Date().toISOString()
      },
      source: 'manual'
    };

    try {
      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to submit metrics entry');
      }

      setSuccess(true);
      setFormData(prev => ({
        ...prev,
        // Keep date but reset numbers
        followers: '',
        impressions: '',
        engagement_count: '',
        likes: '',
        comments: ''
      }));

      setTimeout(() => setSuccess(false), 4000);

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Navigation */}
      <Link
        href="/admin/analytics"
        className="text-accent/50 text-xs font-mono tracking-widest hover:text-accent transition-all flex items-center gap-2 group mb-6"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> BACK_TO_TELEMETRY
      </Link>

      <div className="mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#0a66c2]/10 border border-[#0a66c2]/30 rounded-2xl flex items-center justify-center shadow-lg shadow-[#0a66c2]/5">
            <Linkedin className="w-7 h-7 text-[#0a66c2]" />
          </div>
          <div>
            <h2 className="font-display text-4xl font-black text-white uppercase tracking-tighter">LinkedIn Logging Ledger</h2>
            <p className="text-text-muted text-sm mt-1">Submit daily audience metrics to feed AI insight models</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl mb-8 border border-red-500/20 font-mono text-sm">
          ERROR: {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 text-green-400 p-4 rounded-2xl mb-8 border border-green-500/20 font-mono text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" /> LINKEDIN_METRICS_ENTRY_UPSERTED_SUCCESSFULLY
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-surface border border-muted/20 rounded-[2.5rem] p-8 shadow-xl space-y-6">
        
        {/* Date Field */}
        <div>
          <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-accent" /> Select Metric Log Date
          </label>
          <input
            type="date"
            required
            value={formData.metric_date}
            onChange={e => handleInputChange('metric_date', e.target.value)}
            className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-3 text-text text-sm focus:border-accent outline-none font-mono"
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {/* Followers */}
          <div>
            <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-accent" /> Followers
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.followers}
              onChange={e => handleInputChange('followers', e.target.value)}
              className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none text-sm font-mono"
              placeholder="1450"
            />
          </div>

          {/* Impressions */}
          <div>
            <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-accent" /> Impressions
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.impressions}
              onChange={e => handleInputChange('impressions', e.target.value)}
              className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none text-sm font-mono"
              placeholder="12050"
            />
          </div>

          {/* Engagements */}
          <div>
            <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-accent" /> Engagements
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.engagement_count}
              onChange={e => handleInputChange('engagement_count', e.target.value)}
              className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none text-sm font-mono"
              placeholder="480"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 border-t border-muted/10 pt-6">
          {/* Likes (extra) */}
          <div>
            <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Likes (Optional)</label>
            <input
              type="number"
              min="0"
              value={formData.likes}
              onChange={e => handleInputChange('likes', e.target.value)}
              className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none text-sm font-mono"
              placeholder="240"
            />
          </div>

          {/* Comments (extra) */}
          <div>
            <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Comments (Optional)</label>
            <input
              type="number"
              min="0"
              value={formData.comments}
              onChange={e => handleInputChange('comments', e.target.value)}
              className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none text-sm font-mono"
              placeholder="32"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-muted/10">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-3 px-8 py-4 bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all disabled:opacity-50 uppercase tracking-widest text-xs shadow-lg shadow-accent/15"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'RECORDING_ENTRY...' : 'COMMIT_METRICS_ENTRY'}
          </button>
        </div>

      </form>
    </div>
  );
}
