'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, 
  Moon, 
  X, 
  Github, 
  Linkedin, 
  Twitter, 
  Mail, 
  Download, 
  Calendar,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const roles = ["Full-Stack Developer", "AI Engineer", "Startup Founder"];
  
  return (
    <>
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 w-full h-14 bg-surface/30 backdrop-blur-xl border-b border-white/5 px-6 md:px-12 flex items-center justify-between z-50 select-none"
      >
        {/* Left Section: Premium Branding */}
        <Link href="/" className="flex items-center gap-3 group" aria-label="Pranay Chandra Home">
          <span className="font-display font-black text-sm tracking-widest text-text uppercase group-hover:text-accent transition-colors">
            PRANAY CHANDRA <span className="text-accent/50 group-hover:text-accent">/</span> BUILDER
          </span>
        </Link>

        {/* Right Section: Theme Toggle & Expandable Profile Image */}
        <div className="flex items-center gap-5">
          {/* Theme Button */}
          <button
            onClick={toggleTheme}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-text-muted hover:text-text border border-white/5 active:scale-95"
            title="Toggle Theme"
            aria-label="Toggle Theme"
          >
            {mounted && (
              theme === "dark" ? <Sun className="w-4 h-4 text-orange-400" /> : <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Profile Image Trigger */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="relative w-9 h-9 rounded-full border border-accent/30 overflow-hidden shadow-lg shadow-accent/5 hover:scale-105 active:scale-95 transition-all outline-none"
            aria-label="Open Profile Details"
          >
            <img
              src="/images/pranay-real.png"
              alt="Pranay Chandra"
              className="w-full h-full object-cover"
            />
            <span className="absolute inset-0 rounded-full border border-accent animate-pulse scale-105 opacity-20 pointer-events-none" />
          </button>
        </div>
      </motion.header>

      {/* Profile Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="relative w-full max-w-lg bg-surface/80 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Decorative Accent Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-text-muted hover:text-text border border-white/5 active:scale-95"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Profile Details Layout */}
              <div className="flex flex-col items-center text-center mt-4">
                {/* Photo Swap Showcase */}
                <div className="relative w-24 h-24 rounded-full border-2 border-accent/40 overflow-hidden group shadow-lg mb-4">
                  <img
                    src="/images/pranay-real.png"
                    alt="Pranay Chandra"
                    className="absolute inset-0 w-full h-full object-cover group-hover:opacity-0 transition-opacity duration-300"
                  />
                  <img
                    src="/images/pranay-avatar.png"
                    alt="Pranay Chandra Avatar"
                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-bg"
                  />
                </div>

                <h3 className="font-display font-black text-2xl tracking-tight text-text uppercase">
                  PRANAY CHANDRA
                </h3>

                {/* Animated Role Badges */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  {roles.map((role, idx) => (
                    <span 
                      key={idx} 
                      className="text-[9px] font-mono font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 px-2.5 py-0.5 rounded-full"
                    >
                      {role}
                    </span>
                  ))}
                </div>

                <p className="text-text-muted text-sm font-body mt-6 leading-relaxed max-w-sm">
                  Full-stack and AI engineer. Founded AnserTech, a production AI business-automation platform with a real-time voice AI pipeline running at sub-500ms latency.
                </p>
              </div>

              {/* Social Networks Linkages */}
              <div className="grid grid-cols-4 gap-3 mt-8">
                <a
                  href="https://github.com/EmberPhantom"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-white/5 hover:bg-accent/10 border border-white/5 hover:border-accent/30 rounded-2xl flex flex-col items-center gap-1.5 transition-all group"
                >
                  <Github className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
                  <span className="text-[8px] font-mono tracking-widest text-text-muted uppercase">GitHub</span>
                </a>
                <a
                  href="https://linkedin.com/in/pranay-chandra-wdp"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-white/5 hover:bg-accent/10 border border-white/5 hover:border-accent/30 rounded-2xl flex flex-col items-center gap-1.5 transition-all group"
                >
                  <Linkedin className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
                  <span className="text-[8px] font-mono tracking-widest text-text-muted uppercase">LinkedIn</span>
                </a>
                <a
                  href="https://x.com/_PranayChandra_"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-white/5 hover:bg-accent/10 border border-white/5 hover:border-accent/30 rounded-2xl flex flex-col items-center gap-1.5 transition-all group"
                >
                  <Twitter className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
                  <span className="text-[8px] font-mono tracking-widest text-text-muted uppercase">Twitter</span>
                </a>
                <a
                  href="mailto:pranaychandra751@gmail.com"
                  className="p-3 bg-white/5 hover:bg-accent/10 border border-white/5 hover:border-accent/30 rounded-2xl flex flex-col items-center gap-1.5 transition-all group"
                >
                  <Mail className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
                  <span className="text-[8px] font-mono tracking-widest text-text-muted uppercase">Mail</span>
                </a>
              </div>

              {/* Quick Call-to-Actions */}
              <div className="flex flex-col gap-2.5 mt-8">
                <a
                  href="https://calendly.com/pranaychandra/30min"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 bg-accent text-bg font-black rounded-xl hover:bg-accent/90 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-lg shadow-accent/10"
                >
                  <Calendar className="w-4 h-4" /> Book Calendly Session <ArrowRight className="w-3.5 h-3.5" />
                </a>

                <a
                  href="/Pranay_Chandra_Resume.pdf"
                  download
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-text font-black rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                >
                  <Download className="w-4 h-4 text-accent" /> Get My CV / Resume
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
