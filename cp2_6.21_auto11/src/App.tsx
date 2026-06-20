import { Routes, Route, Navigate } from 'react-router-dom'
import CreateEvent from './pages/CreateEvent'
import Scan from './pages/Scan'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Navigate to="/create" replace />} />
        <Route path="/create" element={<CreateEvent />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/scan/:eventId" element={<Scan />} />
        <Route path="/dashboard/:id" element={<Dashboard />} />
      </Routes>
    </div>
  )
}

export default App
