import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import LetterEditor from '@/pages/LetterEditor'
import LetterCalendar from '@/pages/LetterCalendar'

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#1A1A2E] text-[#E0E0E0]">
        <nav
          className="fixed top-0 w-full z-50 border-b border-[#3A3A5E]"
          style={{ background: 'rgba(26,26,46,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <span className="text-lg font-bold bg-gradient-to-r from-[#6C5CE7] to-[#A29BFE] bg-clip-text text-transparent">
              时光慢递
            </span>
            <div className="flex gap-6">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `transition-all duration-300 ease-smooth ${isActive ? 'bg-gradient-to-r from-[#6C5CE7] to-[#A29BFE] bg-clip-text text-transparent underline' : 'text-[#E0E0E0] hover:text-[#A29BFE]'}`
                }
              >
                写信
              </NavLink>
              <NavLink
                to="/calendar"
                className={({ isActive }) =>
                  `transition-all duration-300 ease-smooth ${isActive ? 'bg-gradient-to-r from-[#6C5CE7] to-[#A29BFE] bg-clip-text text-transparent underline' : 'text-[#E0E0E0] hover:text-[#A29BFE]'}`
                }
              >
                日历
              </NavLink>
            </div>
          </div>
        </nav>
        <main className="pt-14">
          <Routes>
            <Route path="/" element={<LetterEditor />} />
            <Route path="/calendar" element={<LetterCalendar />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
