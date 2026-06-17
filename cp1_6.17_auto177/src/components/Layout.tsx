import React from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Palette, Image as ImageIcon } from 'lucide-react'

const navStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: 60,
  background: '#1A1A2E',
  color: '#EDF2F4',
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  padding: '0 28px',
  boxShadow: '0 2px 18px rgba(26,26,46,0.25)',
}

const brandStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: 0.3,
  color: '#fff',
  marginRight: 36,
}

const linksWrap: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flex: 1,
}

export const linkBtn = (active: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 500,
  color: active ? '#fff' : 'rgba(237,242,244,0.7)',
  background: active ? 'rgba(74,144,217,0.22)' : 'transparent',
  transition: 'all .18s ease',
})

export const Layout: React.FC = () => {
  const loc = useLocation()
  const isCanvas = loc.pathname.startsWith('/canvas') || loc.pathname === '/'
  const isGallery = loc.pathname.startsWith('/gallery')

  return (
    <>
      <nav style={navStyle}>
        <NavLink to="/canvas" style={brandStyle}>
          <Palette size={22} color="#4A90D9" />
          <span>数字水彩画室</span>
        </NavLink>
        <div style={linksWrap}>
          <NavLink
            to="/canvas"
            style={({ isActive }) => linkBtn(isActive || isCanvas)}
          >
            <Palette size={16} /> 画布
          </NavLink>
          <NavLink
            to="/gallery"
            style={({ isActive }) => linkBtn(isActive || isGallery)}
          >
            <ImageIcon size={16} /> 画廊
          </NavLink>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(237,242,244,0.5)' }}>
          用水彩记录灵感
        </div>
      </nav>
      <Outlet />
    </>
  )
}
