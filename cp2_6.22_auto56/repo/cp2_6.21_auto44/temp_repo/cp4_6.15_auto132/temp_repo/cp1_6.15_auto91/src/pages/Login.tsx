import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { login, type LoginData } from '@/api'
import { useAppStore } from '@/store'

export default function Login() {
  const navigate = useNavigate()
  const { login: setAuth, addNotification } = useAppStore()
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await login(formData)
      localStorage.setItem('token', response.token)
      setAuth(response.user, response.token)
      addNotification('success', '登录成功，欢迎回来！')
      navigate('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败'
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
          <h1 className="text-2xl mb-2">欢迎回来</h1>
          <p className="text-muted">登录您的账号继续浏览</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
                autoComplete="current-password"
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
                登录中...
              </span>
            ) : (
              '登录'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted">
            还没有账号？{' '}
            <Link to="/register" className="text-wood font-medium hover:underline">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
