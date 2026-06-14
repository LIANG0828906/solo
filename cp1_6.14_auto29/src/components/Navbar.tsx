// 顶部导航栏组件，被 Dashboard 和 Exchange 页面共用
// 毛玻璃效果，左侧标题，右侧导航链接，当前页高亮
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-white/70 border-b border-white/30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-primary">环保积分平台</span>
          </div>
          <div className="flex items-center gap-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 rounded-lg font-medium transition-all duration-300',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                )
              }
            >
              仪表板
            </NavLink>
            <NavLink
              to="/exchange"
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 rounded-lg font-medium transition-all duration-300',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                )
              }
            >
              积分兑换
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  )
}
