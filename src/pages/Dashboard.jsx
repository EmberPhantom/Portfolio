import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LayoutDashboard, FileText, MessageSquare, BarChart3, Settings, LogOut, Menu, X } from 'lucide-react'
import DashboardLogin from '../components/dashboard/DashboardLogin'
import BlogEditor from '../components/dashboard/BlogEditor'
import PostManager from '../components/dashboard/PostManager'
import MessageInbox from '../components/dashboard/MessageInbox'
import VisitorStats from '../components/dashboard/VisitorStats'

const DASHBOARD_PASSWORD = import.meta.env.VITE_DASHBOARD_PASSWORD || 'secret'

const menuItems = [
  { id: 'posts', label: 'Blog Posts', icon: FileText },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'stats', label: 'Visitor Stats', icon: BarChart3 },
]

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeSection, setActiveSection] = useState('posts')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const session = sessionStorage.getItem('dashboard_session')
    if (session === DASHBOARD_PASSWORD) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (password) => {
    if (password === DASHBOARD_PASSWORD) {
      sessionStorage.setItem('dashboard_session', password)
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const handleLogout = () => {
    sessionStorage.removeItem('dashboard_session')
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <DashboardLogin onLogin={handleLogin} />
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'posts':
        return <PostManager />
      case 'messages':
        return <MessageInbox />
      case 'stats':
        return <VisitorStats />
      default:
        return <PostManager />
    }
  }

  return (
    <div className="min-h-screen bg-forge-black flex">
      <aside className="w-64 bg-forge-surface border-r border-forge-muted/20 flex-shrink-0">
        <div className="p-6">
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-orange-500" />
            Dashboard
          </h2>
        </div>

        <nav className="px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id); setMobileMenuOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === item.id
                  ? 'bg-orange-500 text-forge-black'
                  : 'text-gray-400 hover:text-white hover:bg-forge-black'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-forge-muted/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <button
          className="md:hidden mb-4 p-2 bg-forge-surface rounded-lg"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </main>
    </div>
  )
}
