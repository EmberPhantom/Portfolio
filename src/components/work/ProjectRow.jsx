'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Github, Code2, AlertTriangle, Lightbulb, Compass, Award } from 'lucide-react';

const PROJECT_STORIES = {
  'contexia': {
    fullName: 'Contexia AI',
    problem: 'Content production pipelines are highly fragmented, requiring manual drafting and repurposing for multi-platform campaigns.',
    whyBuilt: 'Built to orchestrate an automated content engine that digests PDFs, URLs, and audio inputs and generates newsletters, YouTube scripts, and LinkedIn posts.',
    architecture: 'Next.js Frontend ➔ Django REST API Gateway ➔ Supabase DB + pgvector vector similarity checks.',
    features: [
      'Bidirectional document ingestion & processing',
      'RAG pipeline on Supabase utilizing pgvector search',
      'Async multi-agent generation scheduler'
    ],
    outcome: 'Eliminated manual copy rewrites and cut content turnaround speed by 50%.'
  },
  'archonix': {
    fullName: 'Archonix',
    problem: 'Converting raw language specifications into fully compiled codebases remains challenging and prone to structure errors.',
    whyBuilt: 'Created to prototype an autonomous compiler engine that tests and deploys code modules sequentially based on prompts.',
    architecture: 'Next.js Dashboard ➔ Django Channels ➔ WebSockets Stream ➔ Celery Task Queue ➔ Redis Cache.',
    features: [
      'Multi-model prompt parser and code generator',
      'Django Channels for real-time compilation log logs',
      'Background tests automation using Pytest'
    ],
    outcome: 'Successfully creates functional web modules with test suites in under 60 seconds.'
  },
  'guidey': {
    fullName: 'Guidey AI Mobile',
    problem: 'Self-learners get lost in generic video playlists and lack personalized feedback or adaptive progress curves.',
    whyBuilt: 'Engineered a serverless mobile assistant to synthesize curated lessons and adaptive quizzes.',
    architecture: 'React Native Expo ➔ Cloudflare Workers Edge API (Hono.js) ➔ Cloudflare D1 + Vectorize DB.',
    features: [
      'Topic tracking utilizing Cloudflare Vectorize embeddings',
      'Serverless micro-services running Hono.js routing',
      'Dynamic quiz generation via GROQ and NVIDIA NIM'
    ],
    outcome: 'Enables highly responsive, custom-tailored learning sequences with no servers to maintain.'
  },
  'ansertech': {
    fullName: 'AnserTech Voice AI Core',
    problem: 'Business voice bots suffer from excessive audio delay (1.5s+), breaking conversation natural flow.',
    whyBuilt: 'Founded to deliver a bidirectional real-time audio pipeline running at sub-500ms response speeds.',
    architecture: 'Next.js Management Dashboard ➔ Django REST Analytics ➔ FastAPI audio engine ➔ WebSockets.',
    features: [
      'Custom ulaw-to-PCM bidirectional audio processing',
      'Concurrent session router supporting 100 calls in parallel',
      'HMAC webhook protection & credits usage limiter'
    ],
    outcome: 'Production ready system currently onboarding its first B2B enterprise clients.'
  }
};

function getPlaceholderImage(name) {
  const normalized = name.toLowerCase();
  if (normalized.includes('contexia')) return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop';
  if (normalized.includes('portfolio') || normalized.includes('emberos')) return 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1200&auto=format&fit=crop';
  if (normalized.includes('archonix')) return 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=1200&auto=format&fit=crop';
  if (normalized.includes('guidey')) return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop';
  return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop';
}

export default function ProjectRow({ repo, index }) {
  const normalizedName = repo.name.toLowerCase().replace(/-ai/g, '').replace(/_core/g, '');
  const [aiImage, setAiImage] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Split camelCase and hyphenated names cleanly to prevent visual overflows
  const defaultFullName = repo.name
    .replace(/([A-Z])/g, ' $1')
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .trim();

  const story = PROJECT_STORIES[normalizedName] || {
    fullName: defaultFullName,
    problem: 'System architecture and engineering challenges require modern structural controls.',
    whyBuilt: 'Built to streamline operations and ensure high-throughput execution.',
    architecture: repo.language ? `Built using ${repo.language} and standard core modules.` : 'Custom software deployment.',
    features: ['Real-time status tracking', 'API connectivity support'],
    outcome: 'Operational production utility.'
  };

  useEffect(() => {
    setIsAiLoading(true);
    fetch(`/api/projects/image?name=${encodeURIComponent(repo.name)}&desc=${encodeURIComponent(repo.description || '')}`)
      .then(res => res.json())
      .then(data => {
        if (data.imageUrl) setAiImage(data.imageUrl);
      })
      .catch(() => {})
      .finally(() => setIsAiLoading(false));
  }, [repo.name, repo.description]);

  const imageUrl = aiImage || getPlaceholderImage(repo.name);
  const formattedDate = new Date(repo.updated_at).getFullYear();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-8 py-8 border-b border-white/5 last:border-0 relative"
    >
      {/* Primary Info Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Photo cover with hover interactive scale */}
        <div className="lg:col-span-5 h-[280px] md:h-[380px] overflow-hidden rounded-[2rem] relative bg-surface border border-white/5 group shadow-xl">
          <a href={repo.html_url} target="_blank" rel="noreferrer" className="absolute inset-0 z-20" />
          <motion.div 
            whileHover={{ scale: 1.03 }} 
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full relative"
          >
            {isAiLoading && (
              <div className="absolute inset-0 bg-muted/20 animate-pulse z-30 flex items-center justify-center">
                <span className="text-[10px] font-mono text-accent uppercase tracking-widest font-black">AI Searching Visuals...</span>
              </div>
            )}
            <Image 
              src={imageUrl}
              alt={story.fullName}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover object-center filter grayscale group-hover:grayscale-0 transition-all duration-700"
            />
          </motion.div>
          
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <span className="text-[9px] font-mono text-accent uppercase tracking-widest border border-accent/20 px-3 py-1 rounded-full bg-surface/80 backdrop-blur-md font-bold">
              {formattedDate}
            </span>
            {repo.language && (
              <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest border border-white/10 px-3 py-1 rounded-full bg-surface/80 backdrop-blur-md">
                {repo.language}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Engineering Storytelling Grid */}
        <div className="lg:col-span-7 flex flex-col justify-start w-full min-w-0">
          <div className="flex items-center justify-between mb-4 gap-4">
            <h3 className="font-display font-black text-2xl md:text-4xl lg:text-5xl uppercase tracking-tighter text-text leading-[1.0] break-words hyphens-auto flex-1">
              {story.fullName}
            </h3>
            <a 
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-full border border-white/10 hover:border-accent flex items-center justify-center text-text-muted hover:text-accent transition-all shrink-0 active:scale-95"
            >
              <ArrowUpRight className="w-5 h-5" />
            </a>
          </div>

          <p className="text-text-muted text-sm leading-relaxed mb-6">
            {repo.description || 'Custom software architecture engineered from first principles.'}
          </p>

          {/* Storytelling Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-white/5 pt-6 text-xs">
            {/* Column 1: Problem & Solution */}
            <div className="space-y-5">
              <div className="flex gap-3">
                <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted font-bold block mb-1">The Challenge</span>
                  <p className="text-text-muted leading-relaxed">{story.problem}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Lightbulb className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted font-bold block mb-1">Why I Built It</span>
                  <p className="text-text-muted leading-relaxed">{story.whyBuilt}</p>
                </div>
              </div>
            </div>

            {/* Column 2: Architecture & Outcome */}
            <div className="space-y-5">
              <div className="flex gap-3">
                <Code2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted font-bold block mb-1">Architecture Schematic</span>
                  <p className="text-text-muted leading-relaxed font-mono text-[11px]">{story.architecture}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Award className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted font-bold block mb-1">Key Outcome</span>
                  <p className="text-text leading-relaxed font-bold">{story.outcome}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Badges */}
          <div className="mt-6 flex flex-wrap gap-2">
            {story.features.map((feature, fIdx) => (
              <span 
                key={fIdx} 
                className="text-[9px] font-mono bg-white/5 border border-white/10 px-3 py-1 rounded-full text-text-muted font-medium"
              >
                ● {feature}
              </span>
            ))}
          </div>

          {/* Bottom Actions Row */}
          <div className="flex gap-4 items-center justify-start mt-8 pt-4 border-t border-white/5">
            <a 
              href={repo.html_url} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono font-black uppercase tracking-widest text-text transition-colors"
            >
              <Github className="w-3.5 h-3.5" /> View Repository
            </a>
            
            <span className="text-[10px] font-mono text-text-muted">
              {repo.stargazers_count} Stars • {repo.forks_count} Forks
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
