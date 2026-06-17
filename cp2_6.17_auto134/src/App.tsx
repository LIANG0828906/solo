import React, { useState, useEffect } from 'react'
import VoteList from './modules/投票模块/VoteList'
import VoteChart from './modules/统计模块/VoteChart'
import { useVoteStore } from './modules/投票模块/voteSlice'

type Page = 'list' | 'stats'

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('list')
  const loadFromStorage = useVoteStore(state => state.loadFromStorage)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  return (
    <div style={appStyle}>
      <nav className="nav-bar" style={navStyle}>
        <div style={navLeftStyle}>
          <span style={logoIconStyle}>✓</span>
          <span style={logoTextStyle}>VoteHub</span>
        </div>
        <div className="nav-right" style={navRightStyle}>
          <button
            onClick={() => setCurrentPage('list')}
            onMouseEnter={(e) => {
              if (currentPage !== 'list') {
                e.currentTarget.style.color = '#E0E0E0'
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== 'list') {
                e.currentTarget.style.color = '#B0B0B0'
              }
            }}
            style={{
              ...navLinkStyle,
              color: currentPage === 'list' ? '#FFFFFF' : '#B0B0B0',
              borderBottom: currentPage === 'list' ? '2px solid #6C63FF' : '2px solid transparent',
            }}
          >
            投票列表
          </button>
          <button
            onClick={() => setCurrentPage('stats')}
            onMouseEnter={(e) => {
              if (currentPage !== 'stats') {
                e.currentTarget.style.color = '#E0E0E0'
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== 'stats') {
                e.currentTarget.style.color = '#B0B0B0'
              }
            }}
            style={{
              ...navLinkStyle,
              color: currentPage === 'stats' ? '#FFFFFF' : '#B0B0B0',
              borderBottom: currentPage === 'stats' ? '2px solid #6C63FF' : '2px solid transparent',
            }}
          >
            统计页面
          </button>
        </div>
      </nav>

      <main style={mainStyle}>
        <div className="app-content" style={contentStyle}>
          {currentPage === 'list' ? <VoteList /> : <VoteChart />}
        </div>
      </main>
    </div>
  )
}

const appStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#12121C',
}

const navStyle: React.CSSProperties = {
  height: '60px',
  backgroundColor: '#1A1A2E',
  borderRadius: '0 0 12px 12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 48px',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 100,
}

const navLeftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
}

const logoIconStyle: React.CSSProperties = {
  fontSize: '24px',
}

const logoTextStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#FFFFFF',
}

const navRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '32px',
  height: '100%',
}

const navLinkStyle: React.CSSProperties = {
  fontSize: '14px',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '0 0 4px 0',
  height: '60px',
  display: 'flex',
  alignItems: 'center',
  transition: 'color 0.2s ease',
}

const mainStyle: React.CSSProperties = {
  paddingTop: '60px',
}

const contentStyle: React.CSSProperties = {
  padding: '32px 48px',
}

export default App
