'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Play, 
  Loader2, 
  Calendar,
  Youtube,
  Clock,
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import Link from 'next/link';

export default function WatchEpisodesGrid() {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPublishedEpisodes();
  }, []);

  async function fetchPublishedEpisodes() {
    setLoading(true);
    setError(null);
    try {
      if (!supabase) {
        throw new Error('Supabase client not configured.');
      }

      // Fetch published episodes joined with their projects (public RLS select allows this)
      const { data, error: err } = await supabase
        .from('episodes')
        .select('*, project:project_id(id, name, slug, is_public_buildable)')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (err) throw err;
      setEpisodes(data || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const getYoutubeThumbnail = (url) => {
    if (!url) return null;
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      const videoId = (match && match[2].length === 11) ? match[2] : null;
      return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-text-muted">Aligning media array...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-text pt-28 pb-32 px-6 md:px-12 max-w-7xl mx-auto flex flex-col justify-start relative font-body">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/3 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Header */}
      <div className="mb-16">
        <div className="flex items-center gap-4">
          <Youtube className="w-10 h-10 text-accent animate-pulse" />
          <h1 className="font-display text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
            Watch it build
          </h1>
        </div>
        <p className="text-xl text-text-muted max-w-2xl mt-4 leading-relaxed font-body">
          Video logs of system architectures engineered from scratch. Watch, follow along, and trace execution pipelines live.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl mb-8 border border-red-500/20 font-mono text-sm">
          ERROR: {error}
        </div>
      )}

      {episodes.length === 0 ? (
        <div className="bg-surface/30 border border-muted/10 rounded-[2.5rem] p-12 text-center text-text-muted">
          <FolderOpen className="w-12 h-12 text-accent/30 mx-auto mb-4" />
          <p className="text-sm font-mono uppercase tracking-widest">No published build logs found.</p>
          <p className="text-xs text-text-muted/60 mt-1">Episodes are currently being compiled. Return shortly.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {episodes.map((ep) => {
            const thumbnail = getYoutubeThumbnail(ep.youtube_url);
            return (
              <div 
                key={ep.id}
                className="bg-surface/30 border border-muted/20 rounded-[2.5rem] overflow-hidden shadow-xl hover:border-accent/40 transition-all duration-300 flex flex-col group"
              >
                {/* Thumbnail card image */}
                {thumbnail ? (
                  <div className="w-full aspect-video overflow-hidden relative border-b border-muted/10 bg-black">
                    <img 
                      src={thumbnail} 
                      alt={ep.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                      <div className="w-12 h-12 bg-accent/95 hover:bg-accent rounded-full flex items-center justify-center text-bg shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-bg/50 border-b border-muted/10 flex items-center justify-center font-mono text-[9px] uppercase tracking-widest text-text-muted">
                    [No Video Asset Linked]
                  </div>
                )}

                {/* Details */}
                <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                  <div>
                    <span className="text-[10px] font-mono text-accent uppercase tracking-widest font-black flex items-center gap-1.5 mb-2">
                      <Clock className="w-3.5 h-3.5" /> EPISODE {ep.episode_number || '#'}
                    </span>
                    <h3 className="font-display font-black text-2xl text-white group-hover:text-accent transition-colors leading-tight uppercase tracking-tight">
                      {ep.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between border-t border-muted/5 pt-4 mt-auto">
                    <span className="flex items-center gap-1.5 text-xs text-text-muted font-mono">
                      <Calendar className="w-3.5 h-3.5" /> {ep.published_at ? new Date(ep.published_at).toLocaleDateString() : 'Draft'}
                    </span>

                    <Link 
                      href={`/watch/${ep.id}`}
                      className="inline-flex items-center gap-1.5 text-[10px] font-mono text-accent font-black uppercase hover:underline"
                    >
                      READ_EXCERPTS <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
