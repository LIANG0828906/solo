import { useState, useEffect } from 'react'
import { useReactorStore } from '../store'

function EventPanel() {
  const { currentEvent, applyEmergencyAction, resolveEvent, isReplayMode, history, replayTime } = useReactorStore()
  const [selectedActions, setSelectedActions] = useState<string[]>([])

  useEffect(() => {
    if (isReplayMode && history.length > 0 && replayTime > 0) {
      const replayEvent = history.find(h => h.event && h.timestamp <= replayTime && h.timestamp >= replayTime - 2000)
      if (replayEvent?.event && !currentEvent) {
        setSelectedActions([])
      }
    }
  }, [replayTime, isReplayMode, history, currentEvent])

  useEffect(() => {
    setSelectedActions([])
  }, [currentEvent?.type, currentEvent?.isResolved])

  const handleSelectChange = (category: string, value: string) => {
    if (!currentEvent || currentEvent.isResolved || isReplayMode) return

    const categoryIndex = currentEvent.options.findIndex(o => o.category === category)
    if (categoryIndex === -1) return

    const newSelected = [...selectedActions]
    newSelected[categoryIndex] = value
    setSelectedActions(newSelected)
  }

  const handleConfirm = () => {
    if (!currentEvent || currentEvent.isResolved || isReplayMode) return

    selectedActions.forEach(action => {
      applyEmergencyAction(action)
    })

    const allCorrect = currentEvent.correctActions.every(correct =>
      selectedActions.includes(correct)
    ) && selectedActions.length === currentEvent.correctActions.length

    resolveEvent(allCorrect)
    setSelectedActions([])
  }

  const getSelectedValue = (category: string) => {
    if (!currentEvent) return ''
    const categoryIndex = currentEvent.options.findIndex(o => o.category === category)
    return selectedActions[categoryIndex] || ''
  }

  const canConfirm = currentEvent && !currentEvent.isResolved && !isReplayMode &&
    selectedActions.length === currentEvent.options.length &&
    selectedActions.every(a => a !== undefined && a !== '')

  return (
    <div className="left-panel">
      <div className="panel-card">
        <h3 className="panel-title">突发事件</h3>

        {currentEvent && !currentEvent.isResolved ? (
          <>
            <div className="event-panel-header">
              <span className="event-type-badge">警告</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#FF6666' }}>
                {currentEvent.name}
              </span>
            </div>

            <div className="event-countdown">
              {(currentEvent.remainingTime / 1000).toFixed(1)}s
            </div>

            <div className="event-options">
              {currentEvent.options.map((option) => (
                <div key={option.category} className="option-group">
                  <div className="option-category">{option.category}</div>
                  <select
                    className="action-select"
                    value={getSelectedValue(option.category)}
                    onChange={(e) => handleSelectChange(option.category, e.target.value)}
                    disabled={isReplayMode}
                  >
                    <option value="">-- 请选择操作 --</option>
                    {option.choices.map((choice) => (
                      <option key={choice} value={choice}>
                        {choice}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="correct-hint">
              <div className="hint-title">建议操作：</div>
              <ul className="hint-list">
                {currentEvent.correctActions.map((action, i) => (
                  <li key={i} className="hint-item">{action}</li>
                ))}
              </ul>
            </div>

            <button
              className="confirm-btn"
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              确认执行
            </button>
          </>
        ) : currentEvent?.isResolved ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
              {currentEvent.isFailed ? '❌' : '✅'}
            </div>
            <div style={{ fontSize: '14px', color: currentEvent.isFailed ? '#FF6666' : '#00FF66', fontWeight: '600' }}>
              {currentEvent.isFailed ? '响应失败' : '响应成功'}
            </div>
            {currentEvent.isFailed && (
              <div style={{ fontSize: '12px', color: '#8a8fa3', marginTop: '8px' }}>
                反应堆状态严重恶化
              </div>
            )}
          </div>
        ) : (
          <div className="no-event">
            <div className="no-event-icon">✓</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>系统运行正常</div>
            <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
              等待下一个事件...
            </div>
            <div style={{ fontSize: '11px', marginTop: '12px', color: '#00FF66', opacity: 0.6 }}>
              事件将在15-25秒内随机触发
            </div>
          </div>
        )}
      </div>

      <div className="panel-card">
        <h3 className="panel-title">操作指南</h3>
        <div style={{ fontSize: '12px', color: '#8a8fa3', lineHeight: '1.8' }}>
          <p style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#00FF66' }}>1.</strong> 当突发事件发生时，屏幕会出现红色闪烁警告。
          </p>
          <p style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#00FF66' }}>2.</strong> 从每个下拉列表中选择一项正确的操作。
          </p>
          <p style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#00FF66' }}>3.</strong> 必须在5秒倒计时结束前完成所有选择并确认。
          </p>
          <p>
            <strong style={{ color: '#00FF66' }}>4.</strong> 正确的操作组合可参考"建议操作"列表。
          </p>
        </div>
      </div>
    </div>
  )
}

export default EventPanel
