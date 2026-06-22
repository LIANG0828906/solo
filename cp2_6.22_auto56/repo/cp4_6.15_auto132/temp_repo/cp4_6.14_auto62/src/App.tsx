import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import JobsPage from '@/pages/JobsPage'
import ResumesPage from '@/pages/ResumesPage'
import InterviewsPage from '@/pages/InterviewsPage'
import KanbanPage from '@/pages/KanbanPage'
import { useAppStore } from '@/store'

function AppLayout() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)

  return (
    <div className="flex h-screen flex-col bg-[#f8fafc]">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/resumes" element={<ResumesPage />} />
            <Route path="/interviews" element={<InterviewsPage />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="*" element={<Navigate to="/jobs" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  )
}
