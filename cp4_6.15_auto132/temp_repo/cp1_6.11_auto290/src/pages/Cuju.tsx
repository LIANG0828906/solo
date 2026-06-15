import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '@/store'
import ScrollToast from '@/components/ScrollToast'
import { ArrowLeft } from 'lucide-react'

const api = axios.create({ timeout: 5000 })

interface ShotData {
  power: number
  angle: number
  score: number
}

function calcScore(power: number, angle: number): number {
  const powerFactor = Math.min(power / 100, 1)
  const angleFactor = angle <= 45 ? angle / 45 : (90 - angle) / 45
  return Math.round(powerFactor * angleFactor * 100)
}

export default function Cuju() {
  const { currentUser, userRole } = useAuthStore()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [shotsData, setShotsData] = useState<ShotData[]>(
    Array.from({ length: 5 }, () => ({ power: 50, angle: 45, score: 0 }))
  )
  const [currentShot, setCurrentShot] = useState(0)
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
      const w = Math.min(canvas.parentElement!.offsetWidth, 500)
      const h = 300
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)

      ctx.clearRect(0, 0, w, h)

      const groundY = h * 0.82
      ctx.strokeStyle = '#8B6914'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, groundY)
      ctx.lineTo(w, groundY)
      ctx.stroke()

      ctx.fillStyle = 'rgba(139,105,20,0.08)'
      ctx.fillRect(0, groundY, w, h - groundY)

      const goalL = w * 0.3
      const goalR = w * 0.7
      const goalTop = h * 0.2
      const goalBottom = groundY

      ctx.strokeStyle = '#4A2C1A'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(goalL, goalBottom)
      ctx.lineTo(goalL, goalTop)
      ctx.lineTo(goalR, goalTop)
      ctx.lineTo(goalR, goalBottom)
      ctx.stroke()

      ctx.lineWidth = 2
      ctx.strokeStyle = '#9CA3AF'
      const gridCols = 8
      const gridRows = 6
      for (let i = 1; i < gridCols; i++) {
        const x = goalL + (goalR - goalL) * (i / gridCols)
        ctx.beginPath()
        ctx.moveTo(x, goalTop)
        ctx.lineTo(x, goalBottom)
        ctx.stroke()
      }
      for (let i = 1; i < gridRows; i++) {
        const y = goalTop + (goalBottom - goalTop) * (i / gridRows)
        ctx.beginPath()
        ctx.moveTo(goalL, y)
        ctx.lineTo(goalR, y)
        ctx.stroke()
      }

      const shot = shotsData[currentShot]
      const t = Date.now() / 1000
      const ballX = w * 0.5 + Math.sin(t * 2) * 3
      const ballY = groundY - 12

      ctx.beginPath()
      ctx.arc(ballX, ballY, 10, 0, Math.PI * 2)
      ctx.fillStyle = '#F5F0E1'
      ctx.fill()
      ctx.strokeStyle = '#4A2C1A'
      ctx.lineWidth = 1.5
      ctx.stroke()

      const angleRad = (shot.angle * Math.PI) / 180
      const powerLen = shot.power * 0.6
      const arrowEndX = ballX + Math.cos(angleRad) * powerLen
      const arrowEndY = ballY - Math.sin(angleRad) * powerLen

      ctx.strokeStyle = '#8B0000'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(ballX, ballY)
      ctx.lineTo(arrowEndX, arrowEndY)
      ctx.stroke()
      ctx.setLineDash([])

      const headLen = 8
      const headAngle = Math.atan2(ballY - arrowEndY, arrowEndX - ballX)
      ctx.beginPath()
      ctx.moveTo(arrowEndX, arrowEndY)
      ctx.lineTo(
        arrowEndX - headLen * Math.cos(headAngle - Math.PI / 6),
        arrowEndY + headLen * Math.sin(headAngle - Math.PI / 6)
      )
      ctx.moveTo(arrowEndX, arrowEndY)
      ctx.lineTo(
        arrowEndX - headLen * Math.cos(headAngle + Math.PI / 6),
        arrowEndY + headLen * Math.sin(headAngle + Math.PI / 6)
      )
      ctx.stroke()

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [shotsData, currentShot])

  const updateShot = (index: number, field: 'power' | 'angle', value: number) => {
    const next = [...shotsData]
    next[index] = { ...next[index], [field]: value, score: calcScore(
      field === 'power' ? value : next[index].power,
      field === 'angle' ? value : next[index].angle
    ) }
    setShotsData(next)
  }

  useEffect(() => {
    setShotsData((prev) =>
      prev.map((s) => ({ ...s, score: calcScore(s.power, s.angle) }))
    )
  }, [])

  const totalScore = shotsData.reduce((a, b) => a + b.score, 0)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await api.post('/api/student/score', {
        studentId: (currentUser as { id: number }).id,
        type: 'cuju',
        score: totalScore,
        detail: JSON.stringify({ shots: shotsData }),
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
      <ScrollToast message="蹴鞠成绩已录入" visible={showToast} />

      <div className="max-w-3xl mx-auto">
        <button
          className="flex items-center gap-2 text-ancient-brown mb-4 hover:text-ancient-red transition-colors"
          onClick={() => navigate('/home')}
        >
          <ArrowLeft size={20} />
          返回
        </button>

        <h1 className="font-title text-2xl md:text-3xl text-ancient-brown tracking-wider mb-6 text-center">
          蹴鞠考核
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

          <div className="flex gap-2 mb-4 flex-wrap">
            {shotsData.map((_, i) => (
              <button
                key={i}
                className={`px-3 py-1 rounded text-sm border transition-colors ${
                  currentShot === i
                    ? 'bg-ancient-red text-white border-ancient-red'
                    : 'bg-ancient-input border-gold text-ancient-brown'
                }`}
                onClick={() => setCurrentShot(i)}
              >
                第{i + 1}球
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-ancient-brown block mb-1">
                力度：{shotsData[currentShot].power}
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={shotsData[currentShot].power}
                onChange={(e) => updateShot(currentShot, 'power', Number(e.target.value))}
                className="w-full accent-ancient-red"
              />
            </div>
            <div>
              <label className="text-sm text-ancient-brown block mb-1">
                角度：{shotsData[currentShot].angle}°
              </label>
              <input
                type="range"
                min={0}
                max={90}
                value={shotsData[currentShot].angle}
                onChange={(e) => updateShot(currentShot, 'angle', Number(e.target.value))}
                className="w-full accent-ancient-red"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gold">
            <div className="grid grid-cols-5 gap-2 text-center text-sm mb-3">
              {shotsData.map((s, i) => (
                <div key={i} className="text-ancient-brown">
                  <div>第{i + 1}球</div>
                  <div className="font-title text-lg text-ancient-red">{s.score}</div>
                </div>
              ))}
            </div>
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
  )
}
