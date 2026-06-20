import React, { useState, useMemo } from 'react'
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (note.trim() && plot) {
      onAddLog(plot.id, operationType, note.trim())
      setNote('')
    }
  }

  const statusLabels = useMemo(() => ({
    [PlotStatus.AVAILABLE]: { label: '空闲', color: '#81C784' },
    [PlotStatus.CLAIMED]: { label: '已认领', color: '#FF8A65' },
    [PlotStatus.HARVESTING]: { label: '收获中', color: '#4CAF50' }
  }), [])

  const operationOptions = useMemo(() => [
    { value: OperationType.WATER, label: '浇水', icon: 'fa-droplet', color: '#4FC3F7' },
    { value: OperationType.FERTILIZE, label: '施肥', icon: 'fa-seedling', color: '#8D6E63' },
    { value: OperationType.PEST_CONTROL, label: '除虫', icon: 'fa-bug-slash', color: '#EF5350' }
  ], [])

  if (!plot) {
    return (
      <div className="plot-detail-empty">
        <p>请选择一个地块查看详情</p>
      </div>
    )
  }

  const statusInfo = statusLabels[plot.status]

  return (
    <div className="plot-detail">
      <div className="detail-header">
        <button onClick={onBack} className="back-btn" aria-label="返回">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h3 className="detail-title">地块详情</h3>
      </div>

      <div className="detail-content">
        <div className="plot-info-card" style={{
          background: `linear-gradient(135deg, ${plot.color}40 0%, ${plot.color}20 100%)`,
          borderColor: `${plot.color}80`
        }}>
          <div className="plot-header">
            <div>
              <h4 className="plot-id">
                地块 {plot.row + 1}-{plot.col + 1}
              </h4>
              <span className="status-badge" style={{ background: statusInfo.color }}>
                {statusInfo.label}
              </span>
            </div>
            {plot.hasPlantMarker && (
              <div className="plant-icon">🌱</div>
            )}
          </div>

          {claim && (
            <div className="claim-info">
              <div className="info-row">
                <i className="fa-solid fa-user"></i>
                <span>
                  <strong>认领人：</strong>{claim.nickname}
                </span>
              </div>
              <div className="info-row">
                <i className="fa-solid fa-bullseye"></i>
                <span>
                  <strong>种植目标：</strong>{claim.plantGoal}
                </span>
              </div>
              <div className="info-row">
                <i className="fa-solid fa-calendar-days"></i>
                <span>
                  <strong>种植天数：</strong>
                  <span className="days-count">{getDaysSinceClaim(claim.claimDate)}</span> 天
                </span>
              </div>
            </div>
          )}
        </div>

        {claim && (
          <>
            <div className="log-form-card">
              <h4 className="form-title">
                <i className="fa-solid fa-pen-to-square"></i>
                记录种植日志
              </h4>
              
              <form onSubmit={handleSubmit}>
                <div className="operation-selector">
                  <label className="field-label">操作类型</label>
                  <div className="operation-buttons">
                    {operationOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setOperationType(option.value)}
                        className={`operation-btn ${operationType === option.value ? 'active' : ''}`}
                        style={{
                          borderColor: operationType === option.value ? option.color : '#D7CCC8',
                          background: operationType === option.value ? `${option.color}15` : 'white'
                        }}
                      >
                        <i
                          className={`fa-solid ${option.icon}`}
                          style={{ color: option.color }}
                        ></i>
                        <span style={{ 
                          color: operationType === option.value ? option.color : '#8D6E63'
                        }}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="note-field">
                  <label className="field-label">备注</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="记录一下今天的操作..."
                    rows={3}
                    className="note-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!note.trim()}
                  className="submit-btn"
                >
                  <i className="fa-solid fa-check"></i>
                  保存记录
                </button>
              </form>
            </div>

            <div className="logs-section">
              <h4 className="logs-title">
                <i className="fa-solid fa-clock-rotate-left"></i>
                种植日志
              </h4>
              
              {logs.length === 0 ? (
                <div className="empty-logs">
                  <div className="empty-icon">📝</div>
                  <p>暂无种植日志，快来记录第一条吧！</p>
                </div>
              ) : (
                <div className="logs-list">
                  {logs.map((log, index) => (
                    <LogCard key={log.id} log={log} index={index} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        .plot-detail {
          width: 100%;
          max-width: 480px;
          background: #FFFEF7;
          border-left: 1px solid #D7CCC8;
          display: flex;
          flex-direction: column;
          height: 100vh;
          animation: slideInRight 0.3s ease;
          box-sizing: border-box;
        }

        .plot-detail-empty {
          padding: 40px 20px;
          text-align: center;
          color: #8D6E63;
          font-family: 'Quicksand', sans-serif;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .detail-header {
          padding: 20px;
          border-bottom: 1px solid #D7CCC8;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .back-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: #EFEBE9;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease, transform 0.1s ease;
          flex-shrink: 0;
        }

        .back-btn:hover {
          background: #D7CCC8;
        }

        .back-btn:active {
          transform: scale(0.95);
        }

        .back-btn i {
          color: #5D4037;
          font-size: 14px;
        }

        .detail-title {
          margin: 0;
          color: #5D4037;
          font-family: 'Quicksand', sans-serif;
          font-weight: 600;
          font-size: clamp(1rem, 2vw, 1.125rem);
        }

        .detail-content {
          flex: 1;
          overflow-y: auto;
          padding: clamp(12px, 3vw, 20px);
          overflow-x: hidden;
        }

        .plot-info-card {
          border-radius: 16px;
          padding: clamp(16px, 4vw, 20px);
          margin-bottom: 20px;
          border: 2px solid;
          transition: all 0.3s ease;
        }

        .plot-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .plot-id {
          margin: 0;
          color: #5D4037;
          font-family: 'Quicksand', sans-serif;
          font-weight: 600;
          font-size: clamp(1rem, 2vw, 1.125rem);
        }

        .status-badge {
          display: inline-block;
          margin-top: 8px;
          padding: 4px 12px;
          border-radius: 20px;
          color: white;
          font-size: 12px;
          font-family: 'Quicksand', sans-serif;
          font-weight: 600;
        }

        .plant-icon {
          font-size: clamp(32px, 8vw, 40px);
          line-height: 1;
        }

        .claim-info {
          margin-top: 16px;
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: #5D4037;
          font-family: 'Quicksand', sans-serif;
          font-size: clamp(0.875rem, 1.8vw, 0.9375rem);
          flex-wrap: wrap;
        }

        .info-row:last-child {
          margin-bottom: 0;
        }

        .info-row i {
          color: #8D6E63;
          flex-shrink: 0;
        }

        .info-row strong {
          color: #5D4037;
        }

        .days-count {
          color: #8BC34A;
          font-weight: 700;
        }

        .log-form-card {
          background: #FAF3E0;
          border-radius: 16px;
          padding: clamp(16px, 4vw, 20px);
          margin-bottom: 20px;
          border: 1px solid #D7CCC8;
        }

        .form-title {
          margin: 0 0 16px 0;
          color: #5D4037;
          font-family: 'Quicksand', sans-serif;
          font-weight: 600;
          font-size: clamp(0.9375rem, 2vw, 1rem);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .operation-selector {
          margin-bottom: 16px;
        }

        .field-label {
          display: block;
          color: #6D4C41;
          margin-bottom: 8px;
          font-size: 14px;
          font-family: 'Quicksand', sans-serif;
        }

        .operation-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .operation-btn {
          padding: 10px 8px;
          border: 2px solid;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
          font-family: 'Quicksand', sans-serif;
          font-weight: 600;
          font-size: 12px;
        }

        .operation-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .operation-btn.active {
          transform: scale(1.02);
        }

        .operation-btn i {
          font-size: 18px;
        }

        .note-field {
          margin-bottom: 16px;
        }

        .note-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #D7CCC8;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Quicksand', sans-serif;
          outline: none;
          resize: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
          background: white;
        }

        .note-input:focus {
          border-color: #8BC34A;
          box-shadow: 0 0 0 3px rgba(139, 195, 74, 0.2);
        }

        .submit-btn {
          width: 100%;
          padding: 12px 20px;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Quicksand', sans-serif;
          font-weight: 600;
          cursor: pointer;
          background: #8BC34A;
          color: white;
          transition: all 0.2s ease, transform 0.1s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          background: #7CB342;
        }

        .submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .submit-btn:disabled {
          background: #C5E1A5;
          cursor: not-allowed;
        }

        .logs-section {
          margin-bottom: 20px;
        }

        .logs-title {
          margin: 0 0 16px 0;
          color: #5D4037;
          font-family: 'Quicksand', sans-serif;
          font-weight: 600;
          font-size: clamp(0.9375rem, 2vw, 1rem);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .empty-logs {
          text-align: center;
          padding: 40px 20px;
          color: #8D6E63;
          font-family: 'Quicksand', sans-serif;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .empty-logs p {
          margin: 0;
        }

        .logs-list {
          display: flex;
          flex-direction: column;
        }

        @keyframes slideInRight {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .plot-detail {
            max-width: 100%;
            height: auto;
            min-height: 50vh;
            border-left: none;
            border-top: 1px solid #D7CCC8;
          }

          .detail-header {
            padding: 16px;
          }

          .detail-content {
            padding: 16px;
            max-height: 50vh;
          }
        }

        @media (max-width: 480px) {
          .operation-buttons {
            gap: 6px;
          }

          .operation-btn {
            padding: 8px 6px;
          }
        }
      `}</style>
    </div>
  )
}
