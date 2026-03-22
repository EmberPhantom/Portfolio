import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function CursorTrail() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [trail, setTrail] = useState([])
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    let mouseX = 0
    let mouseY = 0
    
    const handleMouseMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      setPosition({ x: mouseX, y: mouseY })
      
      setTrail(prev => [
        { x: mouseX, y: mouseY, id: Date.now() },
        ...prev.slice(0, 5)
      ])
    }

    const handleMouseOver = (e) => {
      if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('button')) {
        setIsHovering(true)
      } else {
        setIsHovering(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseover', handleMouseOver)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseover', handleMouseOver)
    }
  }, [])

  return (
    <>
      {trail.map((point, index) => (
        <motion.div
          key={point.id}
          className="fixed pointer-events-none z-50"
          initial={{ x: point.x, y: point.y, opacity: 0.8 - (index * 0.15), scale: 1 - (index * 0.1) }}
          animate={{ 
            x: point.x, 
            y: point.y, 
            opacity: 0,
            scale: 0
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div 
            className={`rounded-full bg-orange-500 ${isHovering ? 'w-4 h-4' : 'w-2 h-2'}`}
            style={{ opacity: 0.6 - (index * 0.1) }}
          />
        </motion.div>
      ))}
    </>
  )
}
