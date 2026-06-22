import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PawPrint, Mail, Lock, User, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/store'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login'
  const [tab, setTab] = useState(initialTab)
  const { setUser } = useAppStore()

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.email && form.password) {
      setUser({
        id: 'user_' + Date.now(),
        name: form.name || form.email.split('@')[0],
        email: form.email,
      })
      navigate('/')
    }
  }

  const isLogin = tab === 'login'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fff7e6 0%, #ffe8cc 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
        }}
        onClick={() => navigate('/')}
      >
        <ArrowLeft size={20} color="#e67e22" />
        <span style={{ fontSize: 14, color: '#e67e22', fontWeight: 500 }}>返回首页</span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 40,
          right: 60,
          fontSize: 80,
          opacity: 0.1,
        }}
      >
        🐾
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 80,
          fontSize: 60,
          opacity: 0.1,
        }}
      >
        🐶
      </div>
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 100,
          fontSize: 50,
          opacity: 0.08,
        }}
      >
        ✨
      </div>

      <div
        style={{
          width: 420,
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(230, 126, 34, 0.15)',
          padding: '48px 40px',
          animation: 'scaleIn 0.4s ease-out',
          border: '1px solid #f5e6cc',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e67e22, #f39c12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 6px 20px rgba(230, 126, 34, 0.3)',
            }}
          >
            <PawPrint size={32} color="#fff" fill="#fff" />
          </div>
          <h1
            className="font-display"
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: '#2c3e50',
              marginBottom: 6,
            }}
          >
            宠尚造型馆
          </h1>
          <p style={{ fontSize: 13, color: '#888' }}>
            {isLogin ? '欢迎回来，让爱宠焕然一新' : '立即注册，开启宠物时尚之旅'}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            background: '#fff7e6',
            borderRadius: 12,
            padding: 4,
            marginBottom: 28,
          }}
        >
          <button
            onClick={() => setTab('login')}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              borderRadius: 8,
              background: isLogin ? 'linear-gradient(135deg, #e67e22, #f39c12)' : 'transparent',
              color: isLogin ? '#fff' : '#888',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: "'Noto Sans SC', sans-serif",
            }}
          >
            登录
          </button>
          <button
            onClick={() => setTab('register')}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              borderRadius: 8,
              background: !isLogin ? 'linear-gradient(135deg, #e67e22, #f39c12)' : 'transparent',
              color: !isLogin ? '#fff' : '#888',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: "'Noto Sans SC', sans-serif",
            }}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#666', marginBottom: 6, display: 'block' }}>
                昵称
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #e8ddd0',
                  borderRadius: 10,
                  padding: '10px 14px',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = '#e67e22')
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = '#e8ddd0')
                }
              >
                <User size={18} color="#e67e22" />
                <input
                  type="text"
                  placeholder="请输入昵称"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    marginLeft: 10,
                    fontSize: 14,
                    fontFamily: "'Noto Sans SC', sans-serif",
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: '#666', marginBottom: 6, display: 'block' }}>
              邮箱
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #e8ddd0',
                borderRadius: 10,
                padding: '10px 14px',
              }}
            >
              <Mail size={18} color="#e67e22" />
              <input
                type="email"
                placeholder="请输入邮箱"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  marginLeft: 10,
                  fontSize: 14,
                  fontFamily: "'Noto Sans SC', sans-serif",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, color: '#666', marginBottom: 6, display: 'block' }}>
              密码
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #e8ddd0',
                borderRadius: 10,
                padding: '10px 14px',
              }}
            >
              <Lock size={18} color="#e67e22" />
              <input
                type="password"
                placeholder="请输入密码"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  marginLeft: 10,
                  fontSize: 14,
                  fontFamily: "'Noto Sans SC', sans-serif",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-capsule"
            style={{
              width: '100%',
              padding: '14px 0',
              fontSize: 15,
              borderRadius: 12,
              fontWeight: 600,
            }}
          >
            {isLogin ? '立即登录' : '立即注册'}
          </button>
        </form>

        {isLogin && (
          <p
            style={{
              textAlign: 'center',
              marginTop: 20,
              fontSize: 12,
              color: '#aaa',
            }}
          >
            登录即表示同意《用户协议》和《隐私政策》
          </p>
        )}
      </div>
    </div>
  )
}
