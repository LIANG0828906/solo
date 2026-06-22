import { Routes, Route } from 'react-router-dom'
import ReplayList from '@/pages/ReplayList'
import ReplayPlayer from '@/pages/ReplayPlayer'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ReplayList />} />
      <Route path="/replay/:id" element={<ReplayPlayer />} />
    </Routes>
  )
}
