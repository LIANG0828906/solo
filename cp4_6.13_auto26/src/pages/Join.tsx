import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { AVATARS } from '../../shared/types'

const AVATAR_ANIMATION: Record<number, string> = {
  1: 'avatar-wiggle',
  2: 'avatar-blink',
  3: 'avatar-wag',
  4: 'avatar-bounce',
  5: 'avatar-tilt',
  6: 'avatar-roll',
  7: 'avatar-shake',
  8: 'avatar-flutter',
  9: 'avatar-swing',
  10: 'avatar-waddle',
  11: 'avatar-jump',
  12: 'avatar-dive',
}

export default function Join() {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [avatarId, setAvatarId] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setRoom, addNotification } = useGameStore()

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setCode(val)
  }

  const handleJoin = async () => {
    if (code.length !== 6) {
      setError('请输入6位房间代码')
      return
    }
    if (!name.trim()) {
      setError('请输入你的名称')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatarId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || '加入失败')
      }
      const room = await res.json()
      setRoom(room)
      addNotification('成功加入房间！', 'success')
      navigate(`/game/${room.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加入失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-4">
      <div
        className="glass-card w-full max-w-lg p-8"
        style={{ backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}
      >
        <h1 className="text-3xl font-bold text-white text-center mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          CardBattle
        </h1>
        <p className="text-white/70 text-center mb-6">加入游戏</p>

        {error && (
          <div className="bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-2 mb-4 text-sm" style={{ borderRadius: '12px' }}>
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-white/70 text-sm block mb-1">房间代码</label>
            <input
              value={code}
              onChange={handleCodeChange}
              placeholder="6位大写字母/数字"
              maxLength={6}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white text-center text-2xl tracking-[0.5em] font-bold placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-1">你的名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入昵称"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-2">选择头像</label>
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setAvatarId(avatar.id)}
                  className={`flex flex-col items-center p-2 transition-all duration-300 ${
                    avatarId === avatar.id
                      ? 'bg-white/20 glow-border'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  style={{ borderRadius: '12px' }}
                >
                  <span className={`text-3xl ${AVATAR_ANIMATION[avatar.id]}`}>{avatar.emoji}</span>
                  <span className="text-white/60 text-xs mt-1">{avatar.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleJoin}
            disabled={loading || code.length !== 6 || !name.trim()}
            className="btn-gradient w-full py-3 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ArrowRight size={18} />
            {loading ? '加入中...' : '加入游戏'}
          </button>
        </div>
      </div>
    </div>
  )
}
