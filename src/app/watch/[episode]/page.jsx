'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  ArrowLeft, 
  Loader2, 
  Calendar,
  Terminal,
  AlertCircle,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { marked } from 'marked';

export default function EpisodePlayerPage({ params }) {
  const { episode: episodeId } = React.use(params);

  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (episodeId) {
      fetchEpisodeDetail();
    }
  }, [episodeId]);

  async function fetchEpisodeDetail() {
    setLoading(true);
    setError(null);
    try {
      if (!supabase) {
        throw new Error('Supabase client not configured.');
      }

      // Fetch specific episode details joined with project (public RLS allows this)
      const { data, error: err } = await supabase
        .from('episodes')
        .select('*, project:project_id(id, name, slug, is_public_buildable)')
        .eq('id', episodeId)
        .maybeSingle();

      if (err) throw err;
      if (!data) throw new Error('Episode not found or unpublished.');

      setEpisode(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      const videoId = (match && match[2].length === 11) ? match[2] : null;
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-text-muted">Awaiting media synchronization...</span>
      </div>
    );
  }

  const embedUrl = episode ? getYoutubeEmbedUrl(episode.youtube_url) : null;

  return (
    <div className="min-h-screen bg-[#050505] text-text pt-24 pb-32 px-6 md:px-12 max-w-5xl mx-auto flex flex-col justify-start relative font-body">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/3 rounded-full blur-[120px] pointer-events-none" />

      {/* Back Button */}
      <Link
        href="/watch"
        className="text-text-muted hover:text-accent font-mono text-[10px] font-black uppercase tracking-wider mb-8 group w-fit z-10"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform inline mr-1" /> BACK_TO_LIBRARY
      </Link>

      {error ? (
        <div className="bg-red-500/10 text-red-500 p-6 border border-red-500/20 rounded-[2rem] font-mono text-xs uppercase tracking-wider z-10 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>media_sync_failure: {error}</span>
        </div>
      ) : (
        <div className="space-y-8 z-10">
          {/* Header */}
          <div>
            <span className="text-[10px] font-mono text-accent uppercase tracking-widest font-black">
              Episode {episode.episode_number || '#'}
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tight mt-1 leading-none">
              {episode.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted mt-3 font-mono">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Published: {episode.published_at ? new Date(episode.published_at).toLocaleDateString() : 'Unpublished'}
              </span>
              {episode.project && (
                <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">
                  Project: {episode.project.name}
                </span>
              )}
            </div>
          </div>

          {/* YouTube IFrame Embed */}
          {embedUrl ? (
            <div className="w-full aspect-video rounded-[2.5rem] overflow-hidden border border-muted/20 shadow-2xl relative bg-black">
              <iframe
                src={embedUrl}
                title={episode.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          ) : (
            <div className="w-full aspect-video bg-bg/50 border border-muted/10 rounded-[2.5rem] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-text-muted">
              [YouTube stream linkage unavailable]
            </div>
          )}

          {/* Optional watch it build CTA logs linkage */}
          {episode.project?.is_public_buildable && (
            <div className="p-6 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/10 hover:border-purple-500/30 transition-all rounded-[2rem] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h4 className="font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" /> Watch this build logs
                </h4>
                <p className="text-text-muted text-xs mt-1">This episode features an active control plane. Trace real compiler logs streaming in realtime.</p>
              </div>
              <Link
                href={`/work/${episode.project.slug}/build-logs`}
                className="px-6 py-3 bg-purple-500/20 text-purple-300 font-mono text-[10px] font-black rounded-xl border border-purple-500/30 hover:bg-purple-500 hover:text-bg transition-all uppercase tracking-widest text-center shrink-0"
              >
                OPEN_TELEMETRY_CONSOLE
              </Link>
            </div>
          )}

          {/* Script Markdown Excerpt Section */}
          {episode.script_md ? (
            <div className="bg-surface/30 border border-muted/20 rounded-[2.5rem] p-8 space-y-6">
              <h3 className="font-display font-black text-xl text-white uppercase tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" /> Episode Log & Excerpts
              </h3>
              <div className="prose max-w-none text-text-muted prose-sm prose-invert prose-headings:font-display prose-headings:font-black prose-headings:uppercase prose-headings:text-white prose-a:text-accent font-body leading-relaxed border-t border-muted/10 pt-6">
                <div dangerouslySetInnerHTML={{ __html: marked.parse(episode.script_md) }} />
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-text-muted font-mono text-xs uppercase tracking-wider bg-bg/50 border border-muted/10 rounded-[2.5rem]">
              No written notes or script excerpts compiled for this episode yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
