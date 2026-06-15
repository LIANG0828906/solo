import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '@/store'
import ScrollToast from '@/components/ScrollToast'
import { ArrowLeft } from 'lucide-react'

const api = axios.create({ timeout: 5000 })

export default function Touhu() {
  const { currentUser, userRole } = useAuthStore()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [shots, setShots] = useState<(boolean | null)[]>(Array(10).fill(null))
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
      const size = Math.min(canvas.parentElement!.offsetWidth, 360)
      canvas.style.width = size + 'px'
      canvas.style.height = size + 'px'
      canvas.width = size * dpr
      canvas.height = size * dpr
      ctx.scale(dpr, dpr)

      const cx = size / 2
      const potTop = size * 0.25
      const potBottom = size * 0.8
      const potTopW = size * 0.25
      const potBottomW = size * 0.3

      ctx.clearRect(0, 0, size, size)

      const potGrad = ctx.createLinearGradient(cx - potBottomW, potTop, cx + potBottomW, potBottom)
      potGrad.addColorStop(0, '#CD7F32')
      potGrad.addColorStop(0.5, '#8B6914')
      potGrad.addColorStop(1, '#CD7F32')

      ctx.beginPath()
      ctx.moveTo(cx - potTopW, potTop)
      ctx.lineTo(cx - potBottomW, potBottom)
      ctx.lineTo(cx + potBottomW, potBottom)
      ctx.lineTo(cx + potTopW, potTop)
      ctx.closePath()
      ctx.fillStyle = potGrad
      ctx.fill()
      ctx.strokeStyle = '#5C3A28'
      ctx.lineWidth = 2
      ctx.stroke()

      const cloudPositions = [
        { x: cx - 18, y: (potTop + potBottom) * 0.42 },
        { x: cx + 14, y: (potTop + potBottom) * 0.52 },
        { x: cx - 8, y: (potTop + potBottom) * 0.62 },
        { x: cx + 20, y: (potTop + potBottom) * 0.38 },
        { x: cx, y: (potTop + potBottom) * 0.55 },
      ]

      cloudPositions.forEach(({ x, y }) => {
        ctx.fillStyle = 'rgba(100,149,237,0.5)'
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x - 6, y + 2, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x + 6, y + 2, 5, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.beginPath()
      ctx.ellipse(cx, potTop, potTopW + 4, 8, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#8B6914'
      ctx.fill()
      ctx.strokeStyle = '#5C3A28'
      ctx.lineWidth = 1.5
      ctx.stroke()

      const t = Date.now() / 1000
      const mouthAlpha = 0.5 + 0.5 * Math.sin(t * 3)
      ctx.fillStyle = `rgba(0,0,0,${mouthAlpha * 0.6})`
      ctx.beginPath()
      ctx.ellipse(cx, potTop, potTopW * 0.5, 6, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#8B4513'
      ctx.beginPath()
      ctx.ellipse(cx, potBottom, potBottomW + 6, 8, 0, 0, Math.PI * 2)
      ctx.fill()

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const hits = shots.filter((s) => s === true).length
  const totalScore = hits * 10

  const handleSubmit = async () => {
    if (shots.every((s) => s === null)) return
    setSubmitting(true)
    try {
      await api.post('/api/student/score', {
        studentId: (currentUser as { id: number }).id,
        type: 'touhu',
        score: totalScore,
        detail: JSON.stringify({ shots: shots.map((s) => (s === true ? 1 : s === false ? 0 : 0)) }),
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
      <ScrollToast message="投壶成绩已录入" visible={showToast} />

      <div className="max-w-3xl mx-auto">
        <button
          className="flex items-center gap-2 text-ancient-brown mb-4 hover:text-ancient-red transition-colors"
          onClick={() => navigate('/home')}
        >
          <ArrowLeft size={20} />
          返回
        </button>

        <h1 className="font-title text-2xl md:text-3xl text-ancient-brown tracking-wider mb-6 text-center">
          投壶考核
        </h1>

        <div className="flex justify-center mb-6">
          <div className="rounded-lg border-2 border-gold p-2 bg-ancient-input inline-block">
            <canvas ref={canvasRef} />
          </div>
        </div>

        <div
          className="rounded-lg border-2 border-gold p-6 bg-ancient-input"
          style={{ boxShadow: 'inset 0 2px 8px rgba(74,44,26,0.1)' }}
        >
          <h2 className="font-title text-xl text-ancient-brown mb-4">录入成绩</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {shots.map((shot, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm text-ancient-brown">第{i + 1}矢</span>
                <button
                  className={`px-3 py-1 rounded text-sm border transition-colors ${
                    shot === true
                      ? 'bg-ancient-red text-white border-ancient-red'
                      : shot === false
                      ? 'bg-gray-300 text-gray-600 border-gray-400'
                      : 'bg-ancient-input border-gold text-ancient-brown'
                  }`}
                  onClick={() => {
                    const next = [...shots]
                    if (next[i] === null) next[i] = true
                    else if (next[i] === true) next[i] = false
                    else next[i] = null
                    setShots(next)
                  }}
                >
                  {shot === true ? '中' : shot === false ? '未中' : '待定'}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gold flex items-center justify-between">
            <div>
              <span className="text-ancient-brown">命中：</span>
              <span className="font-title text-xl text-ancient-red">{hits}</span>
              <span className="text-ancient-brown"> / 10</span>
            </div>
            <div>
              <span className="text-ancient-brown">总分：</span>
              <span className="font-title text-2xl text-ancient-red">{totalScore}</span>
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
  )
}
