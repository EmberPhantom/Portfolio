"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { LogOut, LayoutDashboard, FileText, Activity, FolderOpen, Settings, Brain, FolderGit2, RefreshCw, Send, Calendar, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!session && pathname !== "/admin/login") router.push("/admin/login");
        else setSession(session);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Auth session retrieval error:", err.message);
        if (pathname !== "/admin/login") router.push("/admin/login");
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session && pathname !== "/admin/login") router.push("/admin/login");
    });

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
             <div className="w-24 h-24 border-t-2 border-r-2 border-accent rounded-full animate-spin shadow-[0_0_30px_rgba(249,115,22,0.4)]" />
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-b-2 border-l-2 border-accent/30 rounded-full animate-spin-reverse" />
             </div>
          </div>
          <span className="text-accent font-mono text-[10px] tracking-[0.5em] uppercase animate-pulse">
            EmberOS_INIT_SEQUENCE
          </span>
        </div>
      </div>
    );
  }

  if (pathname === "/admin/login") return <div className="h-screen bg-[#050505]">{children}</div>;

  const navItems = [
    { label: "Overview", path: "/admin", icon: LayoutDashboard },
    { label: "Intelligence", path: "/admin/intelligence", icon: Brain },
    { label: "CMS / Articles", path: "/admin/articles", icon: FileText },
    { label: "Categories", path: "/admin/categories", icon: FolderOpen },
    { label: "Projects", path: "/admin/projects", icon: FolderGit2 },
    { label: "Content Ingest", path: "/admin/content", icon: RefreshCw },
    { label: "Review Queue", path: "/admin/content/queue", icon: Send },
    { label: "Outreach Logs", path: "/admin/content/community", icon: Users },
    { label: "Release Calendar", path: "/admin/calendar", icon: Calendar },
    { label: "Telemetry", path: "/admin/analytics", icon: Activity },
    { label: "System", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="h-screen bg-[#050505] text-text flex flex-col md:flex-row relative overflow-hidden font-body">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[150px] -mr-96 -mt-96 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/3 rounded-full blur-[120px] -ml-48 -mb-48 pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-surface/40 backdrop-blur-3xl border-r border-white/5 flex flex-col shrink-0 z-20">
        <div className="p-8 border-b border-white/5">
          <Link
            href="/"
            className="text-accent/50 text-[10px] font-mono tracking-[0.3em] hover:text-accent transition-all flex items-center gap-2 group mb-10"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> TERMINATE_ADMIN_PANEL
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center shadow-lg shadow-accent/5">
               <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="8" y="2" width="6" height="36" rx="1.5" fill="currentColor" className="text-white"/>
                  <path d="M22 6C30.2843 6 37 12.7157 37 21C37 29.2843 30.2843 36 22 36" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="text-white"/>
                  <circle cx="21" cy="21" r="4" fill="currentColor" className="text-accent animate-pulse"/>
               </svg>
            </div>
            <div>
              <h1 className="text-lg font-display font-black text-white leading-none tracking-tight">EmberOS</h1>
              <span className="text-[10px] text-text-muted/60 uppercase tracking-[0.2em] font-mono">Control_Center v2.5</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.path}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 relative group ${
                  isActive
                    ? "bg-accent/10 text-accent border border-accent/20 translate-x-1 shadow-2xl shadow-accent/5"
                    : "hover:bg-white/5 text-text-muted hover:text-text"
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 w-1 h-6 bg-accent rounded-full -ml-3"
                  />
                )}
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "text-accent" : "text-text-muted"}`} />
                <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <button
            onClick={async () => {
              document.cookie = "emberos_offline_bypass=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
              if (supabase) {
                try {
                  await supabase.auth.signOut();
                } catch (err) {
                  // Ignore
                }
              }
              router.push("/admin/login");
            }}
            className="flex items-center gap-4 p-4 w-full rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Kill_Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-transparent scroll-smooth custom-scrollbar">
        <div className="max-w-7xl mx-auto p-8 md:p-16 min-h-screen">
          {!supabase && (
            <div className="mb-12 p-6 bg-orange-500/5 border border-orange-500/20 rounded-[2rem] flex items-center justify-between backdrop-blur-xl">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center animate-pulse">
                  <Activity className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-orange-500 uppercase tracking-widest mb-1">Local Development Mode</p>
                  <p className="text-xs text-orange-500/60 font-mono tracking-tight">SIMULATING_INTELLIGENCE: Subsystem Active</p>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
