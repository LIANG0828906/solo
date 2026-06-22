import React from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { IssueListItem } from '../api'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

interface IssueListProps {
  issues: IssueListItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreateNew: () => void
}

const IssueList: React.FC<IssueListProps> = ({ issues, selectedId, onSelect, onCreateNew }) => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>议题列表</h2>
        <button style={styles.createBtn} onClick={onCreateNew}>
          + 新建议题
        </button>
      </div>
      <div style={styles.list}>
        {issues.map(issue => (
          <div
            key={issue.id}
            onClick={() => onSelect(issue.id)}
            style={{
              ...styles.card,
              ...(selectedId === issue.id ? styles.cardSelected : {}),
            }}
            onMouseEnter={e => {
              if (selectedId !== issue.id) {
                e.currentTarget.style.background = '#F5F3FF'
              }
            }}
            onMouseLeave={e => {
              if (selectedId !== issue.id) {
                e.currentTarget.style.background = '#FFFFFF'
              }
            }}
          >
            <div style={styles.cardTop}>
              <h3 style={styles.cardTitle}>{issue.title}</h3>
              <span style={{
                ...styles.statusBadge,
                ...(issue.status === 'ongoing' ? styles.statusOngoing : styles.statusEnded)
              }}>
                {issue.status === 'ongoing' ? '进行中' : '已结束'}
              </span>
            </div>
            <p style={styles.cardDesc}>
              {issue.description.length > 50 ? issue.description.slice(0, 50) + '...' : issue.description}
            </p>
            <div style={styles.cardMeta}>
              <span style={styles.metaText}>
                {dayjs(issue.createdAt).fromNow()}
              </span>
              <span style={styles.metaText}>
                {issue.totalVotes} 票 · {issue.optionCount} 个选项
              </span>
            </div>
          </div>
        ))}
        {issues.length === 0 && (
          <div style={styles.empty}>暂无议题，点击上方按钮创建</div>
        )}
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '360px',
    minWidth: '360px',
    borderRight: '1px solid #E5E7EB',
    background: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1F2937',
  },
  createBtn: {
    padding: '6px 12px',
    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
  },
  card: {
    height: '120px',
    padding: '14px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    marginBottom: '12px',
    cursor: 'pointer',
    background: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'all 0.2s ease',
  },
  cardSelected: {
    borderColor: '#6366F1',
    background: '#F5F3FF',
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.1)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1F2937',
    lineHeight: 1.4,
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  statusOngoing: {
    background: '#ECFDF5',
    color: '#059669',
  },
  statusEnded: {
    background: '#F3F4F6',
    color: '#6B7280',
  },
  cardDesc: {
    fontSize: '12px',
    color: '#6B7280',
    lineHeight: 1.5,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    fontSize: '11px',
    color: '#9CA3AF',
  },
  empty: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: '13px',
  },
}

export default IssueList
