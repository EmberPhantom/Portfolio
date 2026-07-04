'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { 
  ArrowLeft, 
  Terminal, 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import BuildLogTail from '../../../../components/dashboard/BuildLogTail';

export default function PublicBuildLogsPage({ params }) {
  const { slug } = React.use(params);

  const [project, setProject] = useState(null);
  const [latestBuild, setLatestBuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (slug) {
      fetchProjectAndBuilds();
    }
  }, [slug]);

  async function fetchProjectAndBuilds() {
    setLoading(true);
    setError(null);
    try {
      if (!supabase) {
        throw new Error('Supabase client not configured.');
      }

      // 1. Fetch the project details (public read RLS allows this if status is live/building)
      const { data: projData, error: projErr } = await supabase
        .from('clone_projects')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (projErr) throw projErr;
      if (!projData) {
        throw new Error('Project repository record not found or private.');
      }

      if (!projData.is_public_buildable) {
        throw new Error('Public telemetry stream is not enabled for this project.');
      }

      setProject(projData);

      // 2. Fetch the latest build ID for this project
      const { data: buildData, error: buildErr } = await supabase
        .from('builds')
        .select('*')
        .eq('project_id', projData.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (buildErr) throw buildErr;
      setLatestBuild(buildData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-text-muted">Awaiting telemetry handshake...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-text pt-24 pb-32 px-6 md:px-12 max-w-5xl mx-auto flex flex-col justify-start relative">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/3 rounded-full blur-[120px] pointer-events-none" />

      {/* Back Button */}
      <Link
        href={`/work/${slug}`}
        className="text-text-muted hover:text-accent font-mono text-[10px] font-black uppercase tracking-wider mb-8 group w-fit z-10"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform inline mr-1" /> BACK_TO_SPECS
      </Link>

      {/* Header */}
      <div className="mb-10 z-10">
        <div className="flex items-center gap-4">
          <Terminal className="w-8 h-8 text-accent animate-pulse" />
          <div>
            <h2 className="font-display text-4xl font-black text-white uppercase tracking-tighter">
              {project?.name} // Compiler Logs
            </h2>
            <p className="text-text-muted text-sm mt-1">Live, streaming runner outputs straight from compiler runners</p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-500/10 text-red-500 p-6 border border-red-500/20 rounded-[2rem] font-mono text-xs uppercase tracking-wider z-10 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>telemetry_stream_failure: {error}</span>
        </div>
      ) : latestBuild ? (
        <div className="z-10 w-full">
          <BuildLogTail buildId={latestBuild.id} />
        </div>
      ) : (
        <div className="bg-surface border border-muted/10 rounded-[2rem] p-12 text-center text-text-muted font-mono text-xs uppercase tracking-widest z-10">
          No compile executions recorded yet for this project.
        </div>
      )}
    </div>
  );
}
