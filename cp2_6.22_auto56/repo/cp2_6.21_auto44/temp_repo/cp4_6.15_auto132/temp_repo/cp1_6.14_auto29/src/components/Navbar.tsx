// 顶部导航栏组件，被 Dashboard 和 Exchange 页面共用
// 毛玻璃效果，左侧标题，右侧导航链接，当前页高亮（深绿文字 + 底部绿色下划线）
import { NavLink } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">绿色家园积分平台</span>
          </div>
          <div className="flex items-center gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 font-medium transition-all duration-300 relative',
                  isActive
                    ? 'text-[#2E7D32] after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-[#2E7D32] after:rounded-full'
                    : 'text-gray-500 hover:text-[#2E7D32] hover:after:absolute hover:after:bottom-0 hover:after:left-2 hover:after:right-2 hover:after:h-0.5 hover:after:bg-[#2E7D32]/30 hover:after:rounded-full'
                )
              }
            >
              仪表板
            </NavLink>
            <NavLink
              to="/exchange"
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 font-medium transition-all duration-300 relative',
                  isActive
                    ? 'text-[#2E7D32] after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-[#2E7D32] after:rounded-full'
                    : 'text-gray-500 hover:text-[#2E7D32] hover:after:absolute hover:after:bottom-0 hover:after:left-2 hover:after:right-2 hover:after:h-0.5 hover:after:bg-[#2E7D32]/30 hover:after:rounded-full'
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
