import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const skillCategories = [
  {
    id: 'frontend',
    label: 'Frontend',
    skills: [
      { name: 'React', level: 90 },
      { name: 'JavaScript', level: 85 },
      { name: 'TypeScript', level: 80 },
      { name: 'Tailwind CSS', level: 90 },
      { name: 'HTML/CSS', level: 95 },
      { name: 'Next.js', level: 70 },
    ]
  },
  {
    id: 'backend',
    label: 'Backend',
    skills: [
      { name: 'Node.js', level: 85 },
      { name: 'Express', level: 85 },
      { name: 'Python', level: 80 },
      { name: 'MongoDB', level: 75 },
      { name: 'PostgreSQL', level: 70 },
      { name: 'REST APIs', level: 85 },
    ]
  },
  {
    id: 'devops',
    label: 'DevOps & Tools',
    skills: [
      { name: 'Git', level: 90 },
      { name: 'Docker', level: 65 },
      { name: 'AWS', level: 60 },
      { name: 'Linux', level: 75 },
      { name: 'CI/CD', level: 65 },
      { name: 'VS Code', level: 95 },
    ]
  },
  {
    id: 'languages',
    label: 'Languages',
    skills: [
      { name: 'JavaScript', level: 90 },
      { name: 'Python', level: 80 },
      { name: 'Java', level: 70 },
      { name: 'C++', level: 65 },
      { name: 'SQL', level: 75 },
      { name: 'Bash', level: 60 },
    ]
  }
]

export default function Skills() {
  const [activeCategory, setActiveCategory] = useState('frontend')

  return (
    <section id="skills" className="py-24 bg-forge-black">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Skills & <span className="text-orange-500">Expertise</span>
          </h2>
          <div className="w-20 h-1 bg-orange-500" />
        </motion.div>

        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {skillCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeCategory === category.id
                    ? 'bg-orange-500 text-forge-black'
                    : 'bg-forge-surface text-gray-400 hover:text-white'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {skillCategories
              .find((cat) => cat.id === activeCategory)
              ?.skills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="p-4 bg-forge-surface rounded-xl border border-forge-muted/20 hover:border-orange-500/50 transition-colors group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-white group-hover:text-orange-500 transition-colors">
                      {skill.name}
                    </span>
                    <span className="text-sm text-gray-500">{skill.level}%</span>
                  </div>
                  <div className="h-2 bg-forge-black rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.level}%` }}
                      transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                      className="h-full bg-gradient-to-r from-orange-600 to-orange-500 rounded-full"
                    />
                  </div>
                </motion.div>
              ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
