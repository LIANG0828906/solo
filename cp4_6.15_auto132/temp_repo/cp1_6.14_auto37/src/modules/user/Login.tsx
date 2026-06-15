import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import request from '../../utils/request'
import { setToken, setUser } from '../../utils/auth'

interface LoginProps {
  onAuthChange: (loggedIn: boolean) => void
}

function Login({ onAuthChange }: LoginProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!username.trim()) {
      newErrors.username = '请输入用户名'
    } else if (username.length < 3 || username.length > 20) {
      newErrors.username = '用户名长度需在3-20个字符之间'
    }

    if (!password) {
      newErrors.password = '请输入密码'
    } else if (password.length < 6) {
      newErrors.password = '密码长度不能少于6位'
    }

    if (activeTab === 'register') {
      if (!confirmPassword) {
        newErrors.confirmPassword = '请确认密码'
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = '两次密码输入不一致'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    try {
      const endpoint = activeTab === 'login' ? '/auth/login' : '/auth/register'
      const data = await request.post(endpoint, { username, password })

      setToken((data as any).token)
      setUser((data as any).user)
      onAuthChange(true)
      navigate('/')
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || '操作失败，请重试' })
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab)
    setErrors({})
    setConfirmPassword('')
  }

  return (
    <div className="auth-container">
      <div className="glass-card auth-card">
        <h2 className="auth-title">
          {activeTab === 'login' ? '欢迎回来' : '加入时间胶囊'}
        </h2>

        <div className="auth-tabs">
          <div
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => switchTab('login')}
          >
            登录
          </div>
          <div
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => switchTab('register')}
          >
            注册
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              disabled={loading}
            />
            {errors.username && <div className="form-error">{errors.username}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              disabled={loading}
            />
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>

          {activeTab === 'register' && (
            <div className="form-group">
              <label className="form-label">确认密码</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                disabled={loading}
              />
              {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
            </div>
          )}

          {errors.submit && (
            <div className="form-error" style={{ textAlign: 'center', marginBottom: '12px' }}>
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            className={`btn btn-primary auth-submit ${loading ? 'btn-disabled' : ''}`}
            disabled={loading}
          >
            {loading ? '处理中...' : activeTab === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div className="auth-footer">
          {activeTab === 'login' ? (
            <>
              还没有账号？
              <span className="auth-footer-link" onClick={() => switchTab('register')}>
                立即注册
              </span>
            </>
          ) : (
            <>
              已有账号？
              <span className="auth-footer-link" onClick={() => switchTab('login')}>
                去登录
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
