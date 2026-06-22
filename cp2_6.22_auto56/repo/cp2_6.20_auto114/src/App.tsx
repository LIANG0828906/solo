import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import AppointmentDetailPage from '@/pages/AppointmentDetailPage'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/appointment/:id" element={<AppointmentDetailPage />} />
      </Routes>
    </Router>
  )
}
