import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import GalleryPanel from '@/components/GalleryPanel'
import AppointmentPanel from '@/components/AppointmentPanel'
import ThreeDPreview from '@/components/ThreeDPreview'
import ToastNotification from '@/components/ToastNotification'
import { useAppStore } from '@/store'
import { wsService } from '@/services/websocket'
import { PawPrint, LogIn, UserPlus, Calendar } from 'lucide-react'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, addNotification } = useAppStore()

  useEffect(() => {
    document.title = '宠尚造型馆'
    wsService.connect()
    const unsub = wsService.onMessage((msg) => {
      addNotification(msg)
    })
    return () => {
      unsub()
    }
  }, [addNotification])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff7e6',
        fontFamily: "'Noto Sans SC', sans-serif",
      }}
    >
      <nav
        className="glass-nav"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e67e22, #f39c12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(230, 126, 34, 0.3)',
            }}
          >
            <PawPrint size={24} color="#fff" fill="#fff" />
          </div>
          <div>
            <div
              className="font-display"
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#2c3e50',
                lineHeight: 1.2,
              }}
            >
              宠尚造型馆
            </div>
            <div style={{ fontSize: 11, color: '#8b6914', letterSpacing: 1 }}>
              PAMPERED PET SALON
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            className="btn-capsule"
            onClick={() => navigate('/login')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              padding: '8px 18px',
            }}
          >
            <LogIn size={14} />
            <span>登录</span>
          </button>
          <button
            className="btn-capsule"
            onClick={() => navigate('/login?tab=register')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              padding: '8px 18px',
            }}
          >
            <UserPlus size={14} />
            <span>注册</span>
          </button>
          <button
            className="btn-capsule"
            onClick={() => {
              if (user) {
              } else {
                navigate('/login')
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              padding: '8px 18px',
            }}
          >
            <Calendar size={14} />
            <span>我的预约</span>
          </button>
        </div>
      </nav>

      <div
        style={{
          flex: 1,
          display: 'flex',
          padding: 24,
          gap: 24,
          overflow: 'hidden',
        }}
      >
        <GalleryPanel />
        <AppointmentPanel />
      </div>

      <ThreeDPreview />
      <ToastNotification />
    </div>
  )
}
