import { useState } from 'react'
import { useReactorStore } from '../store'

function EventPanel() {
  const { currentEvent, applyEmergencyAction, resolveEvent } = useReactorStore()
  const [selectedActions, setSelectedActions] = useState<string[]>([])

  const handleActionSelect = (action: string, category: string) => {
    if (!currentEvent || currentEvent.isResolved) return

    const categoryIndex = currentEvent.options.findIndex(o => o.category === category)
    if (categoryIndex === -1) return

    const newSelected = [...selectedActions]
    const existingIndex = newSelected.findIndex((_, i) => {
      const cat = currentEvent.options[i]?.category
      return cat === category
    }

    if (existingIndex !== -1) {
      newSelected[existingIndex] = action
    } else {
      newSelected.push(action)
    }

    setSelectedActions(newSelected)
  }

  const handleConfirm = () => {
    if (!currentEvent || currentEvent.isResolved) return

    selectedActions.forEach(action => {
      applyEmergencyAction(action)
    })

    const allCorrect = currentEvent.correctActions.every(correct =>
      selectedActions.includes(correct)
    ) && selectedActions.length === currentEvent.correctActions.length

    resolveEvent(allCorrect)
    setSelectedActions([])
  }

  const isActionSelected = (action: string, category: string) => {
    if (!currentEvent) return false
    const categoryIndex = currentEvent.options.findIndex(o => o.category === category)
    return selectedActions[categoryIndex] === action
  }

  const canConfirm = currentEvent && !currentEvent.isResolved &&
    selectedActions.length === currentEvent.options.length

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
                <div key={option.category}>
                  <div className="option-category">{option.category}</div>
                  <div className="option-buttons">
                    {option.choices.map((choice) => (
                      <button
                        key={choice}
                        className={`action-btn ${isActionSelected(choice, option.category) ? 'selected' : ''}`}
                        onClick={() => handleActionSelect(choice, option.category)}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
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
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>
              {currentEvent.isFailed ? '❌' : '✅'}
            </div>
            <div style={{ fontSize: '13px', color: currentEvent.isFailed ? '#FF6666' : '#00FF66' }}>
              {currentEvent.isFailed ? '响应失败' : '响应成功'}
            </div>
          </div>
        ) : (
          <div className="no-event">
            <div className="no-event-icon">✓</div>
            <div>系统运行正常</div>
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
              等待下一个事件...
            </div>
          </div>
        )}
      </div>

      <div className="panel-card">
        <h3 className="panel-title">操作指南</h3>
        <div style={{ fontSize: '12px', color: '#8a8fa3', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '8px' }}>
            当突发事件发生时，从每个类别中选择一项正确的操作。
          </p>
          <p>
            必须在5秒内完成所有选择并确认执行。
          </p>
        </div>
      </div>
    </div>
  )
}

export default EventPanel
