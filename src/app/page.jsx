'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Briefcase,
  ArrowUpRight,
  FolderGit2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await fetch('/api/projects?featured=true');
        if (!res.ok) throw new Error('Failed to fetch best projects');
        const data = await res.json();
        setFeaturedProjects(data || []);
      } catch (err) {
        console.error('Failed to load featured projects:', err);
      } finally {
        setLoadingFeatured(false);
      }
    }
    loadFeatured();
  }, []);

  return (
    <div className="w-full flex flex-col justify-start px-6 md:px-12 lg:px-20 max-w-7xl mx-auto pt-8 pb-20 relative font-body overflow-visible">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-10 md:py-16 relative">
        {/* Left Column - Copy details */}
        <div className="lg:col-span-7 flex flex-col items-start justify-center z-10">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-black text-text uppercase tracking-tighter leading-[0.9] mb-4"
          >
            I'm Pranay Chandra
          </motion.h1>

          {/* Static, Minimalist Roles Subtitle */}
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="font-display text-lg md:text-2xl text-accent font-bold uppercase tracking-tight mb-6"
          >
            Full-Stack Developer • AI Engineer • Startup Founder
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="text-text-muted text-base md:text-lg leading-relaxed max-w-xl mb-8"
          >
            I build real-world products at the intersection of AI, automation, and software engineering. I enjoy designing scalable systems, experimenting with emerging technologies, and turning ideas into products that solve meaningful problems.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <Link 
              href="/work" 
              className="px-7 py-3.5 bg-accent hover:bg-accent/90 text-bg font-black rounded-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 text-xs uppercase tracking-widest shadow-lg shadow-accent/15"
            >
              View My Work <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/contact" 
              className="px-7 py-3.5 bg-white/5 hover:bg-white/10 text-text font-black rounded-xl border border-white/10 hover:-translate-y-0.5 active:translate-y-0 transition-all text-xs uppercase tracking-widest"
            >
              Let's Connect
            </Link>
          </motion.div>
        </div>

        {/* Right Column - Interactive Morpher */}
        <div className="lg:col-span-5 flex justify-center items-center relative">
          <InteractiveAvatarMorpher />
        </div>
      </section>

      {/* Personal Statistics Section */}
      <section className="py-12 border-t border-white/5 relative">
        <h2 className="text-xs font-mono text-text-muted uppercase tracking-[0.2em] mb-8 text-center">Core Metrics & Shipped Impact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          <StatCard 
            title="Years Building" 
            value="2+" 
            desc="Full-stack & AI pipelines" 
            delay={0.1}
          />
          <StatCard 
            title="Shipped Systems" 
            value="4+" 
            desc="Voice AI, RAG & Mobile Apps" 
            delay={0.2}
          />
          <StatCard 
            title="Outreach Engagement" 
            value="100+" 
            desc="Concurrent call sessions" 
            delay={0.3}
          />
          <StatCard 
            title="Community Leadership" 
            value="1" 
            desc="Founded Moon Phoenix Dev Hub" 
            delay={0.4}
          />
        </div>
      </section>

      {/* Dynamic Best Projects Showcase */}
      {featuredProjects.length > 0 && (
        <section className="py-12 border-t border-white/5 relative">
          <h2 className="text-xs font-mono text-text-muted uppercase tracking-[0.2em] mb-8 text-center">Featured Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {featuredProjects.map((project) => (
              <FeaturedProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}

      {/* Storytelling Sections */}
      <ScrollRevealSection delay={0.2}>
        <div className="py-16 grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-white/5">
          <div className="md:col-span-4">
            <h2 className="text-2xl md:text-3xl font-display font-black text-text uppercase tracking-tight">Engineering Philosophy</h2>
            <div className="h-1 w-10 bg-accent mt-3 rounded-full" />
          </div>
          <div className="md:col-span-8 space-y-6">
            <p className="text-text-muted text-base md:text-lg leading-relaxed">
              I believe in shipping fast, building clean, and taking ownership of backend systems from day one. I specialize in bidirectional audio voice processing pipelines, secured webhook layers, and custom multi-agent structures to bypass standard bottlenecks.
            </p>
            <p className="text-text-muted text-base md:text-lg leading-relaxed">
              Every project listed here represents a complete implementation designed from first principles, utilizing modern edge frameworks like Hono.js on Cloudflare Workers, Django, and Next.js.
            </p>
          </div>
        </div>
      </ScrollRevealSection>

      <ScrollRevealSection delay={0.3}>
        <div className="py-16 grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-white/5">
          <div className="md:col-span-4">
            <h2 className="text-2xl md:text-3xl font-display font-black text-text uppercase tracking-tight">Current Engagements</h2>
            <div className="h-1 w-10 bg-accent mt-3 rounded-full" />
          </div>
          <div className="md:col-span-8 space-y-6">
            <p className="text-text-muted text-base md:text-lg leading-relaxed">
              As the sole founder of **AnserTech**, I handle the architecture, development, deployment, and onboarding. The system maps client IDs, coordinates credits buffer checks to regulate LLM costs, and delivers a robust customer automation pipeline.
            </p>
            <div className="flex gap-4 items-center p-6 bg-surface/30 border border-white/10 rounded-2xl w-fit">
              <Briefcase className="w-8 h-8 text-accent shrink-0" />
              <div>
                <h4 className="font-bold text-white uppercase text-sm font-display tracking-wide">Lead Engineer, AnserTech</h4>
                <p className="text-xs text-text-muted mt-1 font-mono">Python • Django REST • FastAPI • WebSockets • Voice AI</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollRevealSection>
    </div>
  );
}

// ==========================================
// PORTRAIT MORPHER WIDGET
// ==========================================

function InteractiveAvatarMorpher() {
  const [isReal, setIsReal] = useState(true);
  const [particles, setParticles] = useState([]);

  const handleToggle = () => {
    setIsReal(!isReal);
    const newParticles = Array.from({ length: 12 }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      size: Math.random() * 6 + 4
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 800);
  };

  return (
    <div className="relative cursor-pointer select-none" onClick={handleToggle}>
      <div className="absolute inset-0 bg-accent/5 rounded-full blur-[80px] pointer-events-none scale-110" />

      {particles.map(p => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          animate={{ opacity: 0, scale: 0.2, x: p.x, y: p.y }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent z-20 shadow-[0_0_10px_var(--accent)]"
          style={{ width: p.size, height: p.size }}
        />
      ))}

      <motion.div
        className="w-[280px] h-[340px] md:w-[320px] md:h-[400px] rounded-[3rem] border border-white/15 overflow-hidden shadow-2xl relative bg-surface/50 backdrop-blur-md"
        animate={{ rotate: isReal ? 0 : 360, scale: isReal ? 1 : 0.98 }}
        transition={{ type: 'spring', stiffness: 100, damping: 14 }}
      >
        <AnimatePresence mode="wait">
          {isReal ? (
            <motion.img
              key="real"
              src="/images/pranay-real.png"
              alt="Pranay Chandra Real"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full object-cover"
            />
          ) : (
            <motion.img
              key="avatar"
              src="/images/pranay-avatar.png"
              alt="Pranay Chandra Avatar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full object-cover bg-bg"
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ==========================================
// FEATURED PROJECT CARD
// ==========================================

function FeaturedProjectCard({ project }) {
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop');
  const [loadingImg, setLoadingImg] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/image?name=${encodeURIComponent(project.name)}&desc=${encodeURIComponent(project.description || '')}`)
      .then(res => res.json())
      .then(data => {
        if (data.imageUrl) setImageUrl(data.imageUrl);
      })
      .catch(() => {})
      .finally(() => setLoadingImg(false));
  }, [project.name, project.description]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-surface/30 border border-white/5 hover:border-accent/20 rounded-3xl overflow-hidden p-6 flex flex-col justify-between shadow-xl transition-all duration-300 min-h-[380px]"
    >
      <div>
        {/* Project Thumbnail Image Container */}
        <div className="w-full h-44 rounded-2xl overflow-hidden relative mb-5 bg-surface border border-white/5">
          {loadingImg && (
            <div className="absolute inset-0 bg-muted/20 animate-pulse flex items-center justify-center">
              <span className="text-[9px] font-mono text-accent uppercase tracking-widest">Searching visuals...</span>
            </div>
          )}
          <Image
            src={imageUrl}
            alt={project.name}
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700 filter grayscale group-hover:grayscale-0"
          />
          {project.status && (
            <span className="absolute top-3 right-3 text-[9px] font-mono uppercase tracking-wider font-bold bg-[#0a0a0a]/80 backdrop-blur-md text-accent border border-accent/25 px-2.5 py-1 rounded-full">
              {project.status}
            </span>
          )}
        </div>

        {/* Project Meta Information */}
        <div className="flex items-center justify-between gap-4 mb-2">
          <h3 className="font-display font-black text-xl md:text-2xl uppercase tracking-tighter text-text group-hover:text-accent transition-colors break-words flex-1">
            {project.name.replace(/([A-Z])/g, ' $1').replace(/-/g, ' ').replace(/_/g, ' ').trim()}
          </h3>
          <Link
            href={`/work/${project.slug}`}
            className="w-8 h-8 rounded-full border border-white/10 group-hover:border-accent flex items-center justify-center text-text-muted group-hover:text-accent transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-text-muted text-xs leading-relaxed mb-6">
          {project.description || 'Custom software architecture engineered from first principles.'}
        </p>
      </div>

      {/* Tech stack badges */}
      <div>
        {project.tech_stack && project.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {project.tech_stack.slice(0, 3).map((tech, idx) => (
              <span key={idx} className="text-[9px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-text-muted">
                {tech}
              </span>
            ))}
            {project.tech_stack.length > 3 && (
              <span className="text-[9px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-text-muted">
                +{project.tech_stack.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ==========================================
// REUSABLE COMPONENT WRAPPERS
// ==========================================

function StatCard({ title, value, desc, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay }}
      whileHover={{ y: -4, border: '1px solid rgba(249, 115, 22, 0.3)' }}
      className="p-6 bg-surface/40 backdrop-blur-xl border border-white/5 rounded-3xl flex flex-col justify-between h-40 shadow-xl transition-all cursor-none select-none"
    >
      <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest">{title}</span>
      <div className="flex flex-col gap-1">
        <span className="text-4xl font-display font-black text-text">{value}</span>
        <span className="text-xs text-text-muted font-body leading-relaxed">{desc}</span>
      </div>
    </motion.div>
  );
}

function ScrollRevealSection({ children, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
