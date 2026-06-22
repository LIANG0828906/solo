import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, authApi } from '../api'

interface LoginProps {
  setUser: (user: User) => void
}

function Login({ setUser }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError('请填写用户名和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await authApi.login({ username, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      navigate('/')
    } catch (err: any) {
      const msg = err.response?.data?.message || '登录失败，请重试'
      setError(msg)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: `
        radial-gradient(ellipse at 20% 20%, rgba(212, 167, 106, 0.3) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, rgba(139, 111, 71, 0.25) 0%, transparent 50%),
        linear-gradient(135deg, var(--cream) 0%, var(--light-beige) 50%, var(--cream-dark) 100%)
      `
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '48px 40px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        border: '1px solid var(--glass-border)',
        animation: 'scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>🏠</div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--warm-brown) 0%, var(--warm-coffee) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '6px'
          }}>
            旧物新语
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            让每件旧物带着故事继续温暖
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label className="label">用户名</label>
            <input
              className="input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label className="label">密码</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(245, 108, 108, 0.1)',
              border: '1px solid rgba(245, 108, 108, 0.25)',
              borderRadius: '10px',
              color: '#F56C6C',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '28px',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          还没有账号？
          <Link to="/register" style={{
            color: 'var(--warm-coffee)',
            fontWeight: 600,
            textDecoration: 'none',
            marginLeft: '4px'
          }}>
            立即注册
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
