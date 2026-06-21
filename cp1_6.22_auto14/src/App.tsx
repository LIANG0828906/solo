import { useState, useEffect } from 'react'
import WorkoutList from './components/WorkoutList'
import WorkoutDetail from './components/WorkoutDetail'
import ProgressChart from './components/ProgressChart'
import './styles/app.css'

type Page = 'list' | 'detail' | 'progress'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('list')
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigateTo = (page: Page, workoutId?: string) => {
    setCurrentPage(page)
    if (workoutId) setSelectedWorkoutId(workoutId)
    setIsMenuOpen(false)
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="logo">
          <span className="logo-icon">💪</span>
          <span className="logo-text">健身助手</span>
        </div>
        <div className="nav-links">
          <button
            className={`nav-btn ${currentPage === 'list' ? 'active' : ''}`}
            onClick={() => navigateTo('list')}
          >
            <span className="nav-icon">📋</span>
            <span>训练计划</span>
          </button>
          <button
            className={`nav-btn ${currentPage === 'progress' ? 'active' : ''}`}
            onClick={() => navigateTo('progress')}
          >
            <span className="nav-icon">📊</span>
            <span>训练统计</span>
          </button>
        </div>
      </nav>

      <button
        className="menu-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? '✕' : '☰'}
      </button>

      <div className={`mobile-overlay ${isMenuOpen ? 'visible' : ''}`}
        onClick={() => setIsMenuOpen(false)} />

      <div className={`mobile-sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="logo">
          <span className="logo-icon">💪</span>
          <span className="logo-text">健身助手</span>
        </div>
        <div className="nav-links">
          <button
            className={`nav-btn ${currentPage === 'list' ? 'active' : ''}`}
            onClick={() => navigateTo('list')}
          >
            <span className="nav-icon">📋</span>
            <span>训练计划</span>
          </button>
          <button
            className={`nav-btn ${currentPage === 'progress' ? 'active' : ''}`}
            onClick={() => navigateTo('progress')}
          >
            <span className="nav-icon">📊</span>
            <span>训练统计</span>
          </button>
        </div>
      </div>

      <main className="main-content">
        {currentPage === 'list' && (
          <WorkoutList onSelectWorkout={(id) => navigateTo('detail', id)} />
        )}
        {currentPage === 'detail' && selectedWorkoutId && (
          <WorkoutDetail
            workoutId={selectedWorkoutId}
            onBack={() => navigateTo('list')}
          />
        )}
        {currentPage === 'progress' && <ProgressChart />}
      </main>
    </div>
  )
}

export default App
