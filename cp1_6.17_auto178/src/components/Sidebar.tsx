import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Home, PlusCircle, ShoppingCart } from 'lucide-react'
import { useGroceryStore } from '@/client/GroceryListGenerator'

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: PlusCircle, label: 'Share Recipe', path: '/share' },
]

function Sidebar() {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const openDrawer = useGroceryStore((s) => s.openDrawer)

  return (
    <aside
      className="hidden md:flex flex-col h-screen sticky top-0 border-r border-[#e8ddd0] bg-[#FFF8F0] z-30 overflow-hidden"
      style={{ width: expanded ? 240 : 64, transition: 'width 0.3s ease' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-center w-full h-14 hover:bg-[#F4A460]/10 transition-colors"
      >
        {expanded ? <X size={22} className="text-[#8B4513]" /> : <Menu size={22} className="text-[#8B4513]" />}
      </button>

      <nav className="flex-1 flex flex-col gap-1 px-2 pt-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors"
              style={{
                backgroundColor: active ? '#F4A46020' : 'transparent',
                color: active ? '#F4A460' : '#8B4513',
              }}
            >
              <Icon size={20} className="shrink-0" />
              {expanded && (
                <span className="whitespace-nowrap text-sm font-medium">{label}</span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="px-2 pb-4">
        <button
          onClick={openDrawer}
          className="flex items-center gap-3 w-full px-2 py-2.5 rounded-lg hover:bg-[#F4A460]/10 transition-colors text-[#8B4513]"
        >
          <ShoppingCart size={20} className="shrink-0" />
          {expanded && <span className="whitespace-nowrap text-sm font-medium">Grocery List</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
