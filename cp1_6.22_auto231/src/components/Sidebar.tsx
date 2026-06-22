import { useState, useEffect } from 'react'

interface SidebarProps {
  activePage: string
  onNavigate: (page: string) => void
}

const navItems = [
  { id: 'dashboard', label: '管理面板', icon: '📊' },
  { id: 'animals', label: '动物档案', icon: '🐾' },
  { id: 'applications', label: '申请审核', icon: '📝' },
  { id: 'followups', label: '回访记录', icon: '💬' }
]

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isMobile) {
    return (
      <nav style={mobileNavStyle}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              ...mobileNavItem,
              ...(activePage === item.id ? mobileNavItemActive : {})
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span style={{ fontSize: '11px', marginTop: '4px' }}>{item.label}</span>
          </button>
        ))}
      </nav>
    )
  }

  return (
    <aside style={sidebarStyle}>
      <div style={logoStyle}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
          <circle cx="12" cy="12" r="2" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="16" cy="8" r="1.5" />
          <circle cx="7" cy="14" r="1.5" />
          <circle cx="17" cy="14" r="1.5" />
        </svg>
        <span style={logoTextStyle}>PawCare</span>
      </div>

      <nav style={navStyle}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              ...navItemStyle,
              ...(activePage === item.id ? navItemActiveStyle : {})
            }}
          >
            <span style={{ fontSize: '18px', width: '24px' }}>{item.icon}</span>
            <span style={{ marginLeft: '12px' }}>{item.label}</span>
          </button>
        ))}
      </nav>

      <div style={footerStyle}>
        <span style={{ fontSize: '12px', color: '#64748B' }}>
          © 2025 PawCare 收容所
        </span>
      </div>
    </aside>
  )
}

const sidebarStyle: React.CSSProperties = {
  width: '260px',
  backgroundColor: '#1E293B',
  color: '#F1F5F9',
  display: 'flex',
  flexDirection: 'column',
  position: 'fixed',
  left: 0,
  top: 0,
  bottom: 0,
  zIndex: 100
}

const logoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '24px 20px',
  borderBottom: '1px solid #334155'
}

const logoTextStyle: React.CSSProperties = {
  marginLeft: '12px',
  fontSize: '20px',
  fontWeight: 700,
  color: '#F8FAFC'
}

const navStyle: React.CSSProperties = {
  flex: 1,
  padding: '16px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
}

const navItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '8px',
  color: '#94A3B8',
  fontSize: '14px',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.3s ease',
  position: 'relative'
}

const navItemActiveStyle: React.CSSProperties = {
  backgroundColor: '#334155',
  color: '#F1F5F9',
  fontWeight: 500
}

const footerStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderTop: '1px solid #334155',
  textAlign: 'center'
}

const mobileNavStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '#1E293B',
  display: 'flex',
  justifyContent: 'space-around',
  padding: '8px 0',
  paddingBottom: 'env(safe-area-inset-bottom, 8px)',
  zIndex: 100,
  boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
}

const mobileNavItem: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '8px 16px',
  backgroundColor: 'transparent',
  border: 'none',
  color: '#94A3B8',
  cursor: 'pointer',
  borderRadius: '8px',
  transition: 'all 0.3s ease'
}

const mobileNavItemActive: React.CSSProperties = {
  color: '#3B82F6'
}
