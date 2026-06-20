import { Link, useLocation } from 'react-router-dom'

export function Header() {
  const location = useLocation()
  const isDetailPage = location.pathname.startsWith('/plant/')

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" fill="#5B8C5A" fillOpacity="0.15" />
            <path d="M16 26 V14" stroke="#5B8C5A" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="16" cy="11" rx="5" ry="7" fill="#81C784" />
            <path d="M11 12 Q7 8 11 4 Q14 8 16 12" fill="#66BB6A" />
            <path d="M21 12 Q25 8 21 4 Q18 8 16 12" fill="#66BB6A" />
          </svg>
          <span className="header-title">GrowLog</span>
        </Link>
        {isDetailPage && (
          <Link to="/" className="header-back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5B8C5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12 H5" />
              <path d="M12 19 L5 12 L12 5" />
            </svg>
            <span>返回花园</span>
          </Link>
        )}
      </div>
    </header>
  )
}
