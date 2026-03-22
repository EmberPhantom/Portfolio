import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, Download, ExternalLink } from 'lucide-react'

const roles = [
  'Full Stack Developer',
  'Systems Builder',
  'Problem Solver',
  'Backend Engineer'
]

export default function Hero() {
  const [currentRole, setCurrentRole] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRole((prev) => (prev + 1) % roles.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-50 grid-rows-50 h-full w-full">
          {Array.from({ length: 2500 }).map((_, i) => (
            <div key={i} className="border border-gray-700" />
          ))}
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-6 py-32 text-center relative z-10"
      >
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polygon 
                  points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" 
                  fill="#F97316"
                  className="drop-shadow-lg"
                />
                <circle cx="50" cy="50" r="40" fill="#0A0A0A" />
                <text 
                  x="50" 
                  y="58" 
                  textAnchor="middle" 
                  fill="#F97316" 
                  fontSize="24" 
                  fontWeight="800"
                  fontFamily="Syne"
                >
                  PC
                </text>
              </svg>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 border-orange-500"
              />
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-4">
            Pranay Chandra
          </h1>
          <div className="h-12 flex items-center justify-center mb-6">
            <motion.p
              key={currentRole}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-xl md:text-2xl text-orange-500 font-medium"
            >
              {roles[currentRole]}
            </motion.p>
          </div>
        </motion.div>

        <motion.p 
          variants={itemVariants}
          className="text-lg text-gray-400 max-w-2xl mx-auto mb-8"
        >
          Engineering ideas into reality. Building robust solutions with modern technologies.
        </motion.p>

        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href="#projects"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-forge-black font-semibold rounded-lg hover:bg-orange-400 transition-colors"
          >
            View My Work
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-600 text-white font-semibold rounded-lg hover:border-orange-500 hover:text-orange-500 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Resume
          </button>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowDown className="w-6 h-6 text-gray-500" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
