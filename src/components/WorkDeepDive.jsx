"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, GitFork, Eye, Globe, Github } from 'lucide-react';
import { CinematicHero, MinimalHero, NarrativeBlock, ArchitectureGrid, TechStackBar, ChallengeSolution } from './dynamic/DynamicUIBlocks';

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
    <div className="pt-24 pb-32 px-6 md:px-12 max-w-7xl mx-auto min-h-screen w-full">
      <Link href="/work" className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-500 transition-colors mb-12 group">
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
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24 mt-12"
      >
        <MetricCard icon={Star} label="Stars" value={project.stargazers_count || 0} />
        <MetricCard icon={GitFork} label="Forks" value={project.forks_count || 0} />
        <MetricCard icon={Eye} label="Watchers" value={project.watchers_count || 0} />
        <a href={project.html_url || `https://github.com/EmberPhantom/${project.githubRepo || slug}`} target="_blank" rel="noreferrer" className="flex flex-col p-6 bg-orange-500 text-forge-black rounded-2xl hover:bg-orange-400 transition-colors justify-center items-center group">
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
    <div className="flex flex-col p-6 bg-forge-surface/50 border border-forge-muted/20 rounded-2xl w-full">
      <Icon className="w-6 h-6 text-orange-500 mb-4" />
      <span className="text-gray-400 text-sm uppercase tracking-wider mb-1">{label}</span>
      <span className="text-3xl font-mono text-white">{value}</span>
    </div>
  );
}
