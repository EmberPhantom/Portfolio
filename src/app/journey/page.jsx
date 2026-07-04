'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  BookOpen, 
  Users, 
  Cpu, 
  Code2, 
  Database, 
  Globe,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function JourneyPage() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center font-mono text-xs uppercase tracking-widest text-text-muted">Loading Journey...</div>}>
      <JourneyContent />
    </Suspense>
  );
}

function JourneyContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'skills' ? 'skills' : 'timeline';

  const setActiveTab = (tab) => {
    if (tab === 'skills') {
      window.history.pushState(null, '', '/journey?tab=skills');
    } else {
      window.history.pushState(null, '', '/journey');
    }
  };

  const timelineEvents = [
    {
      type: 'experience',
      title: 'Founder & Lead Engineer',
      organization: 'AnserTech',
      period: '2024 - Present',
      description: [
        'Built a real-time voice AI pipeline from scratch: bidirectional audio processing (ulaw to PCM), sub-500ms latency, and 100 concurrent sessions call handling architecture.',
        'Secured the pipeline with HMAC-validated webhooks and built a credit-based buffer manager to control LLM costs.',
        'Developed Django REST Framework backend and Next.js frontend dashboards.'
      ]
    },
    {
      type: 'leadership',
      title: 'Founder & Student Lead',
      organization: 'Moon Phoenix Developer Community',
      period: '2024 - Present',
      description: [
        'Formed and led the student developer community at Dr. LB College of Engineering.',
        'Organized technical bootcamps, workshops, and campus hackathons to foster engineering culture.'
      ]
    },
    {
      type: 'education',
      title: 'B.Tech in Computer Science and Engineering',
      organization: 'Dr. Lankapalli Bullayya College of Engineering',
      period: 'Aug 2024 - May 2028',
      description: [
        'Current GPA: 7.85 / 10',
        'Relevant coursework: Data Structures and Algorithms, DBMS, Operating Systems, Computer Networks, Object-Oriented Programming.'
      ]
    }
  ];

  const skillGroups = [
    {
      category: 'Languages',
      icon: Code2,
      skills: [
        { name: 'JavaScript', value: 95 },
        { name: 'TypeScript', value: 92 },
        { name: 'Python', value: 90 },
        { name: 'C', value: 75 },
        { name: 'Java', value: 70 }
      ]
    },
    {
      category: 'Backend & APIs',
      icon: Cpu,
      skills: [
        { name: 'Django REST Framework', value: 92 },
        { name: 'FastAPI', value: 88 },
        { name: 'Hono.js', value: 90 },
        { name: 'Node.js / Express', value: 85 },
        { name: 'WebSockets', value: 92 }
      ]
    },
    {
      category: 'Frontend & Apps',
      icon: Globe,
      skills: [
        { name: 'Next.js', value: 94 },
        { name: 'React.js', value: 93 },
        { name: 'React Native (Expo)', value: 80 },
        { name: 'TailwindCSS', value: 95 }
      ]
    },
    {
      category: 'Databases & AI/ML',
      icon: Database,
      skills: [
        { name: 'pgvector / Qdrant / Vectorize', value: 88 },
        { name: 'PostgreSQL / SQLite', value: 90 },
        { name: 'LangGraph / Multi-Agent', value: 85 },
        { name: 'RAG Pipelines', value: 90 }
      ]
    }
  ];

  return (
    <div className="w-full flex flex-col justify-start px-6 md:px-12 lg:px-20 max-w-5xl mx-auto pt-24 pb-32 relative font-body text-text">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Page Header */}
      <div className="mb-16">
        <h1 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
          My <span className="text-accent">Journey.</span>
        </h1>
        <p className="text-text-muted text-lg max-w-xl">
          Tracing my path from core computer science fundamentals to building low-latency AI business automation solutions.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-white/10 mb-12 select-none">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-4 px-6 font-display font-black text-xs uppercase tracking-widest border-b-2 transition-all cursor-none ${
            activeTab === 'timeline' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          EXPERIENCE & EDUCATION
        </button>
        <button
          id="skills"
          onClick={() => setActiveTab('skills')}
          className={`pb-4 px-6 font-display font-black text-xs uppercase tracking-widest border-b-2 transition-all cursor-none ${
            activeTab === 'skills' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          TECHNICAL SKILLS
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'timeline' ? (
          <div className="relative pl-6 md:pl-8 border-l border-white/10 space-y-12 py-4">
            {timelineEvents.map((event, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative"
              >
                {/* Timeline Dot Indicator */}
                <span className="absolute -left-[39px] md:-left-[47px] top-1.5 w-6 h-6 rounded-full bg-surface border border-accent/40 flex items-center justify-center text-accent shadow-md shadow-accent/5">
                  {event.type === 'experience' && <Briefcase className="w-3 h-3" />}
                  {event.type === 'education' && <BookOpen className="w-3 h-3" />}
                  {event.type === 'leadership' && <Users className="w-3 h-3" />}
                </span>

                <div className="bg-surface/30 border border-white/5 p-6 rounded-2xl flex flex-col gap-3 shadow-xl hover:border-white/10 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display font-black text-lg text-white uppercase tracking-tight">
                        {event.title}
                      </h3>
                      <p className="text-accent text-xs font-mono tracking-wide mt-0.5">
                        {event.organization}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-text-muted border border-white/10 px-3 py-1 rounded-full bg-bg/50 uppercase tracking-widest font-black self-start sm:self-center">
                      {event.period}
                    </span>
                  </div>

                  <ul className="list-disc pl-4 space-y-2 mt-2 text-text-muted text-sm leading-relaxed">
                    {event.description.map((desc, i) => (
                      <li key={i}>{desc}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {skillGroups.map((group, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="bg-surface/30 border border-white/5 p-8 rounded-3xl shadow-xl flex flex-col"
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="p-2 bg-accent/10 border border-accent/20 rounded-xl text-accent">
                    <group.icon className="w-5 h-5" />
                  </span>
                  <h3 className="font-display font-black text-lg uppercase tracking-tight text-white">
                    {group.category}
                  </h3>
                </div>

                <div className="space-y-4">
                  {group.skills.map((skill, sIdx) => (
                    <div key={sIdx} className="space-y-1 text-xs">
                      <div className="flex justify-between font-mono text-text-muted">
                        <span>{skill.name}</span>
                        <span className="font-bold text-accent">{skill.value}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${skill.value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                          className="h-full bg-accent rounded-full shadow-[0_0_10px_var(--accent)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
