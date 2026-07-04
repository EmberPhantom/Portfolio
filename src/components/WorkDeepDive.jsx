"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, GitFork, Eye, Globe, Github } from 'lucide-react';
// ==========================================
// DYNAMIC COMPONENT LIBRARY
// ==========================================

export function CinematicHero({ headline, subheadline, slug }) {
  return (
    <div className="min-h-[60vh] flex flex-col justify-center border-b border-forge-muted/20 pb-16">
     <motion.p 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="text-accent font-mono tracking-[0.2em] text-sm uppercase mb-4"
      >
        // ARCHITECTURE OVERVIEW: {slug}
      </motion.p>
      <motion.h1 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-text uppercase tracking-tighter leading-none mb-6"
      >
        {headline}
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="text-xl md:text-2xl text-text-muted font-body max-w-2xl leading-relaxed"
      >
        {subheadline}
      </motion.p>
    </div>
  );
}

export function MinimalHero({ headline, subheadline }) {
  return (
    <div className="py-24 border-b border-muted/20">
      <h1 className="text-4xl md:text-6xl font-display font-bold text-text mb-4 tracking-tight">{headline}</h1>
      <p className="text-lg text-text-muted max-w-xl">{subheadline}</p>
    </div>
  );
}

export function NarrativeBlock({ title, paragraphs }) {
  if (!paragraphs || paragraphs.length === 0) return null;
  return (
    <section className="py-24 grid grid-cols-1 md:grid-cols-12 gap-12">
      <div className="md:col-span-4 lg:col-span-3">
        <h2 className="text-2xl font-display font-bold text-text uppercase tracking-wider">{title}</h2>
        <div className="h-1 w-12 bg-accent mt-4" />
      </div>
      <div className="md:col-span-8 lg:col-span-7 space-y-6">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-text-muted text-lg md:text-xl font-body leading-relaxed">{p}</p>
        ))}
      </div>
    </section>
  );
}

export function ArchitectureGrid({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="py-24 border-t border-muted/20">
      <h2 className="text-sm font-mono text-text-muted uppercase tracking-widest mb-12 flex items-center gap-4">
        <span className="w-8 h-[1px] bg-muted/50" /> System Architecture
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {items.map((item, i) => (
           <div key={i} className="p-8 bg-surface/30 border border-muted/10 rounded-2xl hover:border-accent/30 transition-colors">
              <h3 className="text-xl font-display font-bold text-accent mb-3">{item.concept}</h3>
              <p className="text-text-muted leading-relaxed font-body">{item.description}</p>
           </div>
        ))}
      </div>
    </section>
  );
}

export function TechStackBar({ stack }) {
  if (!stack || stack.length === 0) return null;
  return (
    <section className="py-12 border-y border-muted/20 my-12 bg-bg/50 overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 md:gap-12 justify-center max-w-5xl mx-auto px-6">
          <span className="text-xs font-mono text-text-muted uppercase tracking-widest mr-8">STACK:</span>
          {stack.map(tech => (
             <span key={tech} className="text-lg md:text-xl font-bold font-display text-text/80 tracking-tight">{tech}</span>
          ))}
        </div>
    </section>
  );
}

export function ChallengeSolution({ items }) {
    if (!items || items.length === 0) return null;
    return (
      <section className="py-24 border-t border-muted/20">
        <h2 className="text-3xl font-display font-bold text-text tracking-tight mb-16 text-center">Engineering Deep Dive</h2>
        <div className="space-y-12 max-w-4xl mx-auto">
          {items.map((item, i) => (
             <div key={i} className="flex flex-col md:flex-row gap-6 md:gap-12 relative pl-8 md:pl-0 border-l border-muted/30 md:border-l-0">
                {/* Timeline dot mobile */}
                <div className="absolute left-[-5px] top-2 w-2.5 h-2.5 rounded-full bg-accent md:hidden" />
                <div className="md:w-1/2 md:text-right relative">
                   {/* Timeline dot desktop */}
                   <div className="hidden md:block absolute -right-[29px] md:-right-[29px] top-2 w-2.5 h-2.5 rounded-full bg-accent z-10 shadow-[0_0_10px_var(--accent)]" />
                   <h3 className="text-sm font-mono text-text-muted uppercase tracking-widest mb-2">Challenge</h3>
                   <p className="text-text font-body text-lg">{item.problem}</p>
                </div>
                {/* Vertical Divider Desktop */}
                <div className="hidden md:block w-px bg-muted/30 mx-4" />
                <div className="md:w-1/2">
                   <h3 className="text-sm font-mono text-accent/80 uppercase tracking-widest mb-2">Resolution</h3>
                   <p className="text-text-muted font-body text-lg">{item.solution}</p>
                </div>
             </div>
          ))}
        </div>
      </section>
    );
  }

export default function WorkDeepDive({ slug, projectInitialData, storyData }) {
  // Use the server-fetched repo metadata or fallback
  const project = projectInitialData || {
    title: slug.toUpperCase(),
    githubRepo: slug,
    stargazers_count: 0,
    forks_count: 0,
    watchers_count: 0
  };

  const story = storyData || {
     hero: { type: 'minimal', headline: project.title, subheadline: 'Evaluating project parameters...' }
  };

  return (
    <div className="pt-24 pb-32 px-6 md:px-12 max-w-7xl mx-auto min-h-screen w-full relative">
      <Link href="/work" className="inline-flex items-center gap-2 text-text-muted hover:text-accent transition-colors mb-12 group">
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-semibold uppercase tracking-wider text-sm">Back to Works</span>
      </Link>

      {/* DYNAMIC HERO LAYER */}
      {story.hero?.type === 'cinematic' ? (
        <CinematicHero headline={story.hero.headline} subheadline={story.hero.subheadline} slug={slug} />
      ) : (
        <MinimalHero headline={story.hero?.headline || project.title} subheadline={story.hero?.subheadline} />
      )}

      {/* GitHub Live Metrics */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-24 mt-12"
      >
        {project.stargazers_count > 0 && <MetricCard icon={Star} label="Stars" value={project.stargazers_count} />}
        {project.forks_count > 0 && <MetricCard icon={GitFork} label="Forks" value={project.forks_count} />}
        {project.watchers_count > 0 && <MetricCard icon={Eye} label="Watchers" value={project.watchers_count} />}
        
        {project.is_public_buildable && project.db_id && (
          <Link href={`/work/${slug}/build-logs`} className="flex flex-col p-6 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl hover:bg-purple-500 hover:text-bg transition-colors justify-center items-center group text-center select-none cursor-pointer">
            <Globe className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold uppercase tracking-wider text-xs">WATCH IT BUILD</span>
          </Link>
        )}

        <a href={project.github_repo_url || project.html_url || `https://github.com/EmberPhantom/${project.githubRepo || slug}`} target="_blank" rel="noreferrer" className="flex flex-col p-6 bg-accent text-bg rounded-2xl hover:bg-accent-hover transition-colors justify-center items-center group text-center">
          <Github className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-bold uppercase tracking-wider text-sm">View Source</span>
        </a>
      </motion.div>

      {/* DYNAMIC CONTENT LAYERS */}
      <NarrativeBlock title={story.story?.title} paragraphs={story.story?.paragraphs} />
      
      <TechStackBar stack={story.techStack} />

      <ArchitectureGrid items={story.architecture} />

      <ChallengeSolution items={story.challenges} />

    </div>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col p-6 bg-surface/50 border border-muted/20 rounded-2xl w-full">
      <Icon className="w-6 h-6 text-accent mb-4" />
      <span className="text-text-muted text-sm uppercase tracking-wider mb-1">{label}</span>
      <span className="text-3xl font-mono text-text">{value}</span>
    </div>
  );
}
