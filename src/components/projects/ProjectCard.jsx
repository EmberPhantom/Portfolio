import { motion } from 'framer-motion'
import { Star, GitFork, Calendar, MessageSquare } from 'lucide-react'

export default function ProjectCard({ repo, index, onClick, languageColor }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      onClick={onClick}
      className="p-6 bg-surface rounded-xl border border-muted/20 hover:border-accent/50 cursor-pointer transition-all group hover:shadow-lg hover:shadow-accent/10"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-display text-xl font-semibold text-text group-hover:text-accent transition-colors">
          {repo.name}
        </h3>
        <div className="flex items-center gap-1 text-text-muted">
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs">{repo.open_issues_count || 0}</span>
        </div>
      </div>

      <p className="text-text-muted text-sm mb-4 line-clamp-2">
        {repo.description || 'No description available'}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {repo.topics?.slice(0, 3).map((topic) => (
          <span
            key={topic}
            className="px-2 py-1 text-[10px] bg-muted/10 rounded-full text-text-muted border border-muted/20"
          >
            {topic}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          {repo.language && (
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: languageColor }}
              />
              <span className="text-text-muted">{repo.language}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-text-muted">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>{repo.stargazers_count}</span>
          </div>
          <div className="flex items-center gap-1 text-text-muted">
            <GitFork className="w-4 h-4" />
            <span>{repo.forks_count}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-text-muted">
          <Calendar className="w-4 h-4" />
          <span className="text-xs">{formatDate(repo.updated_at)}</span>
        </div>
      </div>
    </motion.div>
  )
}
