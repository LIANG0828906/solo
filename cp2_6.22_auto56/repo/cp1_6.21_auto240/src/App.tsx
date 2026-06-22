import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import BoardPage from '@/pages/BoardPage'
import StatsPage from '@/pages/StatsPage'

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F1F5F9]">
        <Navbar />
        <Routes>
          <Route path="/" element={<BoardPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </div>
    </Router>
  )
}
