import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import type { Teacher } from '../../shared/types'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const login = useGameStore((s) => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || '登录失败')
      }
      const data = await res.json()
      login(data.user as Teacher)
      navigate('/teacher')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      <div
        className="glass-card w-full max-w-md p-8"
        style={{ backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}
      >
        <h1 className="text-3xl font-bold text-white text-center mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          CardBattle
        </h1>
        <p className="text-white/70 text-center mb-8">教师登录</p>

        {error && (
          <div className="bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-2 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
            style={{ borderRadius: '12px' }}
            required
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
            style={{ borderRadius: '12px' }}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-gradient w-full py-3 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn size={18} />
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
