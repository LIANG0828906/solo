import { useEffect, useState } from 'react'
import { useFoodStore } from './store/foodStore'
import Dashboard from './components/Dashboard'
import CalendarView from './components/CalendarView'
import MealForm from './components/MealForm'
import UserProfile from './components/UserProfile'
import WeeklyChart from './components/WeeklyChart'

export default function App() {
  const { isFirstTime, profile, initStore } = useFoodStore()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const init = async () => {
      await initStore()
      setHydrated(true)
      if (isFirstTime || !profile) {
        setShowProfileModal(true)
      }
    }
    init()
  }, [])

  const handleProfileComplete = () => {
    setShowProfileModal(false)
  }

  if (!hydrated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#616161' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🥗</div>
          <div>加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title">
          <div className="app-title-icon">🥗</div>
          <span>饮食日记</span>
        </div>
        <button
          className="profile-btn"
          title="个人档案"
          onClick={() => setShowProfileModal(true)}
        >
          👤
        </button>
      </header>

      <div className="main-layout">
        <div className="main-content">
          <Dashboard />
          <MealForm />
        </div>
        <div className="sidebar">
          <CalendarView />
          <WeeklyChart />
        </div>
      </div>

      {showProfileModal && (
        <UserProfile
          isFirstTime={isFirstTime || !profile}
          onClose={handleProfileComplete}
        />
      )}
    </div>
  )
}
