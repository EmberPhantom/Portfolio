"use client";

import { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { ArrowUpRight, Github, Twitter, Linkedin, Mail } from 'lucide-react';
import LiveStatus from '../components/ui/LiveStatus';
import Link from 'next/link';

// Using specific column and row spans for a masonry-like editorial bento
const initialWidgets = [
  { id: 'intro', span: 'col-span-1 md:col-span-2 row-span-2', content: IntroWidget },
  { id: 'stats', span: 'col-span-1 md:col-span-2 row-span-1', content: StatsWidget },
  { id: 'socials', span: 'col-span-1 row-span-1', content: SocialsWidget },
  { id: 'project', span: 'col-span-1 md:col-span-1 row-span-2', content: FeaturedProjectWidget },
];

export default function Home() {
  const [widgets, setWidgets] = useState(initialWidgets);

  return (
    <div className="p-6 md:p-12 lg:p-16 w-full max-w-[1400px] mx-auto flex flex-col justify-center relative min-h-[90vh]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mb-16 mt-12 md:mt-0 max-w-3xl"
      >
        <span className="text-orange-500 font-mono text-xs md:text-sm tracking-[0.2em] uppercase mb-4 block">
          Operating System __ v2.0
        </span>
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-black text-white mb-6 tracking-tighter leading-[0.9]">
          EmberOS<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">
            CONTROL.
          </span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl font-body leading-relaxed max-w-xl">
          An autonomous digital environment. Drag elements to configure your workspace.
        </p>
      </motion.div>

      <Reorder.Group 
        axis="y"
        values={widgets} 
        onReorder={setWidgets} 
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 auto-rows-[180px] md:auto-rows-[220px] gap-4 md:gap-6"
      >
        {widgets.map((widget) => (
          <Reorder.Item
            key={widget.id}
            value={widget}
            id={widget.id}
            className={`relative bg-forge-surface/30 backdrop-blur-2xl border border-white/[0.05] rounded-[2rem] overflow-hidden shadow-2xl hover:border-orange-500/30 transition-colors interactive flex flex-col ${widget.span}`}
            whileHover={{ scale: 0.98, transition: { duration: 0.4, ease: "easeOut" } }}
            whileDrag={{ scale: 1.05, zIndex: 50, cursor: 'grabbing', rotate: 1 }}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
          >
            {/* Subtle glow effect behind cards */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none z-0" />
            <div className="relative z-10 w-full h-full p-8 flex flex-col">
              <widget.content />
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}

// ==========================================
// WIDGET COMPONENTS (Redesigned for Premium)
// ==========================================

function IntroWidget() {
  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-orange-500/20">
          <span className="font-display font-black text-forge-black text-xl">PC</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 tracking-tight leading-none bg-clip-text">
          Pranay<br />Chandra
        </h2>
        <p className="text-gray-400 text-base md:text-lg font-body leading-relaxed max-w-sm">
          Full Stack Architect & UI Engineer building systems that scale from first principles.
        </p>
      </div>
      
      <div className="flex flex-wrap gap-4 mt-8">
        <Link href="/contact" className="px-8 py-4 bg-white text-forge-black font-bold rounded-full hover:bg-orange-500 hover:text-white transition-all transform hover:-translate-y-1 shadow-xl text-sm uppercase tracking-wider">
          Initiate Contact
        </Link>
        <Link href="/work" className="px-8 py-4 bg-transparent border border-white/10 text-white font-bold rounded-full hover:border-white transition-all transform hover:-translate-y-1 text-sm uppercase tracking-wider">
          View Projects
        </Link>
      </div>
    </div>
  );
}

function StatsWidget() {
  return (
    <div className="h-full flex flex-col justify-between group">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-mono text-gray-500 uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full border border-white/5">
          System Pulse
        </h3>
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse" />
      </div>
      
      <div className="flex-1 flex flex-col justify-center">
        <LiveStatus />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-1">Total Commits</p>
          <p className="text-2xl font-mono text-white tracking-tighter">1,432</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-1">Fuel Level</p>
          <p className="text-2xl font-mono text-white tracking-tighter">∞ Cups</p>
        </div>
      </div>
    </div>
  );
}

function SocialsWidget() {
  const socials = [
    { icon: Github, href: 'https://github.com/EmberPhantom', name: 'GitHub' },
    { icon: Linkedin, href: '#', name: 'LinkedIn' },
    { icon: Twitter, href: '#', name: 'Twitter' },
    { icon: Mail, href: 'mailto:pranaychandra751@gmail.com', name: 'Email' },
  ];

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-auto">Network</h3>
      <div className="grid grid-cols-2 gap-3 mt-6">
        {socials.map((s, i) => (
          <a key={i} href={s.href} target="_blank" rel="noreferrer" className="aspect-square bg-black/20 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-orange-500 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all group/social">
            <s.icon className="w-6 h-6 group-hover/social:-translate-y-1 transition-transform" strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-widest font-mono opacity-0 group-hover/social:opacity-100 transition-opacity absolute bottom-2">{s.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function FeaturedProjectWidget() {
  return (
    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center overflow-hidden group">
      {/* Dark overlay that fades strictly on hover */}
      <div className="absolute inset-0 bg-forge-black/80 backdrop-blur-md group-hover:bg-forge-black/40 group-hover:backdrop-blur-0 transition-all duration-700 z-0" />
      
      <div className="relative z-10 w-full h-full p-8 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <span className="px-3 py-1 bg-white/10 text-white text-xs font-bold tracking-widest uppercase rounded-full backdrop-blur-md border border-white/20">
            EmberOS
          </span>
          <Link href="/work/ember-os" className="w-12 h-12 bg-orange-500 text-forge-black rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-lg">
            <ArrowUpRight className="w-6 h-6" />
          </Link>
        </div>

        <div className="mt-auto transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <h3 className="text-4xl font-black text-white mb-3 font-display tracking-tight leading-none">
            Ember<br/>OS.
          </h3>
          <p className="text-gray-300 text-sm font-body mb-4 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
            Built from first principles. Shipped from conviction.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Django', 'Next.js', 'PostgreSQL'].map(tech => (
              <span key={tech} className="px-2.5 py-1 bg-black/50 border border-white/10 rounded-lg text-[10px] text-gray-300 font-mono tracking-widest uppercase backdrop-blur-md">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
