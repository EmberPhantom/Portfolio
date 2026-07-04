'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Terminal, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronRight,
  Maximize2
} from 'lucide-react';

export default function BuildLogTail({ buildId, onClose }) {
  const [logs, setLogs] = useState([]);
  const [buildStatus, setBuildStatus] = useState('queued');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  // 1. Fetch initial logs & subscribe to real-time changes
  useEffect(() => {
    if (!buildId || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLogs([]);

    // Fetch parent build status first
    async function loadBuildInfo() {
      const { data } = await supabase
        .from('builds')
        .select('status')
        .eq('id', buildId)
        .single();
      if (data) {
        setBuildStatus(data.status);
      }
    }

    // Fetch existing logs
    async function loadExistingLogs() {
      const { data, error } = await supabase
        .from('build_logs')
        .select('*')
        .eq('build_id', buildId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setLogs(data);
      }
      setLoading(false);
    }

    loadBuildInfo();
    loadExistingLogs();

    // Subscribe to new logs
    const logChannel = supabase
      .channel(`build-logs-tail-${buildId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'build_logs',
          filter: `build_id=eq.${buildId}`
        },
        (payload) => {
          setLogs((prev) => {
            if (prev.some((log) => log.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      // Also listen to builds status update to know when compilation completes
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'builds',
          filter: `id=eq.${buildId}`
        },
        (payload) => {
          setBuildStatus(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(logChannel);
    };
  }, [buildId]);

  // 2. Autoscroll to bottom when logs arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Style status badge
  const getStatusBadge = () => {
    switch (buildStatus) {
      case 'success':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" /> BUILD_SUCCESS
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" /> BUILD_FAILED
          </span>
        );
      case 'running':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> COMPILING_RUN...
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
            BUILD_CANCELLED
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Loader2 className="w-3.5 h-3.5 animate-pulse" /> QUEUED_IN_LINE
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-[#0a0f1d] border border-muted/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in duration-300">
      {/* Top Bar Header */}
      <div className="bg-[#111827] border-b border-muted/10 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-accent" />
          <span className="font-mono text-xs font-bold text-text tracking-wide uppercase">
            EmberOS // Compiler Telemetry Console
          </span>
          <span className="text-[10px] text-text-muted font-mono hidden sm:inline">
            ID: {buildId.substring(0, 8)}...
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {getStatusBadge()}
          {onClose && (
            <button 
              onClick={onClose} 
              className="text-text-muted hover:text-white transition-colors"
              aria-label="Close terminal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="relative p-5 bg-[#030712] min-h-[350px] max-h-[500px] overflow-y-auto flex flex-col font-mono text-xs text-[#d1d5db]">
        {/* Scanlines Effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/[0.01] to-transparent bg-[size:100%_4px] opacity-30"></div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-text-muted">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Establishing streams...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex-1 py-16 text-center text-text-muted text-[10px] uppercase tracking-widest font-bold">
            No telemetry lines recorded yet. Awaiting build runner start...
          </div>
        ) : (
          <div className="space-y-1.5 z-10">
            {logs.map((log, index) => {
              // Color styles based on level
              let levelColor = 'text-gray-400';
              let messageColor = 'text-[#e5e7eb]';
              
              if (log.level === 'success') {
                levelColor = 'text-green-500 font-bold';
                messageColor = 'text-green-300 font-medium';
              } else if (log.level === 'warn') {
                levelColor = 'text-yellow-500 font-bold';
                messageColor = 'text-yellow-300';
              } else if (log.level === 'error') {
                levelColor = 'text-red-500 font-bold';
                messageColor = 'text-red-400 font-medium';
              } else if (log.level === 'info') {
                levelColor = 'text-accent/60';
                messageColor = 'text-[#d1d5db]';
              }

              const timeStr = log.created_at 
                ? new Date(log.created_at).toLocaleTimeString() 
                : '';

              return (
                <div key={log.id || index} className="flex items-start gap-3 hover:bg-white/[0.02] py-0.5 rounded px-1 transition-colors">
                  <span className="text-[10px] text-text-muted select-none w-14 shrink-0 font-light">
                    [{timeStr}]
                  </span>
                  <span className={`select-none shrink-0 uppercase text-[9px] w-12 font-black ${levelColor}`}>
                    {log.level || 'info'}
                  </span>
                  <span className="text-accent/40 select-none shrink-0 font-bold">
                    ::
                  </span>
                  <span className="text-[#a5b4fc] shrink-0 font-medium">
                    [{log.step_name}]
                  </span>
                  <span className={`break-all whitespace-pre-wrap flex-1 ${messageColor}`}>
                    {log.message}
                  </span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Streaming Blink Indicator */}
        {buildStatus === 'running' && !loading && (
          <div className="flex items-center gap-2 mt-4 text-[10px] text-accent/60 animate-pulse font-bold uppercase tracking-wider shrink-0 z-10 px-1">
            <ChevronRight className="w-3.5 h-3.5 text-accent animate-bounce" />
            <span>Listening for next runner telemetry output...</span>
            <span className="w-1.5 h-3.5 bg-accent ml-0.5 inline-block animate-ping"></span>
          </div>
        )}
      </div>
    </div>
  );
}
