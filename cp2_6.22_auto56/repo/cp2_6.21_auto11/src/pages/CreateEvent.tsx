import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import axios from 'axios'

const LOCATIONS = ['展览厅A', '报告厅B', '户外草坪', '多功能厅C', '会议室D']

interface EventData {
  id: string
  name: string
  date: string
  location: string
  created_at: string
}

export default function CreateEvent() {
  const navigate = useNavigate()
  const qrRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
  })
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(false)
  const [particles] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      size: `${4 + Math.random() * 6}px`,
    }))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.date || !formData.location) return

    setLoading(true)
    try {
      const response = await axios.post('/api/events', formData)
      setEventData(response.data)
    } catch (error) {
      console.error('创建活动失败:', error)
      alert('创建活动失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const downloadQR = () => {
    if (!qrRef.current) return
    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      canvas.width = 256
      canvas.height = 256
      ctx!.fillStyle = '#ffffff'
      ctx!.fillRect(0, 0, 256, 256)
      ctx!.drawImage(img, 0, 0, 256, 256)
      URL.revokeObjectURL(url)
      const pngUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = pngUrl
      link.download = `event-${eventData?.id}-qr.png`
      link.click()
    }
    img.src = url
  }

  const scanUrl = `${window.location.origin}/scan/${eventData?.id}`

  return (
    <div className="create-event-page">
      <div className="event-card">
        <h1>✨ 活动签到系统</h1>
        <p className="subtitle">创建活动，生成签到二维码</p>

        {!eventData ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>活动名称</label>
              <input
                type="text"
                placeholder="请输入活动名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>活动日期</label>
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>活动地点</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              >
                <option value="">请选择地点</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? '创建中...' : '创建活动'}
            </button>

            <div className="nav-links">
              <a href="/scan" className="nav-link-btn">📷 扫码签到</a>
            </div>
          </form>
        ) : (
          <div>
            <div className="event-info">
              <h3>🎯 活动信息</h3>
              <p><strong>活动名称：</strong>{eventData.name}</p>
              <p><strong>活动时间：</strong>{new Date(eventData.date).toLocaleString('zh-CN')}</p>
              <p><strong>活动地点：</strong>{eventData.location}</p>
              <p><strong>活动ID：</strong>{eventData.id}</p>
            </div>

            <div className="qr-display">
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="particle"
                  style={{
                    top: p.top,
                    left: p.left,
                    animationDelay: p.delay,
                    width: p.size,
                    height: p.size,
                  }}
                />
              ))}
              <div className="qr-container" ref={qrRef}>
                <QRCodeSVG
                  value={scanUrl}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            <button className="btn" onClick={downloadQR} style={{ marginTop: '20px' }}>
              📥 下载二维码
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => navigate(`/dashboard/${eventData.id}`)}
            >
              📊 查看实时仪表盘
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                setEventData(null)
                setFormData({ name: '', date: '', location: '' })
              }}
            >
              🔄 创建新活动
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
