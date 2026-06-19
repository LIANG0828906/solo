import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import ActivityList from '@/pages/ActivityList'
import CreateActivity from '@/pages/CreateActivity'
import ActivityDetail from '@/pages/ActivityDetail'
import CheckIn from '@/pages/CheckIn'

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <Navbar />
        <main className="fade-in">
          <Routes>
            <Route path="/" element={<ActivityList />} />
            <Route path="/create" element={<CreateActivity />} />
            <Route path="/activity/:id" element={<ActivityDetail />} />
            <Route path="/checkin/:activityId" element={<CheckIn />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
