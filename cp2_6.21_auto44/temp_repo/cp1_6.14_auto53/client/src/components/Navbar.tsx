import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { notificationsAPI, Notification } from '../api'
import { formatTimeAgo } from '../utils'
import './Navbar.css'

const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    if (!user) return
    try {
      const data = await notificationsAPI.getNotifications()
      setNotifications(data)
      const unread = await notificationsAPI.getUnreadCount()
      setUnreadCount(unread.count)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await notificationsAPI.markAsRead(notification.id)
        setUnreadCount((prev) => Math.max(0, prev - 1))
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        )
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    }
    setShowNotifications(false)

    if (notification.type === 'new_request' || notification.type === 'request_accepted' || 
        notification.type === 'request_rejected' || notification.type === 'exchange_completed') {
      navigate('/exchange-requests')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_request':
        return '📩'
      case 'request_accepted':
        return '✅'
      case 'request_rejected':
        return '❌'
      case 'exchange_completed':
        return '🎉'
      default:
        return '📢'
    }
  }

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🔄</span>
          <span className="logo-text">闲置交换</span>
        </Link>

        <div className="navbar-actions">
          {user ? (
            <>
              <button
                className="btn btn-primary publish-btn"
                onClick={() => navigate('/publish')}
              >
                <span className="plus-icon">+</span>
                发布物品
              </button>

              <div className="notification-wrapper" ref={dropdownRef}>
                <button
                  className="notification-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="notification-badge">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notification-dropdown scale-in">
                    <div className="notification-header">
                      <h4>消息通知</h4>
                      <button
                        className="mark-all-btn"
                        onClick={async () => {
                          await notificationsAPI.markAllAsRead()
                          setUnreadCount(0)
                          setNotifications((prev) =>
                            prev.map((n) => ({ ...n, read: true }))
                          )
                        }}
                      >
                        全部已读
                      </button>
                    </div>
                    <div className="notification-list">
                      {notifications.length === 0 ? (
                        <div className="notification-empty">暂无消息</div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`notification-item ${!notification.read ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <span className="notification-icon">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="notification-content">
                              <div className="notification-title">
                                {notification.title}
                              </div>
                              <div className="notification-time">
                                {formatTimeAgo(notification.createdAt)}
                              </div>
                            </div>
                            {!notification.read && (
                              <span className="notification-dot" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                className="user-avatar"
                onClick={() => navigate('/profile')}
              >
                <span className="avatar-text">{user.nickname.charAt(0)}</span>
              </button>

              <button className="logout-btn" onClick={handleLogout}>
                退出
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-ghost"
                onClick={() => navigate('/login')}
              >
                登录
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/register')}
              >
                注册
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
