import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import Login from '@/pages/Login'
import StudentHome from '@/pages/StudentHome'
import Archery from '@/pages/Archery'
import Touhu from '@/pages/Touhu'
import Cuju from '@/pages/Cuju'
import Leaderboard from '@/pages/Leaderboard'
import TrainingPlan from '@/pages/TrainingPlan'
import TeacherManage from '@/pages/TeacherManage'
import { BookOpen, Home, Target, Trophy, Footprints, BarChart3, ClipboardList } from 'lucide-react'

function NavBar() {
  const { userRole } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  if (!userRole || location.pathname === '/') return null

  const studentLinks = [
    { path: '/home', label: '主页', icon: Home },
    { path: '/archery', label: '射箭', icon: Target },
    { path: '/touhu', label: '投壶', icon: Trophy },
    { path: '/cuju', label: '蹴鞠', icon: Footprints },
    { path: '/leaderboard', label: '排行', icon: BarChart3 },
  ]

  const teacherLinks = [
    { path: '/teacher', label: '管理', icon: ClipboardList },
    { path: '/training-plan', label: '计划', icon: BookOpen },
    { path: '/leaderboard', label: '排行', icon: BarChart3 },
  ]

  const links = userRole === 'teacher' ? teacherLinks : studentLinks

  return (
    <nav
      className="sticky top-0 z-40 border-b-2 border-gold"
      style={{
        background: 'linear-gradient(90deg, #4A2C1A 0%, #5C3A28 50%, #4A2C1A 100%)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 flex items-center h-12">
        <div className="font-title text-gold text-lg tracking-wider mr-6 flex items-center gap-2">
          <BookOpen size={20} />
          书院体能考核
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {links.map((link) => {
            const Icon = link.icon
            const active = location.pathname === link.path
            return (
              <button
                key={link.path}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-ancient-red text-white'
                    : 'text-ancient-input hover:bg-ancient-brown'
                }`}
                onClick={() => navigate(link.path)}
              >
                <Icon size={14} />
                {link.label}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter')

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('exit')
    }
  }, [location, displayLocation])

  const handleAnimationEnd = () => {
    if (transitionStage === 'exit') {
      setDisplayLocation(location)
      setTransitionStage('enter')
    }
  }

  return (
    <div
      className={transitionStage === 'enter' ? 'fade-enter-active' : 'fade-exit-active'}
      style={{
        opacity: transitionStage === 'enter' ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
      onTransitionEnd={handleAnimationEnd}
    >
      <Routes location={displayLocation}>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<StudentHome />} />
        <Route path="/archery" element={<Archery />} />
        <Route path="/touhu" element={<Touhu />} />
        <Route path="/cuju" element={<Cuju />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/training-plan" element={<TrainingPlan />} />
        <Route path="/teacher" element={<TeacherManage />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <NavBar />
      <AnimatedRoutes />
    </Router>
  )
}
