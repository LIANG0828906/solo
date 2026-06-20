import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useRouteStore } from '../stores/routeStore'

function CompassIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const { currentRoute } = useRouteStore()
  const [copied, setCopied] = useState(false)

  const copyShareLink = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentRoute) return
    const shareUrl = `${window.location.origin}/join/${currentRoute.code}`
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreateRoute = () => {
    navigate('/')
    setTimeout(() => {
      const event = new CustomEvent('openCreateModal')
      window.dispatchEvent(event)
    }, 100)
  }

  const handleJoinRoute = () => {
    navigate('/')
    setTimeout(() => {
      const event = new CustomEvent('openJoinModal')
      window.dispatchEvent(event)
    }, 100)
  }

  return (
    <nav className="navbar">
      <div className="navbar-left" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
        <CompassIcon />
        <span className="navbar-title">探险追踪</span>
        {currentRoute && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
            <span
              className="route-code-badge"
              title="6位路线分享代码"
            >
              {currentRoute.code}
            </span>
            <button
              onClick={copyShareLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                border: 'none',
                borderRadius: 6,
                background: copied
                  ? '#27ae60'
                  : 'rgba(46, 204, 113, 0.2)',
                color: copied ? '#fff' : '#2ecc71',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease-out',
                borderRight: copied ? 'none' : '1px solid rgba(46, 204, 113, 0.3)',
              }}
              title={copied ? '已复制分享链接' : '复制分享链接到剪贴板'}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? '已复制' : '复制链接'}
            </button>
          </div>
        )}
      </div>
      <div className="navbar-right">
        <button className="nav-btn" onClick={handleCreateRoute}>
          + 创建路线
        </button>
        <button className="nav-btn" onClick={handleJoinRoute}>
          加入路线
        </button>
      </div>
    </nav>
  )
}
