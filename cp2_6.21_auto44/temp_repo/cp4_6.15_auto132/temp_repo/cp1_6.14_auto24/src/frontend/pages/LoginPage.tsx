import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, login, register, loading: authLoading } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('请填写用户名和密码')
      return
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码至少6位')
      return
    }

    setLoading(true)

    try {
      if (mode === 'login') {
        await login(username.trim(), password)
      } else {
        await register(username.trim(), password)
      }
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || (mode === 'login' ? '登录失败' : '注册失败'))
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-brown font-serif text-xl">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-8">
      <div
        className="w-full max-w-md rounded-3xl p-8"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          boxShadow: '0 16px 64px rgba(92, 64, 51, 0.15)',
        }}
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="font-serif font-bold text-3xl text-brown mb-2">
            书漂流
          </h1>
          <p className="text-brown-light text-sm">
            让闲置的书开始一段新的旅程
          </p>
        </div>

        <div className="flex rounded-xl bg-cream-dark/50 p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              mode === 'login'
                ? 'bg-white text-brown shadow-sm'
                : 'text-brown-light hover:text-brown'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              mode === 'register'
                ? 'bg-white text-brown shadow-sm'
                : 'text-brown-light hover:text-brown'
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-brown font-medium mb-2 text-sm">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              className="w-full px-4 py-3 border border-brown/20 rounded-xl bg-white text-brown placeholder-brown-light focus:outline-none focus:border-brown transition-colors"
            />
          </div>

          <div>
            <label className="block text-brown font-medium mb-2 text-sm">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码（至少6位）"
              className="w-full px-4 py-3 border border-brown/20 rounded-xl bg-white text-brown placeholder-brown-light focus:outline-none focus:border-brown transition-colors"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-brown font-medium mb-2 text-sm">
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                className="w-full px-4 py-3 border border-brown/20 rounded-xl bg-white text-brown placeholder-brown-light focus:outline-none focus:border-brown transition-colors"
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-marker-red/10 text-marker-red rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brown text-cream rounded-xl font-medium hover:bg-brown-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-brown/10">
          <p className="text-center text-xs text-brown-light mb-2">
            测试账号
          </p>
          <div className="text-center text-xs text-brown/70 space-y-1">
            <p>书虫小明 / 123456</p>
            <p>爱读书的猫 / 123456</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
