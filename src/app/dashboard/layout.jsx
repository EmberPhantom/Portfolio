"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { LogOut, LayoutDashboard, FileText, Activity, FolderOpen, Settings } from "lucide-react";
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
      <div className="min-h-screen bg-forge-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-forge-muted border-t-orange-500 rounded-full animate-spin" />
          <span className="text-orange-500 font-mono text-sm tracking-widest uppercase">
            Initializing Core...
          </span>
        </div>
      </div>
    );
  }

  // On the login page, just render children without the sidebar layout
  if (pathname === "/dashboard/login") {
    return (
      <div className="min-h-screen bg-forge-black w-full relative">
        {children}
      </div>
    );
  }

  const navItems = [
    { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { label: "Articles (CMS)", path: "/dashboard/articles", icon: FileText },
    { label: "Categories", path: "/dashboard/categories", icon: FolderOpen },
    { label: "Analytics", path: "/dashboard/analytics", icon: Activity },
    { label: "Settings", path: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-forge-black text-white flex flex-col md:flex-row relative overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-forge-surface border-r border-forge-muted/20 flex flex-col shrink-0">
        <div className="p-6 border-b border-forge-muted/20">
          <Link
            href="/"
            className="text-orange-500 text-sm font-mono tracking-widest hover:text-orange-400 transition-colors"
          >
            ← Exit to App
          </Link>
          <h1 className="text-2xl font-bold font-display text-white mt-4">
            EmberOS Admin
          </h1>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.path}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-orange-500/10 text-orange-500"
                    : "hover:bg-forge-muted/20 text-gray-400 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-forge-muted/20">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 p-3 w-full rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
            aria-label="Sign Out"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 relative bg-forge-black">
        {!supabase && (
          <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/30 text-orange-500 rounded-xl text-sm flex items-start gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <p className="font-bold">Database Disconnected</p>
              <p className="text-orange-400/70">
                Add <code className="bg-black/30 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code className="bg-black/30 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
                <code className="bg-black/30 px-1 rounded">.env.local</code> to enable live data.
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
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
