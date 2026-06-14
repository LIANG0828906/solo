import React, { useState } from 'react'
import { LogCard } from '@/components/LogCard'
import { LogEntry, ClaimInfo, PlotCell, OperationType, PlotStatus } from '@/types'

interface PlotDetailProps {
  plot: PlotCell | undefined
  claim: ClaimInfo | undefined
  logs: LogEntry[]
  getDaysSinceClaim: (date: string) => number
  onAddLog: (plotId: string, operationType: OperationType, note: string) => void
  onBack: () => void
}

export const PlotDetail: React.FC<PlotDetailProps> = ({
  plot,
  claim,
  logs,
  getDaysSinceClaim,
  onAddLog,
  onBack
}) => {
  const [operationType, setOperationType] = useState<OperationType>(OperationType.WATER)
  const [note, setNote] = useState('')

  if (!plot) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#8D6E63', fontFamily: 'Quicksand, sans-serif' }}>
        <p>请选择一个地块查看详情</p>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (note.trim()) {
      onAddLog(plot.id, operationType, note.trim())
      setNote('')
    }
  }

  const statusLabels: Record<PlotStatus, { label: string; color: string }> = {
    [PlotStatus.AVAILABLE]: { label: '空闲', color: '#81C784' },
    [PlotStatus.CLAIMED]: { label: '已认领', color: '#FF8A65' },
    [PlotStatus.HARVESTING]: { label: '收获中', color: '#4CAF50' }
  }

  const statusInfo = statusLabels[plot.status]

  const operationOptions = [
    { value: OperationType.WATER, label: '浇水', icon: 'fa-droplet', color: '#4FC3F7' },
    { value: OperationType.FERTILIZE, label: '施肥', icon: 'fa-seedling', color: '#8D6E63' },
    { value: OperationType.PEST_CONTROL, label: '除虫', icon: 'fa-bug-slash', color: '#EF5350' }
  ]

  return (
    <div
      className="plot-detail"
      style={{
        width: '100%',
        maxWidth: '480px',
        background: '#FFFEF7',
        borderLeft: '1px solid #D7CCC8',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        animation: 'slideInRight 0.3s ease'
      }}
    >
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid #D7CCC8',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <button
          onClick={onBack}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            background: '#EFEBE9',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#D7CCC8'}
          onMouseLeave={e => e.currentTarget.style.background = '#EFEBE9'}
        >
          <i className="fa-solid fa-arrow-left" style={{ color: '#5D4037' }}></i>
        </button>
        <h3 style={{ margin: 0, color: '#5D4037', fontFamily: 'Quicksand, sans-serif', fontWeight: 600 }}>
          地块详情
        </h3>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${plot.color}40 0%, ${plot.color}20 100%)`,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            border: `2px solid ${plot.color}80`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <h4 style={{ margin: 0, color: '#5D4037', fontFamily: 'Quicksand, sans-serif', fontWeight: 600 }}>
                地块 {plot.row + 1}-{plot.col + 1}
              </h4>
              <span
                style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: statusInfo.color,
                  color: 'white',
                  fontSize: '12px',
                  fontFamily: 'Quicksand, sans-serif',
                  fontWeight: 600
                }}
              >
                {statusInfo.label}
              </span>
            </div>
            {plot.hasPlantMarker && (
              <div style={{ fontSize: '40px' }}>🌱</div>
            )}
          </div>

          {claim && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <i className="fa-solid fa-user" style={{ color: '#8D6E63' }}></i>
                <span style={{ color: '#5D4037', fontFamily: 'Quicksand, sans-serif' }}>
                  <strong>认领人：</strong>{claim.nickname}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <i className="fa-solid fa-bullseye" style={{ color: '#8D6E63' }}></i>
                <span style={{ color: '#5D4037', fontFamily: 'Quicksand, sans-serif' }}>
                  <strong>种植目标：</strong>{claim.plantGoal}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-calendar-days" style={{ color: '#8D6E63' }}></i>
                <span style={{ color: '#5D4037', fontFamily: 'Quicksand, sans-serif' }}>
                  <strong>种植天数：</strong>
                  <span style={{ color: '#8BC34A', fontWeight: 700 }}>{getDaysSinceClaim(claim.claimDate)}</span> 天
                </span>
              </div>
            </div>
          )}
        </div>

        {claim && (
          <>
            <div
              style={{
                background: '#FAF3E0',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                border: '1px solid #D7CCC8'
              }}
            >
              <h4 style={{ margin: '0 0 16px 0', color: '#5D4037', fontFamily: 'Quicksand, sans-serif', fontWeight: 600 }}>
                <i className="fa-solid fa-pen-to-square" style={{ marginRight: '8px' }}></i>
                记录种植日志
              </h4>
              
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#6D4C41', marginBottom: '8px', fontSize: '14px', fontFamily: 'Quicksand, sans-serif' }}>
                    操作类型
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {operationOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setOperationType(option.value)}
                        style={{
                          flex: 1,
                          padding: '10px 8px',
                          border: `2px solid ${operationType === option.value ? option.color : '#D7CCC8'}`,
                          borderRadius: '12px',
                          background: operationType === option.value ? `${option.color}15` : 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <i
                          className={`fa-solid ${option.icon}`}
                          style={{ color: option.color, fontSize: '18px' }}
                        />
                        <span style={{ fontSize: '12px', color: operationType === option.value ? option.color : '#8D6E63', fontFamily: 'Quicksand, sans-serif', fontWeight: 600 }}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#6D4C41', marginBottom: '8px', fontSize: '14px', fontFamily: 'Quicksand, sans-serif' }}>
                    备注
                  </label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="记录一下今天的操作..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #D7CCC8',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontFamily: 'Quicksand, sans-serif',
                      outline: 'none',
                      resize: 'none',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#8BC34A'
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 195, 74, 0.2)'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#D7CCC8'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!note.trim()}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontFamily: 'Quicksand, sans-serif',
                    fontWeight: 600,
                    cursor: note.trim() ? 'pointer' : 'not-allowed',
                    background: note.trim() ? '#8BC34A' : '#C5E1A5',
                    color: 'white',
                    transition: 'background 0.2s ease, transform 0.1s ease'
                  }}
                  onMouseEnter={e => {
                    if (note.trim()) {
                      e.currentTarget.style.background = '#7CB342'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = note.trim() ? '#8BC34A' : '#C5E1A5'
                  }}
                  onMouseDown={e => {
                    if (note.trim()) {
                      e.currentTarget.style.transform = 'scale(0.98)'
                    }
                  }}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <i className="fa-solid fa-check" style={{ marginRight: '8px' }}></i>
                  保存记录
                </button>
              </form>
            </div>

            <div>
              <h4 style={{ margin: '0 0 16px 0', color: '#5D4037', fontFamily: 'Quicksand, sans-serif', fontWeight: 600 }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '8px' }}></i>
                种植日志
              </h4>
              
              {logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8D6E63', fontFamily: 'Quicksand, sans-serif' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
                  <p>暂无种植日志，快来记录第一条吧！</p>
                </div>
              ) : (
                logs.map((log, index) => (
                  <LogCard key={log.id} log={log} index={index} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
