import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import DashboardEditor from './editor/DashboardEditor'
import DashboardPreview from './preview/DashboardPreview'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/editor" replace />} />
        <Route path="/editor" element={<DashboardEditor />} />
        <Route path="/preview" element={<DashboardPreview />} />
        <Route path="*" element={<Navigate to="/editor" replace />} />
      </Routes>
    </Router>
  )
}
