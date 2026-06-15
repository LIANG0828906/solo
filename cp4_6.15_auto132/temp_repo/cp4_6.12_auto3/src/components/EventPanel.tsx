import { useState, useEffect, useMemo } from 'react'
import { useReactorStore, EventState } from '../store'

const EVENT_OPTIONS: Record<string, {
  category: string
  choices: string[]
}[]> = {
  plasma_rupture: [
    {
      category: '功率控制',
      choices: ['降低功率', '提升功率', '保持功率']
    },
    {
      category: '加热系统',
      choices: ['启动辅助加热', '关闭辅助加热', '切换冷却模式']
    },
    {
      category: '偏滤器',
      choices: ['调整偏滤器', '关闭偏滤器', '增强偏滤器磁场']
    }
  ],
  coil_quench: [
    {
      category: '电流控制',
      choices: ['紧急切断电流', '提升电流', '保持电流稳定']
    },
    {
      category: '电源系统',
      choices: ['启动备用电源', '切换主电源', '关闭所有电源']
    },
    {
      category: '等离子体',
      choices: ['降低等离子体密度', '提升等离子体密度', '注入杂质气体']
    }
  ],
  impurity_injection: [
    {
      category: '排气系统',
      choices: ['启动排气系统', '关闭排气系统', '切换循环模式']
    },
    {
      category: '磁场控制',
      choices: ['增强约束磁场', '减弱约束磁场', '保持磁场稳定']
    },
    {
      category: '温度控制',
      choices: ['提高等离子体温度', '降低等离子体温度', '保持温度稳定']
    }
  ]
}

const CORRECT_ACTIONS: Record<string, string[]> = {
  plasma_rupture: ['降低功率', '启动辅助加热', '调整偏滤器'],
  coil_quench: ['紧急切断电流', '启动备用电源', '降低等离子体密度'],
  impurity_injection: ['启动排气系统', '增强约束磁场', '提高等离子体温度']
}

function EventPanel() {
  const { currentEvent, replayEvent, applyEmergencyAction, resolveEvent, isReplayMode } = useReactorStore()
  const [selectedActions, setSelectedActions] = useState<(string | null)[]>([null, null, null])

  const activeEvent = isReplayMode ? replayEvent : currentEvent
  const eventOptions = activeEvent ? (EVENT_OPTIONS[activeEvent.type] || []) : []
  const correctActions = activeEvent ? (CORRECT_ACTIONS[activeEvent.type] || []) : []

  useEffect(() => {
    setSelectedActions([null, null, null])
  }, [activeEvent?.type, activeEvent?.isResolved])

  const handleSelectChange = (index: number, value: string) => {
    if (!activeEvent || activeEvent.isResolved || isReplayMode) return

    const newSelected = [...selectedActions]
    newSelected[index] = value || null
    setSelectedActions(newSelected)
  }

  const validateActions = (): boolean => {
    if (!activeEvent) return false

    const selected = selectedActions.filter(a => a !== null) as string[]
    if (selected.length !== correctActions.length) return false

    return correctActions.every(action => selected.includes(action))
  }

  const handleConfirm = () => {
    if (!activeEvent || activeEvent.isResolved || isReplayMode) return

    const isCorrect = validateActions()

    selectedActions.forEach(action => {
      if (action) {
        applyEmergencyAction(action)
      }
    })

    resolveEvent(isCorrect)
    setSelectedActions([null, null, null])
  }

  const canConfirm = activeEvent && !activeEvent.isResolved && !isReplayMode &&
    selectedActions.every(a => a !== null && a !== '')

  return (
    <div className="left-panel">
      <div className="panel-card">
        <h3 className="panel-title">突发事件</h3>

        {activeEvent && !activeEvent.isResolved ? (
          <>
            <div className="event-panel-header">
              <span className="event-type-badge">警告</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#FF6666' }}>
                {activeEvent.name}
              </span>
            </div>

            <div className="event-countdown">
              {(activeEvent.remainingTime / 1000).toFixed(1)}s
            </div>

            <div className="event-options">
              {eventOptions.map((option, index) => (
                <div key={option.category} className="option-group">
                  <div className="option-category">
                    {index + 1}. {option.category}
                  </div>
                  <select
                    className="action-select"
                    value={selectedActions[index] || ''}
                    onChange={(e) => handleSelectChange(index, e.target.value)}
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
                {correctActions.map((action, i) => (
                  <li key={i} className="hint-item">{i + 1}. {action}</li>
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
        ) : activeEvent?.isResolved ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
              {activeEvent.isFailed ? '❌' : '✅'}
            </div>
            <div style={{ fontSize: '14px', color: activeEvent.isFailed ? '#FF6666' : '#00FF66', fontWeight: '600' }}>
              {activeEvent.isFailed ? '响应失败' : '响应成功'}
            </div>
            {activeEvent.isFailed && (
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
            <strong style={{ color: '#00FF66' }}>1.</strong> 突发事件发生时，屏幕会出现红色闪烁警告。
          </p>
          <p style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#00FF66' }}>2.</strong> 从每个下拉列表中选择一项正确的操作。
          </p>
          <p style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#00FF66' }}>3.</strong> 必须在5秒倒计时结束前完成选择并确认。
          </p>
          <p>
            <strong style={{ color: '#00FF66' }}>4.</strong> 可参考"建议操作"列表进行选择。
          </p>
        </div>
      </div>
    </div>
  )
}

export default EventPanel
