import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProjectList from '@/modules/project/ProjectList'
import ProjectDetail from '@/modules/project/ProjectDetail'
import ActivityFeed from '@/modules/activity/ActivityFeed'
import { useProjectStore } from '@/modules/project/store'
import { useActivityStore } from '@/modules/activity/store'

function AppLayout() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#27AE60] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M3 9L12 3L21 9V21C21 21.5304 20.7893 22.0391 20.4142 22.4142C20.0391 22.7893 19.5304 23 19 23H5C4.46957 23 3.96086 22.7893 3.58579 22.4142C3.21071 22.0391 3 21.5304 3 21V9Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12H15V22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-800">CommSpace</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex gap-8 max-md:flex-col-reverse">
          <div className="flex-1 min-w-0" style={{ minWidth: 600, maxWidth: '100%' }}>
            <Routes>
              <Route path="/" element={<ProjectList />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <ActivityFeed />
        </div>
      </main>
    </div>
  )
}

function App() {
  const initProjects = useProjectStore(s => s.init)
  const initActivities = useActivityStore(s => s.init)

  useEffect(() => {
    initProjects()
    initActivities()
  }, [initProjects, initActivities])

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
