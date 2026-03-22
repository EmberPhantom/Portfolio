import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from './Navbar'
import Footer from './Footer'
import CursorTrail from '../ui/CursorTrail'
import { useEffect, useState } from 'react'

export default function Layout() {
  const [showCursor, setShowCursor] = useState(false)

  useEffect(() => {
    const handleMouseMove = () => setShowCursor(true)
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-forge-black">
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Outlet />
      </motion.main>
      <Footer />
      {showCursor && <CursorTrail />}
    </div>
  )
}
