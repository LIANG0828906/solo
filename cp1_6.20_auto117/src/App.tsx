import { Routes, Route, Link } from 'react-router-dom'
import MeetingList from './pages/MeetingList'
import MeetingDetail from './pages/MeetingDetail'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-900 text-white px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold hover:text-blue-200 transition-colors">
            会议纪要系统
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-blue-200 transition-colors">
              会议列表
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<MeetingList />} />
          <Route path="/meeting/:id" element={<MeetingDetail />} />
        </Routes>
      </main>
    </div>
  )
}
