'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { 
  ArrowLeft, 
  Github, 
  Globe, 
  Cpu, 
  Clock, 
  Activity, 
  Terminal, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronRight,
  ExternalLink,
  BookOpen,
  Youtube
} from 'lucide-react';
import Link from 'next/link';
import BuildLogTail from '../../../../components/dashboard/BuildLogTail';

export default function ProjectControlPanel({ params }) {
  const { id } = React.use(params);

  const [project, setProject] = useState(null);
  const [builds, setBuilds] = useState([]);
  const [activeBuildId, setActiveBuildId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadProject();
      loadBuildHistory();
      subscribeToBuildChanges();
    }
  }, [id]);

  async function loadProject() {
    try {
      const res = await fetch(`/api/projects?id=${id}`);
      if (!res.ok) throw new Error('Failed to retrieve project detail record');
      const data = await res.json();
      setProject(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadBuildHistory() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('builds')
        .select('*')
        .eq('project_id', id)
        .order('started_at', { ascending: false });

      if (!error && data) {
        setBuilds(data);
      }
    } catch (err) {
      console.error('Failed to load build history', err);
    }
  }

  function subscribeToBuildChanges() {
    if (!supabase) return;

    // Listen to inserts/updates in the builds table for this project
    const buildChannel = supabase
      .channel(`project-builds-history-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'builds',
          filter: `project_id=eq.${id}`
        },
        () => {
          // Reload history list when anything changes
          loadBuildHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(buildChannel);
    };
  }

  const handleTriggerBuild = async () => {
    if (!project || !project.github_repo_full_name) {
      alert('GitHub repository configuration missing. Configure repo name (owner/repo) before building.');
      return;
    }

    setDispatching(true);
    setError(null);

    try {
      const res = await fetch('/api/projects/build/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          github_repo_full_name: project.github_repo_full_name,
          workflow_file: 'build.yml'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch workflow run');
      }

      // Open terminal for the new build ID immediately
      if (data.build_id) {
        setActiveBuildId(data.build_id);
      }
      loadBuildHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setDispatching(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'running':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse';
      case 'cancelled':
        return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  const formatDuration = (start, end) => {
    if (!start) return '--';
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const diffMs = endTime - startTime;
    const diffSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-text-muted">Loading project telemetry...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-24">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">Project template not found</h3>
        <Link href="/admin/projects" className="text-accent text-sm mt-4 hover:underline inline-block font-mono">
          &lt;- BACK_TO_TEMPLATES
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 animate-in fade-in duration-500">
      {/* Back Button */}
      <Link
        href="/admin/projects"
        className="text-accent/50 text-xs font-mono tracking-widest hover:text-accent transition-all flex items-center gap-2 group mb-6"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> BACK_TO_TEMPLATES
      </Link>

      {/* Grid: Left - Project Details, Right - Console & Actions */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Specifications Sheet (1/3 width) */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-surface border border-muted/20 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
            <h2 className="font-display text-3xl font-black text-white uppercase tracking-tight mb-1">
              {project.name}
            </h2>
            <p className="text-text-muted text-xs font-mono mb-6 bg-bg/50 px-3 py-1.5 rounded-xl border border-muted/10 inline-block">
              {project.status.toUpperCase()}_MODE
            </p>

            <div className="space-y-4">
              <div>
                <span className="block text-[10px] text-text-muted uppercase tracking-widest font-black mb-1">Target Client</span>
                <span className="text-sm font-semibold text-white">{project.target_company || 'None / Personal'}</span>
              </div>

              {project.github_repo_url && (
                <div>
                  <span className="block text-[10px] text-text-muted uppercase tracking-widest font-black mb-1">Git Repository</span>
                  <a
                    href={project.github_repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-accent hover:underline font-mono break-all"
                  >
                    <Github className="w-3.5 h-3.5" /> {project.github_repo_full_name || 'Open Repo'} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {project.live_url && (
                <div>
                  <span className="block text-[10px] text-text-muted uppercase tracking-widest font-black mb-1">Showcase Live Link</span>
                  <a
                    href={project.live_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-accent hover:underline font-mono break-all"
                  >
                    <Globe className="w-3.5 h-3.5" /> {project.live_url} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div>
                <span className="block text-[10px] text-text-muted uppercase tracking-widest font-black mb-1">Series Link</span>
                <span className="text-xs text-text-muted font-mono flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-accent/60" /> {project.series?.title || 'Standalone System'}
                </span>
              </div>

              <div className="pt-4 border-t border-muted/10">
                <Link
                  href={`/admin/projects/${project.id}/episodes`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-bg hover:bg-white/5 border border-muted/20 text-accent font-black rounded-xl transition-all uppercase tracking-widest text-[10px]"
                >
                  <Youtube className="w-4 h-4" /> MANAGE_EPISODES
                </Link>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          {project.tech_stack && project.tech_stack.length > 0 && (
            <div className="bg-surface border border-muted/20 rounded-[2rem] p-6 shadow-xl">
              <span className="block text-[10px] text-text-muted uppercase tracking-widest font-black mb-3">Tech Infrastructure</span>
              <div className="flex flex-wrap gap-2">
                {project.tech_stack.map((tech, i) => (
                  <span
                    key={i}
                    className="text-xs font-mono px-3 py-1.5 rounded-xl bg-bg text-text border border-muted/10"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Controller & Log Panel (2/3 width) */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Action Trigger Card */}
          <div className="bg-surface border border-muted/20 rounded-[2rem] p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div>
              <h3 className="font-display text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Cpu className="w-5 h-5 text-accent" /> Execution Control Room
              </h3>
              <p className="text-text-muted text-xs mt-1">Dispatch verified builds and monitor runner compilation sequences</p>
            </div>

            <button
              onClick={handleTriggerBuild}
              disabled={dispatching || !project.github_repo_full_name}
              className="flex items-center gap-3 px-8 py-4 bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all disabled:opacity-50 uppercase tracking-widest text-xs shadow-lg shadow-accent/15 shrink-0"
            >
              {dispatching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> DISPATCHING...
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4" /> DISPATCH_BUILD_RUN
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl border border-red-500/20 font-mono text-sm">
              ERROR: {error}
            </div>
          )}

          {/* Active Log Terminal Screen */}
          {activeBuildId && (
            <div className="relative">
              <BuildLogTail 
                buildId={activeBuildId} 
                onClose={() => setActiveBuildId(null)} 
              />
            </div>
          )}

          {/* Historical Runs */}
          <div className="bg-surface border border-muted/20 rounded-[2rem] p-8 shadow-xl">
            <h3 className="font-display text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" /> Build Run Logs History
            </h3>

            {builds.length === 0 ? (
              <div className="text-center py-12 text-text-muted font-mono text-xs uppercase tracking-wider">
                No prior build executions logged for this project record.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-muted/10 text-text-muted uppercase text-[9px] tracking-widest">
                      <th className="pb-3 font-black">Run ID</th>
                      <th className="pb-3 font-black">Started At</th>
                      <th className="pb-3 font-black">Duration</th>
                      <th className="pb-3 font-black">Triggered By</th>
                      <th className="pb-3 font-black">Status</th>
                      <th className="pb-3 font-black text-right">Telemetry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/10">
                    {builds.map((b) => (
                      <tr key={b.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-4 font-bold text-white max-w-[80px] truncate" title={b.id}>
                          {b.id.substring(0, 8)}...
                        </td>
                        <td className="py-4 text-text-muted">
                          {b.started_at ? new Date(b.started_at).toLocaleString() : '--'}
                        </td>
                        <td className="py-4 text-text">
                          {formatDuration(b.started_at, b.finished_at)}
                        </td>
                        <td className="py-4 text-text-muted uppercase text-[10px]">
                          {b.triggered_by}
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusBadgeClass(b.status)}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => setActiveBuildId(b.id)}
                            className="inline-flex items-center gap-1 text-[10px] text-accent font-bold hover:underline"
                          >
                            TAIL_LOGS <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
