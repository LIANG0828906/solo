import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Shelf from '@/components/Shelf'
import ReadingTimer from '@/components/ReadingTimer'
import Calendar from '@/components/Calendar'
import { BookOpen, Timer, CalendarDays } from 'lucide-react'

function BottomNav() {
  const location = useLocation()
  const items = [
    { path: '/', icon: BookOpen, label: '书架' },
    { path: '/reading', icon: Timer, label: '阅读' },
    { path: '/calendar', icon: CalendarDays, label: '日历' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-blue-100 z-50 shadow-[0_-2px_10px_rgba(74,144,217,0.08)]">
      <div className="max-w-5xl mx-auto flex justify-around items-center h-14">
        {items.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path
          return (
            <a
              key={path}
              href={path}
              className={`flex flex-col items-center gap-0.5 text-xs transition-colors duration-200 ${
                active
                  ? 'text-blue-500 font-semibold'
                  : 'text-gray-400 hover:text-blue-400'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span>{label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="pb-16">
          <Routes>
            <Route path="/" element={<Shelf />} />
            <Route path="/reading" element={<ReadingTimer />} />
            <Route path="/calendar" element={<Calendar />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </Router>
  )
}
