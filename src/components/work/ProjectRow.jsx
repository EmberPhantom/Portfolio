"use client";

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

// Helper to assign a cinematic placeholder image based on repo name hash
// Helper to assign a cinematic placeholder image based on repo name and description
function getPlaceholderImage(repoName, description) {
  const name = repoName.toLowerCase();
  const desc = (description || '').toLowerCase();

  // 1. Check for specific high-profile projects
  if (name.includes('contexia')) return '/projects/contexia.png';
  if (name.includes('portfolio') || name.includes('emberos')) return '/projects/portfolio.png';
  if (name.includes('archonix') || name.includes('system') || name.includes('management')) return '/projects/system.png';

  // 2. Keyword-based categories
  const categories = {
    ai: ['ai', 'intelligence', 'gpt', 'llm', 'autonomous', 'vision'],
    code: ['code', 'lib', 'script', 'engine', 'core', 'developer'],
    web: ['web', 'portfolio', 'site', 'react', 'next', 'css'],
    data: ['data', 'analytics', 'vis', 'logs', 'database', 'sql'],
    social: ['social', 'twitter', 'linkedin', 'media', 'thread'],
  };

  const images = {
    ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop',
    code: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1200&auto=format&fit=crop',
    web: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop',
    data: 'https://images.unsplash.com/photo-1518186239124-fd2f9012a68c?q=80&w=1200&auto=format&fit=crop',
    social: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1200&auto=format&fit=crop',
    default: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop'
  };

  const text = `${name} ${desc}`;
  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(k => text.includes(k))) return images[cat];
  }

  return images.default;
}

export default function ProjectRow({ repo, index }) {
  const [aiImage, setAiImage] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  const isEven = index % 2 === 0;
  const localImage = getPlaceholderImage(repo.name, repo.description);
  const isCustomLocal = localImage.startsWith('/projects/');
  const formattedDate = new Date(repo.updated_at).getFullYear();

  useEffect(() => {
    if (!isCustomLocal) {
      setIsAiLoading(true);
      fetch(`/api/projects/image?name=${repo.name}&desc=${encodeURIComponent(repo.description || '')}`)
        .then(res => res.json())
        .then(data => {
          if (data.imageUrl) setAiImage(data.imageUrl);
        })
        .catch(() => {})
        .finally(() => setIsAiLoading(false));
    }
  }, [repo.name, repo.description, isCustomLocal]);

  const imageUrl = isCustomLocal ? localImage : (aiImage || localImage);

  return (
    <motion.div 
      ref={ref}
      style={{ opacity }}
      className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-24 group relative`}
    >
      {/* Image Container with Parallax */}
      <div className="w-full md:w-1/2 h-[350px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-2xl relative">
        <Link href={`/work/${repo.name}`} className="absolute inset-0 z-20" />
        <motion.div 
          style={{ y, scale }}
          className="w-full h-[120%] relative -top-[10%]"
        >
          {isAiLoading && (
            <div className="absolute inset-0 bg-muted/20 animate-pulse z-30 flex items-center justify-center">
               <span className="text-[10px] font-mono text-accent uppercase tracking-widest">AI SYNCING...</span>
            </div>
          )}
          <div className="absolute inset-0 bg-bg/20 group-hover:bg-transparent transition-colors duration-700 z-10" />
          <Image 
            src={imageUrl}
            alt={repo.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`object-cover object-center filter grayscale group-hover:grayscale-0 transition-all duration-700 ${isAiLoading ? 'opacity-0' : 'opacity-100'}`}
          />
        </motion.div>
        
        {/* Hover Reveal Button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center text-bg shadow-2xl">
            <span className="font-bold">VIEW</span>
          </div>
        </div>
      </div>

      {/* Typography Data */}
      <div className={`w-full md:w-1/2 flex flex-col ${isEven ? 'items-start text-left' : 'items-start md:items-end text-left md:text-right'}`}>
        <div className="flex gap-3 mb-6">
          <span className="text-accent font-mono text-sm tracking-widest border border-accent/30 px-3 py-1 rounded-full">
            {formattedDate}
          </span>
          {repo.language && (
             <span className="text-text-muted font-mono text-sm tracking-widest border border-muted/50 px-3 py-1 rounded-full">
               {repo.language}
             </span>
          )}
        </div>
        <Link href={`/work/${repo.name}`} className="group-hover:text-accent transition-colors block w-full">
          <h2 className="text-3xl md:text-5xl lg:text-[clamp(2rem,6vw,4rem)] font-display font-black text-text uppercase tracking-tighter mb-6 break-words leading-[0.95] max-w-full">
            {repo.name.replace(/-/g, ' ')}
          </h2>
        </Link>
        <p className="text-lg md:text-xl text-text-muted max-w-md line-clamp-3 leading-relaxed">
          {repo.description || 'System architecture and engineering deep dive. View the case study for architectural details and implementation philosophy.'}
        </p>
        
        <div className="flex gap-6 mt-8">
            <Link 
            href={`/work/${repo.name}`}
            className="flex items-center gap-2 group/btn"
            >
            <div className="w-12 h-12 rounded-full border border-muted/50 flex items-center justify-center group-hover/btn:bg-text group-hover/btn:border-text transition-all">
                <ArrowUpRight className="w-5 h-5 text-text group-hover/btn:text-bg transition-colors" />
            </div>
            <span className="font-semibold text-text group-hover/btn:text-text-muted">Case Study</span>
            </Link>

            <a 
            href={repo.html_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 group/btn"
            >
            <div className="w-12 h-12 rounded-full border border-muted/50 flex items-center justify-center group-hover/btn:bg-accent group-hover/btn:border-accent transition-all">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-text group-hover/btn:fill-bg transition-colors"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </div>
            <span className="font-semibold text-text group-hover/btn:text-text-muted tracking-wide">{repo.stargazers_count} Stars</span>
            </a>
        </div>
      </div>
    </motion.div>
  );
}
