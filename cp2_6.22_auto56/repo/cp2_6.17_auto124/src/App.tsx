import React, { useState, useEffect } from 'react'
import { BookOpen, BarChart3 } from 'lucide-react'
import { useDiaryStore } from './store/diaryStore'
import { CalendarPanel } from './components/CalendarPanel'
import { DiaryEditor } from './components/DiaryEditor'
import { SearchFilter } from './components/SearchFilter'
import { MoodChart } from './components/MoodChart'
import './styles/global.css'

function App() {
  const { currentPage, setCurrentPage } = useDiaryStore()
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handlePageSwitch = (page: 'diary' | 'report') => {
    if (page === currentPage) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentPage(page)
      setTimeout(() => setIsTransitioning(false), 50)
    }, 300)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="app-logo">
            <span className="logo-icon">📔</span>
            <span className="app-title">EmoDiary</span>
          </div>

          <div className="header-search">
            <SearchFilter />
          </div>

          <nav className="page-nav">
            <button
              className={`nav-btn ${currentPage === 'diary' ? 'active' : ''}`}
              onClick={() => handlePageSwitch('diary')}
            >
              <BookOpen size={18} />
              <span>日记编辑</span>
            </button>
            <button
              className={`nav-btn ${currentPage === 'report' ? 'active' : ''}`}
              onClick={() => handlePageSwitch('report')}
            >
              <BarChart3 size={18} />
              <span>情感报表</span>
            </button>
          </nav>
        </div>
      </header>

      <main className={`app-main ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
        {currentPage === 'diary' ? (
          <div className="diary-page">
            <div className="calendar-sidebar">
              <CalendarPanel />
            </div>
            <div className="editor-main">
              <DiaryEditor />
            </div>
          </div>
        ) : (
          <div className="report-page">
            <MoodChart />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
