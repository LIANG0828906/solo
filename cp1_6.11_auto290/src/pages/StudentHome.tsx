import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '@/store'
import { Target, Trophy, Footprints, BarChart3, LogOut } from 'lucide-react'

const api = axios.create({ timeout: 5000 })

interface TrainingPlan {
  id: number
  date: string
  project: string
  content: string
  targetScore: number
}

export default function StudentHome() {
  const { currentUser, userRole, logout } = useAuthStore()
  const navigate = useNavigate()
  const [plans, setPlans] = useState<TrainingPlan[]>([])
  const [trend, setTrend] = useState<{ month: string; rank: number }[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!currentUser || userRole !== 'student') {
      navigate('/')
      return
    }
    fetchPlans()
    fetchTrend()
  }, [currentUser, userRole])

  const fetchPlans = async () => {
    try {
      const res = await api.get('/api/student/training-plans')
      setPlans(res.data)
    } catch {
      // ignore
    }
  }

  const fetchTrend = async () => {
    try {
      const student = currentUser as { id: number }
      const res = await api.get(`/api/student/ranking-trend/${student.id}`)
      setTrend(res.data)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (trend.length === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const padding = 40

    ctx.clearRect(0, 0, w, h)

    ctx.strokeStyle = '#D4AF37'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 4; i++) {
      const y = padding + (h - 2 * padding) * (i / 4)
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(w - padding, y)
      ctx.stroke()
    }

    const maxRank = Math.max(...trend.map((t) => t.rank), 10)
    const minRank = Math.min(...trend.map((t) => t.rank), 1)
    const points = trend.map((t, i) => ({
      x: padding + (i / Math.max(trend.length - 1, 1)) * (w - 2 * padding),
      y: padding + ((t.rank - minRank) / Math.max(maxRank - minRank, 1)) * (h - 2 * padding),
    }))

    ctx.strokeStyle = '#8B0000'
    ctx.lineWidth = 2
    ctx.beginPath()
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()

    points.forEach((p) => {
      ctx.fillStyle = '#8B0000'
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.fillStyle = '#4A2C1A'
    ctx.font = '12px serif'
    ctx.textAlign = 'center'
    trend.forEach((t, i) => {
      const x = padding + (i / Math.max(trend.length - 1, 1)) * (w - 2 * padding)
      ctx.fillText(t.month, x, h - padding + 20)
    })

    ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      const rank = Math.round(minRank + (maxRank - minRank) * (i / 4))
      const y = padding + (h - 2 * padding) * (i / 4)
      ctx.fillText(`第${rank}名`, padding - 8, y + 4)
    }
  }, [trend])

  const projectLabel: Record<string, string> = {
    archery: '射箭',
    touhu: '投壶',
    cuju: '蹴鞠',
    comprehensive: '综合',
  }

  const sortedPlans = [...plans].sort((a, b) => a.date.localeCompare(b.date))
  const now = new Date()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-title text-2xl md:text-3xl text-ancient-brown tracking-wider">
            学子主页
          </h1>
          <button
            className="btn-ancient flex items-center gap-2 text-sm"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            退出
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => navigate('/archery')}
            className="p-4 rounded-lg border-2 border-gold bg-ancient-input hover:bg-amber-50 transition-colors text-center"
          >
            <Target className="mx-auto mb-2 text-ancient-red" size={32} />
            <span className="font-title text-lg text-ancient-brown">射箭考核</span>
          </button>
          <button
            onClick={() => navigate('/touhu')}
            className="p-4 rounded-lg border-2 border-gold bg-ancient-input hover:bg-amber-50 transition-colors text-center"
          >
            <Trophy className="mx-auto mb-2 text-bronze" size={32} />
            <span className="font-title text-lg text-ancient-brown">投壶考核</span>
          </button>
          <button
            onClick={() => navigate('/cuju')}
            className="p-4 rounded-lg border-2 border-gold bg-ancient-input hover:bg-amber-50 transition-colors text-center"
          >
            <Footprints className="mx-auto mb-2 text-blue-700" size={32} />
            <span className="font-title text-lg text-ancient-brown">蹴鞠考核</span>
          </button>
        </div>

        <div className="mb-8">
          <h2 className="font-title text-xl text-ancient-brown mb-4 flex items-center gap-2">
            <BarChart3 size={20} />
            排名趋势（近三月）
          </h2>
          <div
            className="rounded-lg border-2 border-gold p-4 bg-ancient-input"
            style={{ boxShadow: 'inset 0 2px 8px rgba(74,44,26,0.1)' }}
          >
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '200px' }}
            />
          </div>
        </div>

        <div>
          <h2 className="font-title text-xl text-ancient-brown mb-4">本月训练计划</h2>
          <div className="space-y-3">
            {sortedPlans.length === 0 && (
              <p className="text-ancient-brown opacity-60 text-center py-4">暂无训练计划</p>
            )}
            {sortedPlans.map((plan) => {
              const expired = new Date(plan.date) < now
              return (
                <div
                  key={plan.id}
                  className={`rounded-lg border border-gold p-4 bg-ancient-input ${
                    expired ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-title text-ancient-brown">
                      {projectLabel[plan.project] || plan.project}
                    </span>
                    <span className="text-sm text-ancient-brown">{plan.date}</span>
                  </div>
                  <p className="text-sm text-ancient-brown">{plan.content}</p>
                  <p className="text-xs mt-1 text-ancient-red">
                    目标分数：{plan.targetScore}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            className="btn-ancient"
            onClick={() => navigate('/leaderboard')}
          >
            查看排行榜
          </button>
        </div>
      </div>
    </div>
  )
}
