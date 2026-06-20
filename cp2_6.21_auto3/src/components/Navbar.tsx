import { useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
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

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { routeId, routeCode } = useParams()
  const { currentRoute } = useRouteStore()
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    if (!currentRoute) return
    const shareUrl = `${window.location.origin}/join/${currentRoute.code}`
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreateRoute = async () => {
    navigate('/')
    setTimeout(() => {
      const event = new CustomEvent('openCreateModal')
      window.dispatchEvent(event)
    }, 100)
  }

  const handleJoinRoute = async () => {
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
          <span
            className="route-code-badge"
            onClick={(e) => {
              e.stopPropagation()
              copyCode()
            }}
            title={copied ? '已复制分享链接' : '点击复制分享链接'}
          >
            {copied ? '✓ 已复制' : `路线代码: ${currentRoute.code}`}
          </span>
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
