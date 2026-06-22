import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollContext } from '../context/ScrollContext'
import './Navbar.css'

export function Navbar() {
  const { scrollProgress, currentScene } = useScrollContext()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(currentScene >= 3)
  }, [currentScene])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          className="navbar"
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="navbar-content">
            <div className="navbar-brand">品牌故事</div>
            <div className="navbar-actions">
              <motion.button
                className="back-to-top-btn"
                onClick={scrollToTop}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="back-to-top-icon">↑</span>
                <span className="back-to-top-text">返回顶部</span>
              </motion.button>
            </div>
          </div>
          <div className="navbar-progress">
            <motion.div
              className="navbar-progress-bar"
              style={{
                width: `${scrollProgress * 100}%`,
              }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}

export default Navbar
