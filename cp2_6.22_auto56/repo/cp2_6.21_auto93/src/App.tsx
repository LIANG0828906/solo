import { Routes, Route, Navigate } from 'react-router-dom'
import CreateActivity from './pages/CreateActivity'
import Room from './pages/Room'
import Dashboard from './pages/Dashboard'

const App = () => {
  return (
    <div className="app-container fade-in">
      <Routes>
        <Route path="/" element={<CreateActivity />} />
        <Route path="/room/:activityId" element={<Room />} />
        <Route path="/dashboard/:activityId" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
