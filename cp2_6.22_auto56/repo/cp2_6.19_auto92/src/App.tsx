import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from '@/plantManager/pages/HomePage'
import PlantDetailPage from '@/plantManager/pages/PlantDetailPage'
import '@/styles/global.css'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/plant/:id" element={<PlantDetailPage />} />
      </Routes>
    </Router>
  )
}
