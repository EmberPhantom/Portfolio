import { motion } from 'framer-motion'
import { GraduationCap, MapPin, Code2 } from 'lucide-react'

const highlights = [
  'Full Stack Developer',
  'B.Tech CSE Student',
  'Open Source Enthusiast',
  'Problem Solver'
]

export default function About() {
  return (
    <section id="about" className="py-24 bg-forge-surface">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            About <span className="text-orange-500">Me</span>
          </h2>
          <div className="w-20 h-1 bg-orange-500" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              I'm a <span className="text-orange-500 font-medium">B.Tech CSE student</span> at Dr. Lankapalli Bullayya College of Engineering, passionate about building 
              <span className="text-orange-500"> scalable applications</span> and solving complex problems.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              With a strong foundation in <span className="text-orange-500">full-stack development</span>, I love turning ideas into reality through clean, efficient code. 
              Currently focused on expanding my skills in <span className="text-orange-500">backend systems</span> and <span className="text-orange-500">cloud architecture</span>.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              When I'm not coding, you'll find me exploring <span className="text-orange-500">new technologies</span>, contributing to open source, or reading about system design.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              {highlights.map((highlight, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="px-4 py-2 bg-forge-black rounded-full text-sm text-gray-300 border border-forge-muted/30"
                >
                  {highlight}
                </motion.span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-6"
          >
            <div className="p-6 bg-forge-black rounded-xl border border-forge-muted/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Education</h3>
                  <p className="text-sm text-gray-400">B.Tech CSE</p>
                </div>
              </div>
              <p className="text-gray-300">
                Dr. Lankapalli Bullayya College of Engineering
              </p>
              <p className="text-sm text-orange-500 mt-1">2024 - 2028</p>
            </div>

            <div className="p-6 bg-forge-black rounded-xl border border-forge-muted/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <MapPin className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Location</h3>
                  <p className="text-sm text-gray-400">India</p>
                </div>
              </div>
              <p className="text-gray-300">
                Based in India, open to remote opportunities worldwide.
              </p>
            </div>

            <div className="p-6 bg-forge-black rounded-xl border border-forge-muted/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <Code2 className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Currently Building</h3>
                  <p className="text-sm text-gray-400">Side Projects & Learning</p>
                </div>
              </div>
              <p className="text-gray-300">
                Exploring distributed systems and building REST APIs.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
