import React, { useState, useCallback } from 'react'
import ChallengePanel from './components/ChallengePanel'
import FeedList from './components/FeedList'
import ProfileStats from './components/ProfileStats'
import { mockWorks, currentUser, getTodayChallenge, Work } from './data/mockData'

type Page = 'challenge' | 'feed' | 'profile'

interface EffectPiece {
  id: number
  type: 'applaud' | 'criticize' | 'inspire'
  x: number
  y: number
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('challenge')
  const [works, setWorks] = useState<Work[]>(mockWorks)
  const [effects, setEffects] = useState<EffectPiece[]>([])
  const todayChallenge = getTodayChallenge()

  const handleWorkPublished = useCallback((work: Work) => {
    setWorks((prev) => [work, ...prev])
  }, [])

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page as Page)
  }, [])

  const triggerEffect = useCallback(
    (type: 'applaud' | 'criticize' | 'inspire', x: number, y: number) => {
      const id = Date.now()
      setEffects((prev) => [...prev, { id, type, x, y }])

      setTimeout(() => {
        setEffects((prev) => prev.filter((e) => e.id !== id))
      }, 3000)
    },
    [],
  )

  const handleWorkUpdate = useCallback(
    (id: string, field: 'applauds' | 'criticizes' | 'inspires', delta: number) => {
      setWorks((prev) =>
        prev.map((work) =>
          work.id === id ? { ...work, [field]: work[field] + delta } : work,
        ),
      )
    },
    [],
  )

  const getInitial = (name: string): string => {
    return name.charAt(0)
  }

  const renderEffects = () => {
    return effects.map((effect) => {
      if (effect.type === 'applaud') {
        return Array.from({ length: 20 }, (_, i) => (
          <div
            key={`${effect.id}-confetti-${i}`}
            className="confetti-piece"
            style={{
              left: `${effect.x + (Math.random() - 0.5) * 200}px`,
              animationDelay: `${Math.random() * 0.3}s`,
              background: ['#ffd93d', '#ffb347', '#ff6b6b', '#fff'][i % 4],
              borderRadius: i % 3 === 0 ? '50%' : '0',
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))
      } else if (effect.type === 'criticize') {
        return Array.from({ length: 8 }, (_, i) => (
          <div
            key={`${effect.id}-bubble-${i}`}
            className="bubble-piece"
            style={{
              left: `${effect.x + (Math.random() - 0.5) * 60 - 10}px`,
              top: `${effect.y + (Math.random() - 0.5) * 60 - 10}px`,
              width: `${15 + Math.random() * 15}px`,
              height: `${15 + Math.random() * 15}px`,
              animationDelay: `${Math.random() * 0.1}s`,
            }}
          />
        ))
      } else {
        return Array.from({ length: 12 }, (_, i) => (
          <div
            key={`${effect.id}-star-${i}`}
            className="star-piece"
            style={{
              left: `${effect.x + (Math.random() - 0.5) * 100 - 4}px`,
              top: `${effect.y + (Math.random() - 0.5) * 100 - 4}px`,
              width: `${6 + Math.random() * 8}px`,
              height: `${6 + Math.random() * 8}px`,
              background: ['#a78bfa', '#fbbf24', '#60a5fa'][i % 3],
              animationDelay: `${Math.random() * 0.5}s`,
            }}
          />
        ))
      }
    })
  }

  const navItems = [
    { id: 'challenge' as Page, label: '今日挑战', icon: '✍️' },
    { id: 'feed' as Page, label: '社区作品', icon: '📖' },
    { id: 'profile' as Page, label: '我的创作', icon: '👤' },
  ]

  return (
    <>
      <div className="effect-container">{renderEffects()}</div>

      <div className="top-nav">
        <div className="top-nav-header">
          <div className="top-nav-logo">写作挑战</div>
          <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                style={{ width: '100%', height: '100%', borderRadius: '50%' }}
              />
            ) : (
              getInitial(currentUser.name)
            )}
          </div>
        </div>
        <div className="top-nav-menu">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`top-nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-profile">
            <div className="avatar">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                />
              ) : (
                getInitial(currentUser.name)
              )}
            </div>
            <div className="sidebar-profile-info">
              <h3>{currentUser.name}</h3>
              <p>创意写作者</p>
            </div>
          </div>

          <nav className="nav-menu">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => setCurrentPage(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {currentPage !== 'challenge' && (
            <div className="today-challenge-card" onClick={() => setCurrentPage('challenge')}>
              <div className="today-challenge-label">今日挑战</div>
              <div className="today-challenge-title">{todayChallenge.theme}</div>
              <div className="today-challenge-desc">点击开始创作，挑战30分钟写作</div>
            </div>
          )}
        </aside>

        <main className="main-content">
          {currentPage === 'challenge' && (
            <ChallengePanel
              onWorkPublished={handleWorkPublished}
              onNavigate={handleNavigate}
            />
          )}
          {currentPage === 'feed' && (
            <FeedList
              works={works}
              triggerEffect={triggerEffect}
              onWorkUpdate={handleWorkUpdate}
            />
          )}
          {currentPage === 'profile' && <ProfileStats />}
        </main>
      </div>
    </>
  )
}

export default App
