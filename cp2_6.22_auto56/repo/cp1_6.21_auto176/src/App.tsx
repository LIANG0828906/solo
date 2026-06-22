import { Routes, Route } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import ContentManager from '@/content/ContentManager'
import CalendarModule from '@/calendar/CalendarModule'
import MaterialsManager from '@/materials/MaterialsManager'

export default function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-16 pb-16 lg:pb-0">
        <Routes>
          <Route path="/" element={<ContentManager />} />
          <Route path="/calendar" element={<CalendarModule />} />
          <Route path="/materials" element={<MaterialsManager />} />
        </Routes>
      </main>
    </div>
  )
}
