import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, UserPlus } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(username, email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-136px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#4ECDC4]/20 text-[#4ECDC4] mb-4">
            <BookOpen size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#3E2723]">加入书旅驿站</h1>
          <p className="text-gray-500 mt-2">创建账号，开始记录你的阅读旅程</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#3E2723] mb-1.5">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-[#FAFAFA] text-[#3E2723] placeholder-gray-400 transition-colors"
              placeholder="请输入用户名"
              minLength={2}
              maxLength={20}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3E2723] mb-1.5">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-[#FAFAFA] text-[#3E2723] placeholder-gray-400 transition-colors"
              placeholder="请输入邮箱"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3E2723] mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-[#FAFAFA] text-[#3E2723] placeholder-gray-400 transition-colors"
              placeholder="请输入密码（至少6位）"
              minLength={6}
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#4ECDC4] text-[#3E2723] font-semibold rounded-lg hover:bg-[#3DB9B0] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            <UserPlus size={20} />
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          已有账号？{' '}
          <Link to="/login" className="text-[#4ECDC4] font-medium hover:underline">
            立即登录
          </Link>
        </div>
      </div>
    </div>
  )
}
