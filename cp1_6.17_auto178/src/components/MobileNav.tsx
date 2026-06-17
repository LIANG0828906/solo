import { useNavigate, useLocation } from 'react-router-dom'
import { Home, PlusCircle, ShoppingCart } from 'lucide-react'
import { useGroceryStore } from '@/client/GroceryListGenerator'

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: PlusCircle, label: 'Share', path: '/share' },
]

function MobileNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const openDrawer = useGroceryStore((s) => s.openDrawer)
  const itemCount = useGroceryStore((s) => s.items.length)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around h-14">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors"
              style={{ color: active ? '#F4A460' : '#999' }}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}

        <button
          onClick={openDrawer}
          className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[#999] hover:text-[#F4A460] transition-colors"
        >
          <div className="relative">
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span
                className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
                style={{ backgroundColor: '#F4A460' }}
              >
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Grocery</span>
        </button>
      </div>
    </nav>
  )
}

export default MobileNav
