import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import type { EventData, TimeSlot } from '../types'

dayjs.locale('zh-cn')

const BarChart: React.FC<{
  timeSlots: TimeSlot[]
  maxVotes: number
  recommendedId: string | null
}> = ({ timeSlots, maxVotes, recommendedId }) => {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="bar-chart">
      {timeSlots.map(slot => {
        const voteCount = slot.votes.length
        const heightPercent = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0
        const isRecommended = slot.id === recommendedId
        const displayHeight = animated ? Math.max(heightPercent, voteCount > 0 ? 8 : 4) : 0

        return (
          <div className="bar-item" key={slot.id}>
            {isRecommended && voteCount > 0 && (
              <div className="recommended-badge">★ 推荐</div>
            )}
            <div className="bar-container">
              <div
                className={`bar ${isRecommended && voteCount > 0 ? 'bar-gold' : 'bar-blue'}`}
                style={{ height: `${displayHeight}%` }}
              />
            </div>
            <div className="bar-label">
              <div className="bar-date">
                {dayjs(slot.date).format('MM/DD')}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                {slot.startTime}
              </div>
              <div className="bar-votes">
                {voteCount} 票
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ResultsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return
      try {
        setLoading(true)
        const res = await axios.get(`/api/events/${eventId}`)
        setEvent(res.data)
      } catch (err: any) {
        setError(err.response?.data?.error || '加载结果失败')
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [eventId])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 1500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const totalVotes = event
    ? event.timeSlots.reduce((sum, slot) => sum + slot.votes.length, 0)
    : 0

  const maxVotes = event
    ? Math.max(...event.timeSlots.map(s => s.votes.length))
    : 0

  const recommendedSlot = event && maxVotes > 0
    ? event.timeSlots.reduce((a, b) => a.votes.length >= b.votes.length ? a : b)
    : null

  const uniqueVoters = event
    ? new Set(event.timeSlots.flatMap(s => s.votes)).size
    : 0

  const handleCopyShareLink = async () => {
    if (!event) return
    try {
      const shareUrl = `${window.location.origin}/vote/${event.id}`
      await navigator.clipboard.writeText(shareUrl)
      setToast('链接已复制到剪贴板！')
    } catch {
      const shareUrl = `${window.location.origin}/vote/${event.id}`
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setToast('链接已复制到剪贴板！')
      } catch {
        setToast('复制失败，请手动复制链接')
      }
      document.body.removeChild(textArea)
    }
  }

  if (loading) {
    return <div className="loading-state">加载投票结果...</div>
  }

  if (error && !event) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ color: '#ef4444', marginBottom: 16 }}>{error}</div>
        <Link to="/" className="btn btn-primary">返回首页</Link>
      </div>
    )
  }

  if (!event) {
    return <div className="loading-state">未找到活动</div>
  }

  return (
    <div className="page-fade-in">
      <div className="card">
        <h1 className="event-title">{event.title}</h1>
        {event.description && (
          <p className="event-description" style={{ marginBottom: 16 }}>
            {event.description}
          </p>
        )}
        <div className="stats-header">
          <div className="total-participants">
            <span>{uniqueVoters}</span>
            位朋友已参与
          </div>
          <div className="action-links">
            <Link to={`/vote/${event.id}`} className="link-btn">← 返回投票</Link>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="page-title" style={{ fontSize: 20 }}>投票结果统计</h2>
        {totalVotes === 0 ? (
          <div className="empty-state">
            <p>暂时还没有投票</p>
            <p style={{ marginTop: 8, fontSize: 13 }}>点击下方按钮分享链接，邀请朋友投票吧！</p>
          </div>
        ) : (
          <>
            <BarChart
              timeSlots={event.timeSlots}
              maxVotes={maxVotes}
              recommendedId={recommendedSlot?.id || null}
            />
            {recommendedSlot && (
              <div style={{
                marginTop: 8,
                padding: 16,
                background: 'linear-gradient(90deg, rgba(254, 243, 199, 0.5), rgba(253, 224, 71, 0.3))',
                border: '1px solid #fbbf24',
                borderRadius: 8
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#92400e',
                  marginBottom: 4
                }}>
                  <span>★</span>
                  <span>推荐时间</span>
                </div>
                <div style={{ fontSize: 14, color: '#78350f', marginTop: 4 }}>
                  {dayjs(recommendedSlot.date).format('YYYY年MM月DD日')}（{dayjs(recommendedSlot.date).format('周ddd')}）
                  {' '}{recommendedSlot.startTime} - {recommendedSlot.endTime}
                  <span style={{ marginLeft: 8, fontWeight: 500 }}>
                    共 {recommendedSlot.votes.length} 人支持
                    （{totalVotes > 0 ? Math.round((recommendedSlot.votes.length / totalVotes) * 100) : 0}%）
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h2 className="page-title" style={{ fontSize: 20 }}>分享投票链接</h2>
        <p className="page-subtitle">
          复制链接发送给朋友，邀请更多人一起投票选出最佳时间。
        </p>
        <div className="copy-section">
          <input
            type="text"
            className="form-input"
            value={`${window.location.origin}/vote/${event.id}`}
            readOnly
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary copy-btn"
            onClick={handleCopyShareLink}
          >
            📋 复制分享链接
          </button>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
