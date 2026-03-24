import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, ExternalLink, Github, Star, GitFork, Loader2, Send } from 'lucide-react'
import AIChat from './AIChat'

export default function ProjectModal({ repo, onClose, languageColor }) {
  const [showAIChat, setShowAIChat] = useState(false)

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-muted/20 shadow-2xl"
      >
        <div className="flex flex-col lg:flex-row h-full">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-text mb-2">
                  {repo.name}
                </h2>
                <div className="flex items-center gap-4 text-sm text-text-muted">
                  {repo.language && (
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: languageColor }}
                      />
                      <span>{repo.language}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{repo.stargazers_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GitFork className="w-4 h-4" />
                    <span>{repo.forks_count}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-bg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <p className="text-text/80 mb-6">
              {repo.description || 'No description available for this project.'}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {repo.topics?.map((topic) => (
                <span
                  key={topic}
                  className="px-3 py-1 text-sm bg-accent/10 rounded-full text-accent border border-accent/20"
                >
                  {topic}
                </span>
              ))}
            </div>

            <div className="flex gap-3 mb-6">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-bg rounded-lg text-text hover:text-accent transition-colors border border-muted/10 font-medium"
              >
                <Github className="w-4 h-4" />
                View Code
              </a>
              {repo.homepage && (
                <a
                  href={repo.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-bg rounded-lg font-bold hover:bg-accent/80 transition-colors shadow-lg shadow-accent/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  Live Demo
                </a>
              )}
            </div>

            <div className="p-4 bg-bg rounded-lg border border-muted/10">
              <h3 className="text-sm font-medium text-text-muted mb-2">Last Updated</h3>
              <p className="text-text">{formatDate(repo.updated_at)}</p>
            </div>

            {!showAIChat && (
              <button
                onClick={() => setShowAIChat(true)}
                className="mt-4 w-full py-3 bg-accent text-bg font-bold rounded-lg hover:bg-accent/80 transition-all shadow-lg shadow-accent/10"
              >
                Ask AI About This Project
              </button>
            )}
          </div>

          {showAIChat && (
            <div className="w-full lg:w-96 border-l border-muted/20">
              <AIChat repo={repo} onClose={() => setShowAIChat(false)} />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
