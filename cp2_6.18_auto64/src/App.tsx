import React from 'react'
import { useChallengeStore } from './store/challengeStore'
import CreateChallenge from './modules/challenge/components/CreateChallenge'
import ChallengeDetail from './modules/challenge/components/ChallengeDetail'
import MemberDetail from './modules/challenge/components/MemberDetail'

const App: React.FC = () => {
  const currentPage = useChallengeStore(s => s.currentPage)
  const currentChallenge = useChallengeStore(s => s.currentChallenge)
  const setCurrentPage = useChallengeStore(s => s.setCurrentPage)

  const renderPage = () => {
    switch (currentPage) {
      case 'create':
        return <CreateChallenge key="create" />
      case 'detail':
        return <ChallengeDetail key="detail" />
      case 'member':
        return <MemberDetail key="member" />
      default:
        return <CreateChallenge key="create" />
    }
  }

  const showNav = currentPage !== 'member'

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A' }}>
      {showNav && (
        <nav
          style={{
            background: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #334155',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
              }}
              onClick={() => currentChallenge && setCurrentPage('detail')}
            >
              <span style={{ fontSize: '24px' }}>🏋️</span>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#fff',
                }}
              >
                FitPact
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {currentPage === 'detail' && (
                <button
                  onClick={() => setCurrentPage('create')}
                  style={{
                    background: '#3B82F6',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  + 新建挑战
                </button>
              )}
              {currentPage === 'create' && currentChallenge && (
                <button
                  onClick={() => setCurrentPage('detail')}
                  style={{
                    background: '#334155',
                    color: '#E2E8F0',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  查看当前挑战
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      {renderPage()}
    </div>
  )
}

export default App
