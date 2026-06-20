import { useState, useEffect } from 'react'
import { User, Coupon } from './types'
import { api } from './api'
import ActivityManager from './pages/ActivityManager'
import UserDashboard from './pages/UserDashboard'

type Page = 'activities' | 'dashboard'

interface ToastNotification {
  id: string
  coupon: Coupon
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('activities')
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [notifications, setNotifications] = useState<ToastNotification[]>([])

  useEffect(() => {
    api.getUsers().then(data => {
      setUsers(data)
      if (data.length > 0) {
        setCurrentUser(data[0])
      }
    })
  }, [])

  useEffect(() => {
    if (!currentUser) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'register', userId: currentUser.id }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'new_coupon' && data.coupon) {
        const notification: ToastNotification = {
          id: `${Date.now()}-${Math.random()}`,
          coupon: data.coupon
        }
        setNotifications(prev => [...prev, notification])
        
        playDingSound()

        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id))
        }, 3400)
      }
    }

    return () => {
      ws.close()
    }
  }, [currentUser])

  const playDingSound = () => {
    try {
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext
      const audioContext = new AudioCtx()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.15)

      setTimeout(() => {
        const osc2 = audioContext.createOscillator()
        const gain2 = audioContext.createGain()
        osc2.connect(gain2)
        gain2.connect(audioContext.destination)
        osc2.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1)
        osc2.type = 'sine'
        gain2.gain.setValueAtTime(0.08, audioContext.currentTime + 0.1)
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        osc2.start(audioContext.currentTime + 0.1)
        osc2.stop(audioContext.currentTime + 0.3)
      }, 100)
    } catch (e) {
      console.warn('Audio not supported')
    }
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">🛒</div>
          <h1 className="app-title">促销管理系统</h1>
        </div>
        
        <nav className="nav-menu">
          <button
            className={`nav-item ${currentPage === 'activities' ? 'active' : ''}`}
            onClick={() => setCurrentPage('activities')}
          >
            <span className="nav-icon">📋</span>
            <span>活动管理</span>
          </button>
          <button
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span>用户仪表盘</span>
          </button>
        </nav>

        {currentPage === 'dashboard' && users.length > 0 && (
          <div className="user-switcher">
            <div className="switcher-label">切换用户</div>
            <div className="user-list">
              {users.map(user => (
                <button
                  key={user.id}
                  className={`user-btn ${currentUser?.id === user.id ? 'active' : ''}`}
                  onClick={() => setCurrentUser(user)}
                >
                  <span className="user-avatar">{user.avatar}</span>
                  <span>{user.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      <main className="main-content">
        {currentPage === 'activities' && <ActivityManager />}
        {currentPage === 'dashboard' && currentUser && (
          <UserDashboard user={currentUser} />
        )}
      </main>

      <div className="notification-container">
        {notifications.map(notification => (
          <div key={notification.id} className="notification-toast">
            <div className="notification-icon">🎉</div>
            <div className="notification-content">
              <div className="notification-title">恭喜！</div>
              <div className="notification-text">
                您获得了一张「{notification.coupon.activityName}」优惠券
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
