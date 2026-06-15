import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '@/store'
import ScrollToast from '@/components/ScrollToast'
import { ArrowLeft } from 'lucide-react'

const api = axios.create({ timeout: 5000 })

export default function Archery() {
  const { currentUser, userRole } = useAuthStore()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [shots, setShots] = useState<number[]>(Array(10).fill(0))
  const [showToast, setShowToast] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!currentUser || userRole !== 'student') {
      navigate('/')
    }
  }, [currentUser, userRole])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const size = Math.min(canvas.parentElement!.offsetWidth, 400)
      canvas.style.width = size + 'px'
      canvas.style.height = size + 'px'
      canvas.width = size * dpr
      canvas.height = size * dpr
      ctx.scale(dpr, dpr)

      const cx = size / 2
      const cy = size / 2
      const maxR = size * 0.42

      ctx.clearRect(0, 0, size, size)

      const ringColors: { from: number; to: number; color: string }[] = [
        { from: 10, to: 9, color: '#FF4500' },
        { from: 8, to: 7, color: '#FFD700' },
        { from: 6, to: 5, color: '#1E90FF' },
        { from: 4, to: 1, color: '#D3D3D3' },
      ]

      for (let ring = 1; ring <= 10; ring++) {
        const r = maxR * ((11 - ring) / 10)
        const ringData = ringColors.find((rc) => ring >= rc.from && ring <= rc.to)
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = ringData ? ringData.color : '#D3D3D3'
        ctx.fill()
        ctx.strokeStyle = '#4A2C1A'
        ctx.lineWidth = 0.8
        ctx.stroke()
      }

      for (let ring = 1; ring <= 10; ring++) {
        const r = maxR * ((11 - ring) / 10)
        if (ring >= 4) {
          ctx.fillStyle = ring <= 6 ? '#FFFFFF' : '#4A2C1A'
          ctx.font = '11px serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(String(ring), cx + r - 12, cy)
        }
      }

      ctx.beginPath()
      ctx.arc(cx, cy, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#8B0000'
      ctx.fill()

      const bowY = size - 30
      ctx.strokeStyle = '#8B4513'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(cx - 40, bowY)
      ctx.quadraticCurveTo(cx - 50, bowY - 40, cx - 35, bowY - 70)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx + 40, bowY)
      ctx.quadraticCurveTo(cx + 50, bowY - 40, cx + 35, bowY - 70)
      ctx.stroke()
      ctx.strokeStyle = '#D4AF37'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx - 35, bowY - 70)
      ctx.lineTo(cx + 35, bowY - 70)
      ctx.stroke()

      const t = Date.now() / 1000
      const arrowAlpha = 0.3 + 0.15 * Math.sin(t * 2)
      ctx.strokeStyle = `rgba(74,44,26,${arrowAlpha})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx, bowY - 70)
      ctx.lineTo(cx, cy + maxR)
      ctx.stroke()

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const totalScore = shots.reduce((a, b) => a + b, 0)

  const handleSubmit = async () => {
    if (shots.every((s) => s === 0)) return
    setSubmitting(true)
    try {
      await api.post('/api/student/score', {
        studentId: (currentUser as { id: number }).id,
        type: 'archery',
        score: totalScore,
        detail: JSON.stringify({ shots }),
      })
      setShowToast(true)
      setTimeout(() => setShowToast(false), 800)
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <ScrollToast message="射箭成绩已录入" visible={showToast} />

      <div className="max-w-5xl mx-auto">
        <button
          className="flex items-center gap-2 text-ancient-brown mb-4 hover:text-ancient-red transition-colors"
          onClick={() => navigate('/home')}
        >
          <ArrowLeft size={20} />
          返回
        </button>

        <h1 className="font-title text-2xl md:text-3xl text-ancient-brown tracking-wider mb-6 text-center">
          射箭考核
        </h1>

        <div className="flex flex-col md:flex-row gap-6 mobile-stack">
          <div className="md:w-1/2 mobile-full flex justify-center">
            <div
              className="rounded-lg border-2 border-gold p-2 bg-ancient-input inline-block"
            >
              <canvas ref={canvasRef} />
            </div>
          </div>

          <div className="md:w-1/2 mobile-full">
            <div
              className="rounded-lg border-2 border-gold p-6 bg-ancient-input"
              style={{ boxShadow: 'inset 0 2px 8px rgba(74,44,26,0.1)' }}
            >
              <h2 className="font-title text-xl text-ancient-brown mb-4">录入成绩</h2>
              <div className="grid grid-cols-2 gap-3">
                {shots.map((shot, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <label className="text-sm text-ancient-brown w-16">第{i + 1}箭</label>
                    <select
                      className="input-ancient flex-1"
                      value={shot}
                      onChange={(e) => {
                        const next = [...shots]
                        next[i] = Number(e.target.value)
                        setShots(next)
                      }}
                    >
                      <option value={0}>未射</option>
                      {Array.from({ length: 10 }, (_, n) => n + 1).map((v) => (
                        <option key={v} value={v}>{v}环</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gold">
                <div className="text-center">
                  <span className="text-ancient-brown">总分：</span>
                  <span className="font-title text-3xl text-ancient-red">{totalScore}</span>
                </div>
              </div>

              <button
                className="btn-ancient w-full mt-4 py-3 font-title text-lg tracking-wider"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? '提交中...' : '提交成绩'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
