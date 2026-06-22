import React, { useState } from 'react'
import moment from 'moment'
import { setTeacherTimeSlots } from '../modules/teachers/TeacherService'
import './TeacherSlotsPage.css'

const TeacherSlotsPage: React.FC = () => {
  const [startDate, setStartDate] = useState(moment().format('YYYY-MM-DD'))
  const [endDate, setEndDate] = useState(moment().add(7, 'days').format('YYYY-MM-DD'))
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const daysCount = startDate && endDate
    ? moment(endDate).diff(moment(startDate), 'days') + 1
    : 0

  const hoursPerDay = startTime && endTime
    ? parseInt(endTime.split(':')[0], 10) - parseInt(startTime.split(':')[0], 10)
    : 0

  const totalSlots = daysCount * hoursPerDay

  const validateForm = (): string | null => {
    if (!startDate || !endDate || !startTime || !endTime) {
      return '请填写完整信息'
    }

    if (moment(startDate).isBefore(moment(), 'day')) {
      return '开始日期不能早于今天'
    }

    if (moment(endDate).isBefore(moment(startDate), 'day')) {
      return '结束日期不能早于开始日期'
    }

    if (startTime >= endTime) {
      return '开始时间必须早于结束时间'
    }

    if (daysCount > 30) {
      return '日期范围不能超过30天'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setSuccess(false)

    try {
      setLoading(true)
      const result = await setTeacherTimeSlots({
        startDate,
        endDate,
        startTime,
        endTime,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      console.error('Failed to set time slots:', error)
      const errorMsg = error?.response?.data?.detail || '设置失败，请稍后重试'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const hours = []
  for (let i = 9; i <= 18; i++) {
    hours.push(`${String(i).padStart(2, '0')}:00`)
  }

  return (
    <div className="teacher-slots-page">
      <h1 className="page-title">课时管理</h1>

      <div className="slots-container">
        <div className="slots-card">
          <h2 className="card-title">批量设置可预约时间</h2>
          <p className="card-description">
            设置您未来可接受预约的时间段，系统将自动生成对应时段的可预约课时。
          </p>

          {success && (
            <div className="success-message">
              ✓ 课时设置成功！共设置 {totalSlots} 个可预约时段
            </div>
          )}

          {error && (
            <div className="error-message">
              ✗ {error}
            </div>
          )}

          <form className="slots-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>开始日期</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setError('')
                  }}
                  className="form-input"
                  min={moment().format('YYYY-MM-DD')}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>结束日期</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setError('')
                  }}
                  className="form-input"
                  min={moment().format('YYYY-MM-DD')}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>开始时间</label>
                <select
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value)
                    setError('')
                  }}
                  className="form-input"
                  disabled={loading}
                >
                  {hours.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>结束时间</label>
                <select
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value)
                    setError('')
                  }}
                  className="form-input"
                  disabled={loading}
                >
                  {hours.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="preview-info">
              <p>
                <strong>预览：</strong>
                将为
                {startDate && endDate ? (
                  <>
                    {moment(startDate).format('MM月DD日')} 至 {moment(endDate).format('MM月DD日')}
                    （共 {daysCount} 天）
                  </>
                ) : '--'}
                设置 {startTime || '--'} - {endTime || '--'} 的可预约时段
                {totalSlots > 0 && (
                  <span className="slot-count">，共 {totalSlots} 个时段</span>
                )}
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">设置中...</span>
              ) : (
                '确认设置'
              )}
            </button>
          </form>
        </div>

        <div className="tips-card">
          <h3 className="tips-title">温馨提示</h3>
          <ul className="tips-list">
            <li>设置后，家长可在您设置的时间段内进行预约</li>
            <li>每次设置会覆盖对应日期的已有时间段</li>
            <li>可预约时段以1小时为单位</li>
            <li>如临时有事，请及时取消对应时段的预约</li>
            <li>日期范围最多可设置30天</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TeacherSlotsPage
