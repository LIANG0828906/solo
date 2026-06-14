import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Lobby } from '@/components/pages/Lobby'
import { Battle } from '@/components/pages/Battle'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/battle" element={<Battle />} />
      </Routes>
    </Router>
  )
}
