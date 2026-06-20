import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'

const Navbar = () => {
  const [scrollY, setScrollY] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const maxScroll = 300
  const scrollProgress = Math.min(scrollY / maxScroll, 1)
  const baseOpacity = 0.6
  const maxOpacity = 0.95
  const backgroundOpacity = baseOpacity + (maxOpacity - baseOpacity) * scrollProgress
  const blurAmount = 8 + scrollProgress * 8
  const shadowOpacity = 0.05 + scrollProgress * 0.1

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '16px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: `rgba(45, 74, 62, ${backgroundOpacity})`,
        backdropFilter: `blur(${blurAmount}px)`,
        WebkitBackdropFilter: `blur(${blurAmount}px)`,
        boxShadow: `0 ${2 + scrollProgress * 4}px ${10 + scrollProgress * 20}px rgba(0, 0, 0, ${shadowOpacity})`,
        transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#c9a96e',
            letterSpacing: '1px',
          }}
        >
          臻品阁
        </motion.div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <AnimatePresence>
          {searchOpen && (
            <motion.input
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              type="text"
              placeholder="搜索拍品..."
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#f5f0eb',
                outline: 'none',
                fontSize: '14px',
                width: '240px',
              }}
            />
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setSearchOpen(!searchOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: '#f5f0eb',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          🔍
        </motion.button>

        <Link to="/user/1" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#c9a96e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2d4a3e',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            用
          </motion.div>
        </Link>
      </div>
    </motion.nav>
  )
}

export default Navbar
