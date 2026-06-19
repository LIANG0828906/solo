import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, BookOpen, CheckSquare, MessageSquare, Award, List } from 'lucide-react'
import { useStore } from '@/store/index'

const navItems = [
  { path: '/', label: '首页', icon: BookOpen },
  { path: '/checkin', label: '打卡', icon: CheckSquare },
  { path: '/reviews', label: '书评', icon: MessageSquare },
  { path: '/achievements', label: '成就', icon: Award },
  { path: '/booklists', label: '书单', icon: List },
]

export default function Navbar() {
  const location = useLocation()
  const { mobileMenuOpen, setMobileMenuOpen } = useStore()
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)
  const closeMobileMenu = () => setMobileMenuOpen(false)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const navContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const activeIndex = navItems.findIndex((item) => item.path === location.pathname)
    if (activeIndex !== -1 && navRefs.current[activeIndex]) {
      const el = navRefs.current[activeIndex]!
      const container = navContainerRef.current
      if (container) {
        const containerRect = container.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        setIndicator({
          left: elRect.left - containerRect.left,
          width: elRect.width,
        })
      }
    }
  }, [location.pathname])

  useEffect(() => {
    const handleResize = () => {
      const activeIndex = navItems.findIndex((item) => item.path === location.pathname)
      if (activeIndex !== -1 && navRefs.current[activeIndex]) {
        const el = navRefs.current[activeIndex]!
        const container = navContainerRef.current
        if (container) {
          const containerRect = container.getBoundingClientRect()
          const elRect = el.getBoundingClientRect()
          setIndicator({
            left: elRect.left - containerRect.left,
            width: elRect.width,
          })
        }
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [location.pathname])

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-cream-dark/50" style={{ backgroundColor: 'rgba(255,248,231,0.8)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif text-xl text-text flex items-center gap-2 shrink-0">
          📚 读书俱乐部
        </Link>

        <div ref={navContainerRef} className="hidden md:flex relative items-center gap-1 h-full">
          {navItems.map((item, i) => (
            <Link
              key={item.path}
              ref={(el) => { navRefs.current[i] = el }}
              to={item.path}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                location.pathname === item.path ? 'text-orange' : 'text-text-light hover:text-text'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div
            className="absolute bottom-0 h-0.5 bg-orange rounded-full transition-all duration-300 ease-out"
            style={{ left: indicator.left, width: indicator.width }}
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-orange flex items-center justify-center text-white text-xs font-serif">
            U
          </div>
          <button className="md:hidden text-text" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-cream-dark/50 animate-fade-in" style={{ backgroundColor: 'rgba(255,248,231,0.95)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                location.pathname === item.path
                  ? 'text-orange bg-orange/10'
                  : 'text-text-light hover:text-text hover:bg-cream-dark/30'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
