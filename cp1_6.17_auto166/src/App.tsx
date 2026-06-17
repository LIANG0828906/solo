import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import WorksManager from '@/components/WorksManager'
import ExhibitionHall from '@/components/ExhibitionHall'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WorksManager />} />
        <Route path="/exhibition/:id" element={<ExhibitionHall />} />
      </Routes>
    </Router>
  )
}
