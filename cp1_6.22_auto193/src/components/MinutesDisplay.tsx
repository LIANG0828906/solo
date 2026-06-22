import React, { useState } from 'react'
import { Resolution } from '../types'
import { meetingApi } from '../api/meetingApi'

interface MinutesDisplayProps {
  resolutions: Resolution[]
  onUpdate: () => void
}

const MinutesDisplay: React.FC<MinutesDisplayProps> = ({ resolutions, onUpdate }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const toggleStatus = async (resolution: Resolution) => {
    setUpdatingId(resolution.id)
    try {
      const newStatus = resolution.status === 'in_progress' ? 'completed' : 'in_progress'
      await meetingApi.updateResolution(resolution.id, { status: newStatus })
      onUpdate()
    } catch (error) {
      console.error('更新状态失败:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusStyle = (status: string): React.CSSProperties => {
    return status === 'completed'
      ? { backgroundColor: '#D1FAE5', color: '#065F46' }
      : { backgroundColor: '#DBEAFE', color: '#1E40AF' }
  }

  const getStatusText = (status: string): string => {
    return status === 'completed' ? '已完成' : '进行中'
  }

  if (resolutions.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.sectionTitle}>决议列表</h3>
        <div style={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
            <line x1="9" y1="17" x2="15" y2="17"/>
          </svg>
          <p style={{ color: '#9CA3AF', marginTop: '12px' }}>暂无决议</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.sectionTitle}>决议列表</h3>
      <div style={styles.list}>
        {resolutions.map((resolution) => (
          <div
            key={resolution.id}
            className="resolution-card"
            onClick={() => toggleExpand(resolution.id)}
          >
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <span
                  style={{
                    ...styles.statusBadge,
                    ...getStatusStyle(resolution.status),
                  }}
                >
                  {getStatusText(resolution.status)}
                </span>
                <span style={styles.contentPreview}>
                  {resolution.content.length > 60
                    ? resolution.content.substring(0, 60) + '...'
                    : resolution.content}
                </span>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9CA3AF"
                strokeWidth="2"
                style={{
                  ...styles.chevron,
                  transform: expandedId === resolution.id ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            
            <div
              style={{
                ...styles.cardContent,
                maxHeight: expandedId === resolution.id ? '500px' : '0px',
                opacity: expandedId === resolution.id ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.3s ease, opacity 0.3s ease',
              }}
            >
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>决议内容：</span>
                <span style={styles.detailValue}>{resolution.content}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>负责人：</span>
                <span style={styles.detailValue}>{resolution.assignee}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>截止日期：</span>
                <span style={styles.detailValue}>{resolution.deadline}</span>
              </div>
              <button
                className={`action-btn ${resolution.status}`}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleStatus(resolution)
                }}
                disabled={updatingId === resolution.id}
              >
                {updatingId === resolution.id ? '更新中...' : 
                 resolution.status === 'completed' ? '标记为进行中' : '标记为已完成'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#1E293B',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    flexShrink: 0,
  },
  contentPreview: {
    fontSize: '14px',
    color: '#374151',
    flex: 1,
  },
  chevron: {
    flexShrink: 0,
  },
  cardContent: {
    padding: '0 20px',
    borderTop: '1px solid #F3F4F6',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '12px 0',
    gap: '8px',
  },
  detailLabel: {
    fontSize: '14px',
    color: '#6B7280',
    fontWeight: 500,
    flexShrink: 0,
    width: '80px',
  },
  detailValue: {
    fontSize: '14px',
    color: '#1F2937',
    flex: 1,
    lineHeight: 1.6,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
}

export default MinutesDisplay
