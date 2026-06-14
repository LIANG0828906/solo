import { memo } from 'react'
import type { StackFrame } from './StepRunner'

export interface StackViewerProps {
  callStack: StackFrame[]
}

function StackViewerImpl({ callStack }: StackViewerProps) {
  return (
    <div className="viz-panel stack-viewer">
      <div className="viz-panel-header">
        <div className="viz-panel-title">
          <span className="viz-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </span>
          调用栈
        </div>
        <div className="viz-panel-count">深度 {callStack.length}</div>
      </div>
      <div className="viz-panel-body stack-body">
        {callStack.length === 0 ? (
          <div className="viz-empty">
            <div className="viz-empty-icon">🔍</div>
            <div className="viz-empty-text">调用栈为空</div>
            <div className="viz-empty-hint">调用函数时会在此显示栈帧</div>
          </div>
        ) : (
          <div className="timeline-container">
            <div className="timeline-line" />
            <div className="timeline-cards">
              {callStack.map((frame, idx) => (
                <div
                  key={frame.id}
                  className={`stack-card ${frame.isCurrent ? 'current-frame' : ''}`}
                  style={{
                    animationDelay: `${idx * 40}ms`,
                  }}
                >
                  <div className={`timeline-dot ${frame.isCurrent ? 'dot-current' : 'dot-past'}`} />
                  <div className="card-content">
                    <div className="card-title-row">
                      <span className="card-func-name">{frame.functionName}</span>
                      {frame.isCurrent && <span className="card-badge">当前</span>}
                    </div>
                    <div className="card-sub-row">
                      {frame.argsSummary ? (
                        <span className="card-args">({frame.argsSummary})</span>
                      ) : (
                        <span className="card-args muted">—</span>
                      )}
                      <span className="card-line">行{frame.lineNumber}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const StackViewer = memo(StackViewerImpl)
