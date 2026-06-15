import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

interface TimeSlotInput {
  date: string
  startTime: string
  endTime: string
}

const getDefaultDate = (offset: number) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().split('T')[0]
}

export default function CreateEvent() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeSlots, setTimeSlots] = useState<TimeSlotInput[]>([
    { date: getDefaultDate(1), startTime: '09:00', endTime: '11:00' },
    { date: getDefaultDate(1), startTime: '14:00', endTime: '16:00' },
    { date: getDefaultDate(2), startTime: '09:00', endTime: '11:00' },
    { date: getDefaultDate(2), startTime: '14:00', endTime: '16:00' },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const updateTimeSlot = (index: number, field: keyof TimeSlotInput, value: string) => {
    setTimeSlots(prev => prev.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('请输入活动标题')
      return
    }

    const allFilled = timeSlots.every(slot =>
      slot.date && slot.startTime && slot.endTime
    )
    if (!allFilled) {
      setError('请填写所有候选时间的日期和起止时间')
      return
    }

    const validTimes = timeSlots.every(slot => slot.startTime < slot.endTime)
    if (!validTimes) {
      setError('每个候选时间的开始时间必须早于结束时间')
      return
    }

    try {
      setSubmitting(true)
      const res = await axios.post('/api/events', {
        title: title.trim(),
        description: description.trim(),
        timeSlots
      })
      navigate(`/vote/${res.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || '创建活动失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-fade-in">
      <div className="card">
        <h1 className="page-title">创建新活动</h1>
        <p className="page-subtitle">
          填写活动信息并提供 4 个候选时间，邀请朋友投票选出最合适的时间。
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">活动标题 <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例如：周末聚餐、项目复盘会议..."
              maxLength={80}
            />
          </div>

          <div className="form-group">
            <label className="form-label">活动描述（可选）</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="简单介绍一下活动内容、地点、参与人员等信息..."
              maxLength={500}
            />
          </div>

          <div className="form-group">
            <label className="form-label">候选时间（4 个）</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  style={{
                    padding: 16,
                    background: '#f9fafb',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
                    候选时间 {index + 1}
                  </div>
                  <div className="time-input-row">
                    <div>
                      <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>日期</label>
                      <input
                        type="date"
                        className="form-input"
                        value={slot.date}
                        onChange={e => updateTimeSlot(index, 'date', e.target.value)}
                      />
                    </div>
                    <div className="time-input-row">
                      <div>
                        <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>开始</label>
                        <input
                          type="time"
                          className="form-input"
                          value={slot.startTime}
                          onChange={e => updateTimeSlot(index, 'startTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>结束</label>
                        <input
                          type="time"
                          className="form-input"
                          value={slot.endTime}
                          onChange={e => updateTimeSlot(index, 'endTime', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              padding: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#dc2626',
              fontSize: 14,
              marginBottom: 20
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
            style={{ padding: '12px 24px', fontSize: 16 }}
          >
            {submitting ? '创建中...' : '创建活动并生成投票链接'}
          </button>
        </form>
      </div>
    </div>
  )
}
