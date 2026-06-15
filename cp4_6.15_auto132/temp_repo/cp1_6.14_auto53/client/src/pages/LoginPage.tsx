import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { validateEmail, validatePassword } from '../utils'
import './AuthPages.css'

interface LoginPageProps {}

const LoginPage: React.FC<LoginPageProps> = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [btnScale, setBtnScale] = useState(false)
  const { login, user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    if (!validateEmail(email)) {
      showToast('请输入有效的邮箱', 'warning')
      return
    }

    if (!password) {
      showToast('请输入密码', 'warning')
      return
    }

    setBtnScale(true)
    setTimeout(() => setBtnScale(false), 150)

    setLoading(true)
    try {
      await login(email, password)
      showToast('登录成功，欢迎回来！', 'success')
      navigate('/')
    } catch (error: any) {
      showToast(error.response?.data?.message || '登录失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card scale-in">
      <div className="auth-header">
          <span className="auth-logo">🔄</span>
          <h1>欢迎回来</h1>
          <p>登录你的账户继续</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className={`form-group ${focusedField === 'email' ? 'focused' : ''}`}>
            <label>邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="请输入邮箱"
              disabled={loading}
            />
            <span className="input-line" />
          </div>

          <div className={`form-group ${focusedField === 'password' ? 'focused' : ''}`}>
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="请输入密码"
              disabled={loading}
            />
            <span className="input-line" />
          </div>

          <button
            type="submit"
            className={`auth-btn ${btnScale ? 'btn-press' : ''}`}
            disabled={loading}
          >
            {loading && <span className="spinner" />}
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="auth-footer">
          还没有账户？ <Link to="/register">立即注册</Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
