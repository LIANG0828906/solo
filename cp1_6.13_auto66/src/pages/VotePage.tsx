import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import type { EventData, TimeSlot } from '../types'

dayjs.locale('zh-cn')

let localVoterId = localStorage.getItem('eventripple_voter_id')
if (!localVoterId) {
  localVoterId = 'v_' + Math.random().toString(36).substring(2, 15)
  localStorage.setItem('eventripple_voter_id', localVoterId)
}
const VOTER_ID = localVoterId

const CircularProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const [displayedPercent, setDisplayedPercent] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayedPercent(percentage)
    }, 50)
    return () => clearTimeout(timer)
  }, [percentage])

  const offset = circumference - (displayedPercent / 100) * circumference

  let strokeColor = '#ef4444'
  if (displayedPercent >= 70) {
    strokeColor = '#10b981'
  } else if (displayedPercent >= 30) {
    strokeColor = '#f59e0b'
  }

  const gradientId = `progress-${Math.random().toString(36).substring(2, 9)}`

  return (
    <div className="circular-progress">
      <svg width="60" height="60">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.9} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={1} />
          </linearGradient>
        </defs>
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="5"
        />
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="progress-text">{Math.round(displayedPercent)}%</div>
    </div>
  )
}

const TimeSlotCard: React.FC<{
  slot: TimeSlot
  totalVotes: number
  isVoted: boolean
  onVote: (slotId: string) => void
  voting: boolean
}> = ({ slot, totalVotes, isVoted, onVote, voting }) => {
  const percentage = totalVotes > 0 ? (slot.votes.length / totalVotes) * 100 : 0

  return (
    <div className="timeslot-card" style={{
      outline: isVoted ? '2px solid #4f46e5' : 'none',
      outlineOffset: isVoted ? '-1px' : 0
    }}>
      <div className="timeslot-header">
        <div className="timeslot-info">
          <div className="timeslot-date">
            {dayjs(slot.date).format('MM月DD日')}
            <span style={{
              fontSize: 12,
              color: '#6b7280',
              fontWeight: 400,
              marginLeft: 6
            }}>
              {dayjs(slot.date).format('周ddd')}
            </span>
          </div>
          <div className="timeslot-time">
            {slot.startTime} - {slot.endTime}
          </div>
        </div>
        <div className="timeslot-actions">
          <button
            className={`btn vote-btn ${isVoted ? 'voted' : ''}`}
            onClick={() => onVote(slot.id)}
            disabled={voting}
          >
            {isVoted ? '✓ 已投票' : voting ? '提交中...' : '投票支持'}
          </button>
        </div>
      </div>
      <div className="progress-section">
        <div className="vote-count">
          {slot.votes.length} 人支持
          {isVoted && slot.votes.length > 0 && (
            <span style={{ color: '#10b981', marginLeft: 4 }}>（含你）</span>
          )}
        </div>
        <CircularProgress percentage={percentage} />
      </div>
    </div>
  )
}

export default function VotePage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [voting, setVoting] = useState(false)

  const fetchEvent = async () => {
    if (!eventId) return
    try {
      setLoading(true)
      const res = await axios.get(`/api/events/${eventId}`)
      setEvent(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || '加载活动失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  const handleVote = async (slotId: string) => {
    if (!event || voting) return
    try {
      setVoting(true)
      const res = await axios.put(`/api/vote/${event.id}/${slotId}`, {
        voterId: VOTER_ID
      })
      setEvent(res.data)
    } catch (err: any) {
      console.error('投票失败', err)
      setError(err.response?.data?.error || '投票失败，请稍后重试')
      setTimeout(() => setError(''), 3000)
    } finally {
      setVoting(false)
    }
  }

  const totalVotes = event
    ? event.timeSlots.reduce((sum, slot) => sum + slot.votes.length, 0)
    : 0

  const votedSlotId = event
    ? event.timeSlots.find(slot => slot.votes.includes(VOTER_ID))?.id || null
    : null

  if (loading) {
    return <div className="loading-state">加载活动详情...</div>
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
          <p className="event-description">{event.description}</p>
        )}
        <div className="event-meta">
          <div className="total-votes">
            已有 <strong style={{ color: '#4f46e5', fontSize: 16 }}>{totalVotes}</strong> 人参与投票
          </div>
          <div className="action-links">
            <Link to={`/results/${event.id}`} className="link-btn">查看结果 →</Link>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="page-title" style={{ fontSize: 20 }}>选择你方便的时间</h2>
        <p className="page-subtitle">点击按钮支持你最合适的时间段，可以改选哦~</p>
        <div className="timeslot-grid">
          {event.timeSlots.map(slot => (
            <TimeSlotCard
              key={slot.id}
              slot={slot}
              totalVotes={totalVotes}
              isVoted={votedSlotId === slot.id}
              onVote={handleVote}
              voting={voting}
            />
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '10px 20px',
          borderRadius: 8,
          fontSize: 14,
          zIndex: 200
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
