import { Link, useLocation } from 'react-router-dom'
import { Music, BarChart3, BookOpen, X } from 'lucide-react'
import { useStore } from '@/store/useStore'

export const Sidebar = () => {
  const location = useLocation()
  const courses = useStore(state => state.courses)
  const sidebarOpen = useStore(state => state.sidebarOpen)
  const setSidebarOpen = useStore(state => state.setSidebarOpen)

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 z-40 transform transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ background: 'var(--sidebar-bg)' }}
      >
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center justify-between mb-6 md:hidden">
            <h3 className="text-white font-semibold">菜单</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white/80 hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-6">
            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${
                isActive('/') 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
              }`}
            >
              <BookOpen size={20} />
              <span className="font-medium">课程列表</span>
            </Link>
            
            <Link
              to="/stats"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive('/stats') 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
              }`}
            >
              <BarChart3 size={20} />
              <span className="font-medium">统计面板</span>
            </Link>
          </div>

          <div className="border-t border-white/20 pt-4 flex-1 overflow-y-auto">
            <h4 className="text-white/50 text-xs uppercase tracking-wider mb-3 px-4">我的课程</h4>
            <div className="space-y-1">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  to={`/course/${course.id}`}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive(`/course/${course.id}`)
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                  style={{
                    borderLeft: isActive(`/course/${course.id}`) 
                      ? '3px solid white' 
                      : '3px solid transparent',
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: course.coverColor }}
                  >
                    <Music size={16} className="text-white" />
                  </div>
                  <span className="text-sm font-medium truncate">{course.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
