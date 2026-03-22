import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, GitFork, ExternalLink, Github, Loader2 } from 'lucide-react'
import { useGitHubRepos } from '../../hooks/useGitHubRepos'
import ProjectCard from '../projects/ProjectCard'
import ProjectModal from '../projects/ProjectModal'

const languageColors = {
  JavaScript: '#F7DF1E',
  TypeScript: '#3178C6',
  Python: '#3572A5',
  Java: '#B07219',
  'C++': '#F34B7D',
  Go: '#00ADD8',
  Rust: '#DEA584',
  HTML: '#E34C26',
  CSS: '#563D7C',
  Shell: '#89E051',
}

export default function Projects() {
  const { repos, loading, error } = useGitHubRepos()
  const [selectedRepo, setSelectedRepo] = useState(null)

  return (
    <section id="projects" className="py-24 bg-forge-surface">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Featured <span className="text-orange-500">Projects</span>
          </h2>
          <div className="w-20 h-1 bg-orange-500" />
          <p className="text-gray-400 mt-4 max-w-2xl">
            Explore my GitHub repositories. Click on any project to learn more through our AI-powered project explainer.
          </p>
        </motion.div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <span className="ml-3 text-gray-400">Loading repositories...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repos.map((repo, index) => (
              <ProjectCard
                key={repo.id}
                repo={repo}
                index={index}
                onClick={() => setSelectedRepo(repo)}
                languageColor={languageColors[repo.language] || '#6B7280'}
              />
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <a
            href="https://github.com/EmberPhantom"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-600 text-white font-semibold rounded-lg hover:border-orange-500 hover:text-orange-500 transition-colors"
          >
            <Github className="w-5 h-5" />
            View All on GitHub
          </a>
        </motion.div>
      </div>

      {selectedRepo && (
        <ProjectModal
          repo={selectedRepo}
          onClose={() => setSelectedRepo(null)}
          languageColor={languageColors[selectedRepo.language] || '#6B7280'}
        />
      )}
    </section>
  )
}
