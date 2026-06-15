import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { register, type RegisterData } from '@/api'
import { useAppStore } from '@/store'

export default function Register() {
  const navigate = useNavigate()
  const { login: setAuth, addNotification } = useAppStore()
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    nickname: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await register(formData)
      localStorage.setItem('token', response.token)
      setAuth(response.user, response.token)
      addNotification('success', '注册成功，欢迎加入！')
      navigate('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : '注册失败'
      addNotification('error', message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="login-page">
      <div className="glass-card animate-card-unfold">
        <div className="text-center mb-8">
          <h1 className="text-2xl mb-2">创建账号</h1>
          <p className="text-muted">注册新账号开始您的阅读之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="glass-input-wrapper">
            <label className="block text-sm font-medium text-secondary mb-2">
              昵称
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                placeholder="请输入昵称"
                className="glass-input pl-10"
                required
                autoComplete="nickname"
              />
            </div>
          </div>

          <div className="glass-input-wrapper">
            <label className="block text-sm font-medium text-secondary mb-2">
              邮箱地址
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="请输入邮箱"
                className="glass-input pl-10"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="glass-input-wrapper">
            <label className="block text-sm font-medium text-secondary mb-2">
              密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="请输入密码"
                className="glass-input pl-10 pr-10"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full mt-2"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner w-5 h-5" />
                注册中...
              </span>
            ) : (
              '注册'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted">
            已有账号？{' '}
            <Link to="/login" className="text-wood font-medium hover:underline">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
