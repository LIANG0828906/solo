import React, { Suspense, lazy, useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from './modules/layout/Sidebar'
import { NotificationBar } from './modules/layout/NotificationBar'
import { ProjectList } from './modules/projectManager/ProjectList'
import { SkeletonLoader } from './modules/layout/SkeletonLoader'

const ProjectDetail = lazy(() =>
  import('./modules/projectManager/ProjectDetail').then((m) => ({
    default: m.ProjectDetail,
  }))
)

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <BrowserRouter>
      <div className="app-layout">
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <NotificationBar />

        <main className="main-content">
          <Suspense fallback={<SkeletonLoader count={2} />}>
            <Routes>
              <Route path="/" element={<ProjectList />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
