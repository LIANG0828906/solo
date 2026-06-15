import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import dayjs from 'dayjs'
import type { EventData } from '../types'

export default function HomePage() {
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await axios.get('/api/events')
        setEvents(res.data)
      } catch (error) {
        console.error('加载活动列表失败', error)
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [])

  const getTotalVotes = (event: EventData) => {
    return event.timeSlots.reduce((sum, slot) => sum + slot.votes.length, 0)
  }

  return (
    <div className="page-fade-in">
      <div className="card home-section">
        <svg className="home-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="20" fill="currentColor" />
          <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="2" strokeOpacity="0.6" fill="none" />
          <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" fill="none" />
        </svg>
        <h1 className="home-title">EventRipple</h1>
        <p className="page-subtitle">
          轻松创建活动提案，邀请朋友一起投票选出最佳时间。<br />
          让聚会安排变得简单高效！
        </p>
        <div className="home-actions">
          <button className="btn btn-primary" onClick={() => navigate('/create')}>
            + 创建新活动
          </button>
          {events.length > 0 && (
            <a href="#event-list" className="btn btn-secondary">
              查看已有活动
            </a>
          )}
        </div>
      </div>

      <div className="card" id="event-list">
        <h2 className="page-title">最近活动</h2>
        {loading ? (
          <div className="loading-state">加载中...</div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <p>还没有任何活动</p>
            <p style={{ marginTop: 8, fontSize: 13 }}>点击上方按钮创建你的第一个活动吧！</p>
          </div>
        ) : (
          <div className="event-list">
            {[...events].reverse().map(event => (
              <Link
                key={event.id}
                to={`/vote/${event.id}`}
                className="event-list-item"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div>
                  <div className="event-list-title">{event.title}</div>
                  <div className="event-list-meta">
                    创建于 {dayjs(event.createdAt).format('YYYY-MM-DD HH:mm')} · {getTotalVotes(event)} 人参与
                  </div>
                </div>
                <Link to={`/results/${event.id}`} className="link-btn" onClick={e => e.stopPropagation()}>
                  查看结果 →
                </Link>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
