import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { authAPI } from '../api'
import { validateEmail, validatePassword } from '../utils'
import './AuthPages.css'

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [city, setCity] = useState('')
  const [cities, setCities] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [btnScale, setBtnScale] = useState(false)
  const { register, user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchCities()
  }, [])

  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  const fetchCities = async () => {
    try {
      const data = await authAPI.getCities()
      setCities(data)
    } catch (error) {
      console.error('Failed to fetch cities:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    if (!validateEmail(email)) {
      showToast('请输入有效的邮箱', 'warning')
      return
    }

    if (!validatePassword(password)) {
      showToast('密码至少6位，需包含字母和数字', 'warning')
      return
    }

    if (!nickname.trim()) {
      showToast('请输入昵称', 'warning')
      return
    }

    if (!city) {
      showToast('请选择所在城市', 'warning')
      return
    }

    setBtnScale(true)
    setTimeout(() => setBtnScale(false), 150)

    setLoading(true)
    try {
      await register(email, password, nickname.trim(), city)
      showToast('注册成功，欢迎加入！', 'success')
      navigate('/')
    } catch (error: any) {
      showToast(error.response?.data?.message || '注册失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card scale-in">
        <div className="auth-header">
          <span className="auth-logo">🔄</span>
          <h1>创建账户</h1>
          <p>加入我们开始物品交换之旅</p>
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
              placeholder="至少6位，包含字母和数字"
              disabled={loading}
            />
            <span className="input-line" />
          </div>

          <div className={`form-group ${focusedField === 'nickname' ? 'focused' : ''}`}>
            <label>昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              onFocus={() => setFocusedField('nickname')}
              onBlur={() => setFocusedField(null)}
              placeholder="给自己起个昵称"
              maxLength={20}
              disabled={loading}
            />
            <span className="input-line" />
          </div>

          <div className={`form-group select-group ${focusedField === 'city' ? 'focused' : ''}`}>
            <label>所在城市</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onFocus={() => setFocusedField('city')}
              onBlur={() => setFocusedField(null)}
              disabled={loading}
            >
              <option value="">请选择城市</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="input-line" />
          </div>

          <button
            type="submit"
            className={`auth-btn ${btnScale ? 'btn-press' : ''}`}
            disabled={loading}
          >
            {loading && <span className="spinner" />}
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="auth-footer">
          已有账户？ <Link to="/login">立即登录</Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
