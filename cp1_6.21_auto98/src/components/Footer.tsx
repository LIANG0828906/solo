import { motion } from 'framer-motion'
import './Footer.css'

export function Footer() {
  const handleCTAClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <footer className="footer">
      <div className="footer-content">
        <motion.button
          className="cta-button"
          onClick={handleCTAClick}
          whileHover={{
            scale: 1.05,
            boxShadow: '0 8px 30px rgba(30, 136, 229, 0.5)',
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          开始体验
        </motion.button>
      </div>
    </footer>
  )
}

export default Footer
