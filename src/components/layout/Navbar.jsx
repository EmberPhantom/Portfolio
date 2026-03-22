import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X, Sun, Moon, Circle } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

const navLinks = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Skills', href: '#skills' },
  { name: 'Projects', href: '#projects' },
  { name: 'Blog', href: '#blog' },
  { name: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
      
      const sections = navLinks.map(link => link.href.slice(1))
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const offsetTop = element.offsetTop
          const offsetHeight = element.offsetHeight
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (e, href) => {
    e.preventDefault()
    const element = document.getElementById(href.slice(1))
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsOpen(false)
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-forge-black/90 backdrop-blur-md border-b border-forge-muted/20' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 relative">
              <svg viewBox="0 0 40 40" className="w-full h-full">
                <polygon 
                  points="20,2 38,11 38,29 20,38 2,29 2,11" 
                  fill="#F97316"
                />
                <text 
                  x="20" 
                  y="26" 
                  textAnchor="middle" 
                  fill="#0A0A0A" 
                  fontSize="14" 
                  fontWeight="800"
                  fontFamily="Syne"
                >
                  PC
                </text>
              </svg>
            </div>
            <span className="font-display font-bold text-xl text-white">
              Pranay
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`text-sm font-medium transition-colors relative ${
                  activeSection === link.href.slice(1)
                    ? 'text-orange-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.name}
                {activeSection === link.href.slice(1) && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange-500"
                  />
                )}
              </a>
            ))}
            
            <div className="flex items-center gap-2">
              <Circle 
                className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" 
              />
              <span className="text-xs text-green-500">Open to Work</span>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-forge-surface transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-gray-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pb-4"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`block py-2 text-lg ${
                  activeSection === link.href.slice(1)
                    ? 'text-orange-500'
                    : 'text-gray-400'
                }`}
              >
                {link.name}
              </a>
            ))}
            <div className="flex items-center gap-2 mt-4">
              <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
              <span className="text-sm text-green-500">Open to Work</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}
