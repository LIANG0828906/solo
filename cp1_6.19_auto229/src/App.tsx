import { Routes, Route, Link } from 'react-router-dom'
import { motion } from 'framer-motion'

declare const PoemList: React.ComponentType
declare const PoemEditor: React.ComponentType
declare const AnalyticsDashboard: React.ComponentType<{ id: string }>

const PoemDetail: React.FC = () => {
  return <div style={{ padding: '24px' }}>诗歌详情页（包含批注面板）</div>
}

const MotionLink = motion(Link)

const linkStyle = {
  color: '#E0E7FF',
  textDecoration: 'none',
  fontSize: '14px',
}

const App: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#0F0F23', color: '#E0E7FF' }}>
      <nav
        style={{
          height: '40px',
          background: 'rgba(15, 15, 35, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '1px solid #1E1E3A',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '20px',
            color: '#E0E7FF',
            fontWeight: 600,
          }}
        >
          诗歌共创工坊
        </div>
        <div style={{ display: 'flex', gap: '24px', marginLeft: 'auto' }}>
          <MotionLink
            to="/"
            style={linkStyle}
            whileHover={{ scale: 1.05, color: '#818CF8' }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            首页
          </MotionLink>
          <MotionLink
            to="/create"
            style={linkStyle}
            whileHover={{ scale: 1.05, color: '#818CF8' }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            创作
          </MotionLink>
          <MotionLink
            to="/analytics/1"
            style={linkStyle}
            whileHover={{ scale: 1.05, color: '#818CF8' }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            分析
          </MotionLink>
        </div>
      </nav>

      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px',
        }}
      >
        <Routes>
          <Route path="/" element={<PoemList />} />
          <Route path="/create" element={<PoemEditor />} />
          <Route path="/poem/:id" element={<PoemDetail />} />
          <Route
            path="/analytics/:id"
            element={<AnalyticsDashboard id="" />}
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
