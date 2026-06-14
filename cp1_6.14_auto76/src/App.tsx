import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { useState } from 'react'
import CourseList from './pages/admin/CourseList'
import TeamHeatmap from './pages/admin/TeamHeatmap'
import MyCourses from './pages/employee/MyCourses'
import Quiz from './pages/employee/Quiz'
import SkillRadar from './pages/employee/SkillRadar'

export const DEFAULT_EMPLOYEE_ID = 'default'
export const DEFAULT_EMPLOYEE = {
  id: DEFAULT_EMPLOYEE_ID,
  name: '演示用户',
  email: 'demo@company.com',
  team: '技术研发部',
  avatar: '🧑‍💼',
  enrollments: [] as any[]
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <div className="app">
      <nav className="nav glass">
        <div className="nav-brand">
          <i className="fa fa-graduation-cap" />
          <span>企业内训管理系统</span>
        </div>
        <div className="nav-links">
          {isAdmin ? (
            <>
              <Link to="/admin/courses" className={`nav-link ${location.pathname.includes('/admin/courses') ? 'active' : ''}`}>
                <i className="fa fa-book" /> 课程管理
              </Link>
              <Link to="/admin/heatmap" className={`nav-link ${location.pathname.includes('/admin/heatmap') ? 'active' : ''}`}>
                <i className="fa fa-fire" /> 团队能力热力图
              </Link>
              <Link to="/employee/courses" className="nav-link">
                <i className="fa fa-user" /> 切换到员工端
              </Link>
            </>
          ) : (
            <>
              <Link to="/employee/courses" className={`nav-link ${location.pathname.includes('/employee/courses') ? 'active' : ''}`}>
                <i className="fa fa-list" /> 我的课程
              </Link>
              <Link to="/employee/radar" className={`nav-link ${location.pathname.includes('/employee/radar') ? 'active' : ''}`}>
                <i className="fa fa-chart-area" /> 能力雷达图
              </Link>
              <Link to="/admin/courses" className="nav-link">
                <i className="fa fa-cog" /> 切换到管理端
              </Link>
            </>
          )}
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  )
}

export default function App() {
  const [employee] = useState(DEFAULT_EMPLOYEE)

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/employee/courses" replace />} />
        <Route path="/admin/courses" element={<CourseList />} />
        <Route path="/admin/heatmap" element={<TeamHeatmap />} />
        <Route path="/employee/courses" element={<MyCourses employee={employee} />} />
        <Route path="/employee/quiz/:courseId" element={<Quiz employee={employee} />} />
        <Route path="/employee/radar" element={<SkillRadar employee={employee} />} />
      </Routes>
    </Layout>
  )
}
