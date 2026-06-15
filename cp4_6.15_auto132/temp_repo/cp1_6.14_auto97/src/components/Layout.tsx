import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavItem {
  path: string
  label: string
}

const navItems: NavItem[] = [
  { path: '/courses', label: '课程管理' },
  { path: '/question-bank', label: '题库管理' },
  { path: '/paper-generate', label: '组卷中心' },
  { path: '/grading', label: '批改中心' },
  { path: '/analysis', label: '错题分析' },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [showTitle, setShowTitle] = useState(false)

  useEffect(() => {
    setShowTitle(false)
    const timer = setTimeout(() => setShowTitle(true), 50)
    return () => clearTimeout(timer)
  }, [location.pathname])

  const getCurrentPageTitle = () => {
    const item = navItems.find((nav) => nav.path === location.pathname)
    return item?.label || '首页'
  }

  return (
    <div className="min-h-screen bg-lightBg">
      <nav className="bg-primary text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-content mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold">Auto97 智能教育平台</span>
            </div>
            <div className="flex space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                      isActive
                        ? 'bg-white text-primary shadow-md'
                        : 'text-white/90 hover:bg-white/20 hover:text-white'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-content mx-auto px-4 py-8">
        <div
          className={cn(
            'mb-6 transition-all duration-500 ease-out',
            showTitle
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-8'
          )}
        >
          <h1 className="text-3xl font-bold text-darkBlue">
            {getCurrentPageTitle()}
          </h1>
        </div>
        {children}
      </main>
    </div>
  )
}
