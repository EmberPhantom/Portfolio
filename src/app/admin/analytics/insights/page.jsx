'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Brain, 
  Loader2, 
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { marked } from 'marked';

export default function GrowthInsightsArchive() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [openInsightId, setOpenInsightId] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  async function fetchInsights() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics/insights');
      if (!res.ok) throw new Error('Failed to retrieve historical insights archive');
      const data = await res.json();
      
      // If returning a single object (latest) or array
      const insightsList = Array.isArray(data) ? data : (data ? [data] : []);
      
      // Fetch all insights from the database if api only returned the latest
      // The Next.js endpoint by default returns the latest single insights row.
      // Let's see: if we need to load all, we query supabase directly or via API.
      // Let's check how /api/analytics/insights is written. If it only returns one,
      // we can load more using standard supabase client if available.
      // Let's fetch all via api if we can or check the api route.
      setInsights(insightsList);
      if (insightsList.length > 0) {
        setOpenInsightId(insightsList[0].id);
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
      
      alert('AI Growth briefing compiled successfully!');
      fetchInsights();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const toggleOpen = (id) => {
    setOpenInsightId(openInsightId === id ? null : id);
  };

  if (loading && insights.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-text-muted">Opening insights archive...</span>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 animate-in fade-in duration-500">
      {/* Back Button */}
      <Link
        href="/admin/analytics"
        className="text-accent/50 text-xs font-mono tracking-widest hover:text-accent transition-all flex items-center gap-2 group mb-6"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> BACK_TO_TELEMETRY
      </Link>

      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center shadow-lg shadow-accent/5">
            <Brain className="w-7 h-7 text-accent animate-pulse" />
          </div>
          <div>
            <h2 className="font-display text-4xl font-black text-white uppercase tracking-tighter">AI Growth Briefings</h2>
            <p className="text-text-muted text-sm mt-1">Archive of weekly strategic recommendations and traffic analysis</p>
          </div>
        </div>

        <button
          onClick={handleGenerateInsights}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-3 bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all disabled:opacity-50 uppercase tracking-widest text-[10px] shadow-lg shadow-accent/15"
        >
          {generating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> COMPILING_NEW_BRIEFING...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" /> RECOMPILE_INSIGHTS
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl mb-8 border border-red-500/20 font-mono text-sm">
          ERROR: {error}
        </div>
      )}

      {insights.length === 0 ? (
        <div className="bg-surface border border-muted/10 rounded-[2rem] p-12 text-center text-text-muted">
          <FileText className="w-12 h-12 text-accent/30 mx-auto mb-4" />
          <p className="text-sm font-mono uppercase tracking-widest">No Growth Briefings recorded yet.</p>
          <p className="text-xs text-text-muted/60 mt-1">Click the button above to run your first weekly analysis.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {insights.map((insight) => {
            const isOpen = openInsightId === insight.id;
            return (
              <div 
                key={insight.id}
                className="bg-surface border border-muted/20 rounded-[2rem] overflow-hidden shadow-xl"
              >
                {/* Accordion Trigger Header */}
                <div 
                  onClick={() => toggleOpen(insight.id)}
                  className="px-8 py-6 flex items-center justify-between cursor-pointer hover:bg-white/[0.01] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-accent/80" />
                    <div>
                      <h3 className="font-display font-black text-lg text-white uppercase tracking-tight">
                        Week Starting: {insight.week_start}
                      </h3>
                      {insight.platforms_covered && insight.platforms_covered.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          {insight.platforms_covered.map((p, idx) => (
                            <span 
                              key={idx} 
                              className="text-[8px] font-mono font-bold uppercase tracking-wider bg-bg border border-muted/10 text-text-muted px-2 py-0.5 rounded"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
                </div>

                {/* Collapsible content */}
                {isOpen && (
                  <div className="px-8 pb-8 pt-2 border-t border-muted/10 bg-[#070b16]/30">
                    <div className="prose max-w-none text-text-muted prose-sm prose-invert prose-headings:font-display prose-headings:font-black prose-headings:uppercase prose-headings:text-white prose-a:text-accent font-body leading-relaxed">
                      <div dangerouslySetInnerHTML={{ __html: marked.parse(insight.summary_md) }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
