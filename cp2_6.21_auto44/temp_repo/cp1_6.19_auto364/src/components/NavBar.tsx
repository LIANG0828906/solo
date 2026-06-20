import { motion } from 'framer-motion'
import type { Page } from '@/App'

interface NavBarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

export default function NavBar({ currentPage, onNavigate }: NavBarProps) {
  const navItems: { key: Page; label: string }[] = [
    { key: 'browser', label: '卡片组' },
    { key: 'stats', label: '统计' }
  ]

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        height: '56px',
        backgroundColor: 'rgba(22, 22, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(102, 126, 234, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer'
        }}
        onClick={() => onNavigate('browser')}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '16px',
            color: '#fff'
          }}
        >
          F
        </div>
        <span
          style={{
            fontSize: '18px',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          FlashLearn
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {navItems.map((item) => {
          const isActive = currentPage === item.key
          return (
            <motion.button
              key={item.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(item.key)}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 400,
                background: isActive
                  ? 'linear-gradient(135deg, #667eea, #764ba2)'
                  : 'transparent',
                color: isActive ? '#fff' : '#e9ecef',
                transition: 'all 0.2s ease'
              }}
            >
              {item.label}
            </motion.button>
          )
        })}
      </div>
    </motion.nav>
  )
}
