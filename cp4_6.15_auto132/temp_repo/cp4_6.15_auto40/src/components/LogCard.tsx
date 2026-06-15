import React from 'react'
import { LogEntry, OperationType } from '@/types'

interface LogCardProps {
  log: LogEntry
  index: number
}

const operationConfig: Record<OperationType, { icon: string; label: string; color: string }> = {
  [OperationType.WATER]: { icon: 'fa-droplet', label: '浇水', color: '#4FC3F7' },
  [OperationType.FERTILIZE]: { icon: 'fa-seedling', label: '施肥', color: '#8D6E63' },
  [OperationType.PEST_CONTROL]: { icon: 'fa-bug-slash', label: '除虫', color: '#EF5350' }
}

export const LogCard: React.FC<LogCardProps> = ({ log, index }) => {
  const config = operationConfig[log.operationType]
  const date = new Date(log.timestamp)
  const timeStr = `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

  return (
    <div
      className="log-card"
      style={{
        animation: `logSlideIn 0.5s ease-out ${index * 0.1}s both`,
        background: 'linear-gradient(135deg, #FAF3E0 0%, #E8F5E9 100%)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        boxShadow: '0 2px 8px rgba(139, 69, 19, 0.1)',
        border: '1px solid rgba(139, 69, 19, 0.1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: `${config.color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <i
            className={`fa-solid ${config.icon}`}
            style={{ color: config.color, fontSize: '18px' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
            <span
              style={{
                fontWeight: 600,
                color: '#5D4037',
                fontSize: '14px',
                fontFamily: 'Quicksand, sans-serif'
              }}
            >
              {config.label}
            </span>
            <span
              style={{
                fontSize: '12px',
                color: '#8D6E63',
                flexShrink: 0,
                fontFamily: 'Quicksand, sans-serif'
              }}
            >
              {timeStr}
            </span>
          </div>
          <p
            style={{
              margin: 0,
              color: '#6D4C41',
              fontSize: '13px',
              lineHeight: 1.5,
              wordBreak: 'break-word',
              fontFamily: 'Quicksand, sans-serif'
            }}
          >
            {log.note}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes logSlideIn {
          0% {
            transform: translateX(30px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
