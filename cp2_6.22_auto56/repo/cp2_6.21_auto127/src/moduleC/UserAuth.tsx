import { useState } from 'react'
import { useDocStore } from '../store/useDocStore'
import axios from 'axios'

type AuthMode = 'login' | 'register'

const UserAuth = () => {
  const { user, isAuthenticated, setUser, logout } = useDocStore()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const payload =
        mode === 'login' ? { email, password } : { email, password, name }

      const response = await axios.post(endpoint, payload)

      if (response.data) {
        const { user: userData, token } = response.data
        setUser(userData, token)
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          (mode === 'login' ? '登录失败，请检查邮箱和密码' : '注册失败，请重试')
      )
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  const getInitial = (nameStr: string): string => {
    return nameStr.charAt(0).toUpperCase()
  }

  if (isAuthenticated && user) {
    return (
      <div className="auth-container">
        <div className="user-info">
          <div className="user-avatar">{getInitial(user.name)}</div>
          <div className="user-details">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-tabs">
        <button
          className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
          onClick={() => {
            setMode('login')
            setError('')
          }}
        >
          登录
        </button>
        <button
          className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
          onClick={() => {
            setMode('register')
            setError('')
          }}
        >
          注册
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入用户名"
              required={mode === 'register'}
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">邮箱</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入邮箱"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">密码</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            required
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
        </button>
      </form>
    </div>
  )
}

export default UserAuth
