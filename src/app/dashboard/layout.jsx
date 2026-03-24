"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { LogOut, LayoutDashboard, FileText, Activity, FolderOpen, Settings, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If Supabase is not configured, allow mock UI access
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/dashboard/login");
      else setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) router.push("/dashboard/login");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    router.push("/dashboard/login");
  };

  if (loading) {
    return (
      <div className="h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-muted/20 border-t-accent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            </div>
          </div>
          <span className="text-accent font-mono text-xs tracking-[0.3em] uppercase">
            Initializing Core...
          </span>
        </div>
      </div>
    );
  }

  // On the login page, just render children without the sidebar layout
  if (pathname === "/dashboard/login") {
    return (
      <div className="h-screen bg-bg w-full relative overflow-hidden">
        {children}
      </div>
    );
  }

  const navItems = [
    { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { label: "Intelligence", path: "/dashboard/intelligence", icon: Brain },
    { label: "Articles (CMS)", path: "/dashboard/articles", icon: FileText },
    { label: "Categories", path: "/dashboard/categories", icon: FolderOpen },
    { label: "Analytics", path: "/dashboard/analytics", icon: Activity },
    { label: "Settings", path: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="h-screen bg-bg text-text flex flex-col md:flex-row relative overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-surface border-r border-muted/20 flex flex-col shrink-0">
        <div className="p-6 border-b border-muted/20">
          <Link
            href="/"
            className="text-accent text-xs font-mono tracking-widest hover:text-accent/80 transition-colors flex items-center gap-2"
          >
            ← EXIT TO APP
          </Link>
          <div className="mt-6 flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <rect x="10" y="6" width="5" height="28" rx="1" fill="currentColor" className="text-text"/>
              <path d="M22 10C27.5228 10 32 14.4772 32 20C32 25.5228 27.5228 30 22 30" stroke="currentColor" stroke-width="5" stroke-linecap="round" className="text-text"/>
              <circle cx="21" cy="20" r="3" fill="currentColor" className="text-accent"/>
            </svg>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold font-display text-text leading-tight group-hover:text-accent transition-colors">
                EmberOS<br/>Admin
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] font-mono text-text-muted/60 uppercase tracking-widest">AI_SYNCHRONIZED</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.path}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "hover:bg-muted/10 text-text-muted hover:text-text"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-accent" : "text-text-muted"}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-muted/20">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 p-3 w-full rounded-xl text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors"
            aria-label="Sign Out"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 relative bg-bg/50 scroll-smooth">
        {!supabase && (
          <div className="mb-8 p-4 bg-accent/10 border border-accent/30 text-accent rounded-xl text-sm flex items-start gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <p className="font-bold">Database Disconnected</p>
              <p className="text-accent/70">
                Add <code className="bg-bg/50 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code className="bg-bg/50 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
                <code className="bg-muted/10 px-1 rounded">.env.local</code> to enable live data.
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-6xl mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
