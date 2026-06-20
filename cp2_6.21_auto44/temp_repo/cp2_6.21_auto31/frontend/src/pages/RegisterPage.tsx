import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/auth/AuthContext'
import './AuthPages.css'

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    name: '',
    role: 'parent' as 'parent' | 'teacher',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.username || !formData.password || !formData.email || !formData.name) {
      setError('请填写完整信息')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次密码输入不一致')
      return
    }

    try {
      setLoading(true)
      setError('')
      await register({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        name: formData.name,
        role: formData.role,
      })
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">创建账号</h1>
          <p className="auth-subtitle">加入家教平台，开始学习之旅</p>

          {error && <div className="error-message">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>角色</label>
              <div className="role-selector">
                <label className={`role-option ${formData.role === 'parent' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="parent"
                    checked={formData.role === 'parent'}
                    onChange={handleChange}
                  />
                  <span>家长</span>
                </label>
                <label className={`role-option ${formData.role === 'teacher' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={formData.role === 'teacher'}
                    onChange={handleChange}
                  />
                  <span>教师</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>用户名</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="请输入用户名"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>姓名</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="请输入真实姓名"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>邮箱</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="请输入邮箱"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>密码</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="请输入密码"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>确认密码</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="请再次输入密码"
                className="form-input"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <div className="auth-footer">
            已有账号？
            <Link to="/login" className="auth-link">
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
