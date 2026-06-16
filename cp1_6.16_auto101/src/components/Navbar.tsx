import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, Menu, X, Home } from 'lucide-react'
import './Navbar.css'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }
  
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <BookOpen size={24} className="brand-icon" />
          <span className="brand-text">童书漂流站</span>
        </Link>
        
        <div className="navbar-links">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <Home size={18} />
            <span>首页</span>
          </Link>
        </div>
        
        <button 
          className="menu-toggle" 
          onClick={toggleMenu}
          aria-label="菜单"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {isMenuOpen && (
        <div className="mobile-menu">
          <Link 
            to="/" 
            className={`mobile-nav-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            <Home size={20} />
            <span>首页</span>
          </Link>
        </div>
      )}
    </nav>
  )
}

export default Navbar
