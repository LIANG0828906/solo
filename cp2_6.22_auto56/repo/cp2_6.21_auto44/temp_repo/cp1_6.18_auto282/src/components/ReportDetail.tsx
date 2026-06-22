import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useReportStore } from '../store'
import { STATUS_COLORS, FACILITY_COLORS } from '../types'
import type { StatusRecord } from '../types'

interface TimelineProps {
  statusHistory: StatusRecord[]
}

function Timeline({ statusHistory }: TimelineProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
  }

  return (
    <ul className="timeline">
      {statusHistory.map((item, index) => (
        <li key={index} className="timeline-item">
          <div
            className="timeline-dot"
            style={{ backgroundColor: STATUS_COLORS[item.status] }}
          />
          <div className="timeline-content">
            <div
              className="timeline-status"
              style={{ color: STATUS_COLORS[item.status] }}
            >
              {item.status}
            </div>
            <div className="timeline-time">{formatTime(item.timestamp)}</div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function ReportDetail() {
  const { id } = useParams<{ id: string }>()
  const { currentReport, loading, error, fetchReport } = useReportStore()

  useEffect(() => {
    if (id) {
      fetchReport(id)
    }
  }, [id, fetchReport])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (error) {
    return (
      <div>
        <Link to="/" className="back-link">← 返回地图</Link>
        <div className="error-message">{error}</div>
      </div>
    )
  }

  if (!currentReport) {
    return (
      <div>
        <Link to="/" className="back-link">← 返回地图</Link>
        <div className="error-message">未找到该上报记录</div>
      </div>
    )
  }

  const title = `${currentReport.facilityType} - ${currentReport.description.substring(0, 10)}${currentReport.description.length > 10 ? '...' : ''}`

  return (
    <div>
      <Link to="/" className="back-link">← 返回地图</Link>
      <div className="card detail-card">
        <div className="detail-header">
          <h1 className="detail-title">{title}</h1>
          <div className="detail-meta">
            <span>提交时间：{formatTime(currentReport.createdAt)}</span>
            <span>编号：{currentReport.id}</span>
            <span style={{ color: FACILITY_COLORS[currentReport.facilityType] }}>
              类型：{currentReport.facilityType}
            </span>
          </div>
        </div>

        {currentReport.image && (
          <img
            src={currentReport.image}
            alt="设施照片"
            className="detail-image"
          />
        )}

        <div className="detail-description">
          {currentReport.description}
        </div>

        <div>
          <h2 className="section-title">维修进展</h2>
          <Timeline statusHistory={currentReport.statusHistory} />
        </div>
      </div>
    </div>
  )
}

export default ReportDetail
