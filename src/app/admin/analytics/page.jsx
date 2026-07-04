'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Activity, 
  Youtube, 
  Github, 
  Twitter, 
  Linkedin, 
  Brain, 
  Loader2, 
  ArrowRight,
  TrendingUp,
  FileText,
  Calendar,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { marked } from 'marked';

// Lightweight, responsive SVG Sparkline Component
function Sparkline({ data, color = '#f97316' }) {
  if (!data || data.length < 2) return null;
  const width = 120;
  const height = 40;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    // Invert Y axis for screen coordinates
    const y = height - 4 - ((val - min) / range) * (height - 8);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* Area under the line */}
      <path
        d={`${pathD} L ${width},${height} L 0,${height} Z`}
        fill={`url(#grad-${color.replace('#', '')})`}
        stroke="none"
      />
      {/* Sparkline Stroke */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
      />
      {/* Pulse End Circle */}
      <circle
        cx={width}
        cy={height - 4 - ((data[data.length - 1] - min) / range) * (height - 8)}
        r="3"
        fill={color}
        className="animate-ping"
      />
    </svg>
  );
}

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch metrics from the API route (gets past 30 days)
      const metricsRes = await fetch('/api/analytics?days=30');
      if (!metricsRes.ok) throw new Error('Failed to retrieve social metrics history');
      const metricsData = await metricsRes.json();
      setMetrics(metricsData || []);

      // 2. Fetch AI growth insights
      const insightsRes = await fetch('/api/analytics/insights');
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setInsights(insightsData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleGenerateInsights = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics/insights', {
        method: 'POST'
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to request insights compilation');
      }
      
      // Reload insights
      const insightsRes = await fetch('/api/analytics/insights');
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setInsights(insightsData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Compile metrics calculations
  const getLatestStats = (platform) => {
    const platformData = metrics.filter(m => m.platform === platform);
    if (platformData.length === 0) return { followers: 0, views: 0, trend: [] };
    
    const latest = platformData[platformData.length - 1];
    const trend = platformData.map(m => m.followers || 0);

    return {
      followers: latest.followers || 0,
      views: latest.views || 0,
      impressions: latest.impressions || 0,
      trend
    };
  };

  const ytStats = getLatestStats('youtube');
  const ghStats = getLatestStats('github');
  const twStats = getLatestStats('twitter');
  const liStats = getLatestStats('linkedin');

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-text-muted">Syncing metrics engine...</span>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <Activity className="w-8 h-8 text-accent animate-pulse" />
            <h2 className="font-display text-4xl font-black text-text uppercase tracking-tighter">Growth Telemetry</h2>
          </div>
          <p className="text-text-muted text-sm mt-2">Track cross-platform audience growth vectors and audience stats</p>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/admin/analytics/linkedin"
            className="flex items-center gap-2 px-5 py-3 bg-[#0a66c2]/10 hover:bg-[#0a66c2]/20 border border-[#0a66c2]/30 text-[#0a66c2] font-black rounded-xl transition-all uppercase tracking-widest text-[10px]"
          >
            <Linkedin className="w-4 h-4" /> LOG_LINKEDIN_METRICS
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl mb-8 border border-red-500/20 font-mono text-sm">
          ERROR: {error}
        </div>
      )}

      {/* Grid: 4 Core Platform Widgets */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* YouTube */}
        <div className="bg-surface border border-muted/20 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between hover:border-red-500/30 transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
                <Youtube className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-text-muted uppercase">YOUTUBE</span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-text-muted uppercase tracking-widest font-black">Subscribers</span>
              <span className="font-display text-3xl font-black text-white">
                {ytStats.followers.toLocaleString()}
              </span>
            </div>
            <div className="space-y-1 mt-3">
              <span className="block text-[10px] text-text-muted uppercase tracking-widest font-black">Channel Views</span>
              <span className="font-mono text-xs text-text-muted font-bold">
                {ytStats.views.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-6 border-t border-muted/10 pt-4">
            <div className="mb-2">
              <Sparkline data={ytStats.trend} color="#ef4444" />
            </div>
            <Link
              href="/admin/analytics/youtube"
              className="flex items-center gap-1.5 text-[9px] font-mono text-accent uppercase font-bold hover:underline"
            >
              ANALYZE_SERIES <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* GitHub */}
        <div className="bg-surface border border-muted/20 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between hover:border-white/20 transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-white/10 text-white rounded-xl border border-white/20">
                <Github className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-text-muted uppercase">GITHUB</span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-text-muted uppercase tracking-widest font-black">Followers</span>
              <span className="font-display text-3xl font-black text-white">
                {ghStats.followers.toLocaleString()}
              </span>
            </div>
            <div className="space-y-1 mt-3">
              <span className="block text-[10px] text-text-muted uppercase tracking-widest font-black">Total Stars</span>
              <span className="font-mono text-xs text-text-muted font-bold">
                {ghStats.views.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-6 border-t border-muted/10 pt-4">
            <div className="mb-2">
              <Sparkline data={ghStats.trend} color="#f8fafc" />
            </div>
            <Link
              href="/admin/analytics/github"
              className="flex items-center gap-1.5 text-[9px] font-mono text-accent uppercase font-bold hover:underline"
            >
              ANALYZE_REPOS <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* X/Twitter */}
        <div className="bg-surface border border-muted/20 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between hover:border-sky-400/30 transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-sky-400/10 text-sky-400 rounded-xl border border-sky-400/20">
                <Twitter className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-text-muted uppercase">X / TWITTER</span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-text-muted uppercase tracking-widest font-black">Followers</span>
              <span className="font-display text-3xl font-black text-white">
                {twStats.followers.toLocaleString()}
              </span>
            </div>
            <div className="space-y-1 mt-3">
              <span className="block text-[10px] text-text-muted uppercase tracking-widest font-black">Impressions</span>
              <span className="font-mono text-xs text-text-muted font-bold">
                {twStats.views.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-6 border-t border-muted/10 pt-4">
            <div className="mb-2">
              <Sparkline data={twStats.trend} color="#38bdf8" />
            </div>
            <Link
              href="/admin/analytics/twitter"
              className="flex items-center gap-1.5 text-[9px] font-mono text-accent uppercase font-bold hover:underline"
            >
              ANALYZE_TWEETS <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* LinkedIn */}
        <div className="bg-surface border border-muted/20 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between hover:border-[#0a66c2]/30 transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-[#0a66c2]/10 text-[#0a66c2] rounded-xl border border-[#0a66c2]/20">
                <Linkedin className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-text-muted uppercase">LINKEDIN</span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-text-muted uppercase tracking-widest font-black">Followers</span>
              <span className="font-display text-3xl font-black text-white">
                {liStats.followers.toLocaleString()}
              </span>
            </div>
            <div className="space-y-1 mt-3">
              <span className="block text-[10px] text-text-muted uppercase tracking-widest font-black">Impressions</span>
              <span className="font-mono text-xs text-text-muted font-bold">
                {liStats.impressions.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-6 border-t border-muted/10 pt-4">
            <div className="mb-2">
              <Sparkline data={liStats.trend} color="#0a66c2" />
            </div>
            <Link
              href="/admin/analytics/linkedin"
              className="flex items-center gap-1.5 text-[9px] font-mono text-accent uppercase font-bold hover:underline"
            >
              ANALYZE_PROFILE <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* AI Growth Insights Section */}
      <div className="bg-surface border border-muted/20 rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-muted/10 pb-6 mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-accent animate-pulse" />
            <div>
              <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">AI Growth Briefing</h3>
              {insights?.week_start && (
                <p className="text-[10px] text-text-muted font-mono uppercase mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Start Date: {insights.week_start}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/analytics/insights"
              className="flex items-center gap-2 px-5 py-3 bg-surface hover:bg-white/5 border border-muted/20 text-text-muted hover:text-white font-black rounded-xl transition-all uppercase tracking-widest text-[10px]"
            >
              VIEW_INSIGHTS_ARCHIVE
            </Link>
            <button
              onClick={handleGenerateInsights}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-3 bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all disabled:opacity-50 uppercase tracking-widest text-[10px] shadow-lg shadow-accent/15"
            >
              {generating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> ANALYZING_METRICS...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> RECOMPILE_INSIGHTS
                </>
              )}
            </button>
          </div>
        </div>

        {generating ? (
          <div className="h-48 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted font-black animate-pulse">AI is compiling trailing performance patterns...</span>
          </div>
        ) : insights ? (
          <div className="prose max-w-none text-text-muted prose-sm prose-invert prose-headings:font-display prose-headings:font-black prose-headings:uppercase prose-headings:text-white prose-a:text-accent font-body leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: marked.parse(insights.summary_md) }} />
          </div>
        ) : (
          <div className="text-center py-12 text-text-muted font-mono text-xs uppercase tracking-wider">
            No AI insights compiled yet. Click the button above to generate.
          </div>
        )}
      </div>
    </div>
  );
}
