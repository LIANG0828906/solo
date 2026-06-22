import { useAppStore } from './store'

export default function DataSummary() {
  const selectedControlName = useAppStore(state => state.selectedControlName)
  const selectedControlType = useAppStore(state => state.selectedControlType)
  const selectedControlId = useAppStore(state => state.selectedControlId)
  const flowEngine = useAppStore(state => state.flowEngine)
  const realtimeData = useAppStore(state => state.realtimeData)

  const hasSelection = selectedControlId !== null

  let controlValue = 0
  if (flowEngine && selectedControlId) {
    if (selectedControlType === 'valve') {
      controlValue = flowEngine.getValveOpening(selectedControlId)
    } else if (selectedControlType === 'pump') {
      controlValue = flowEngine.getPumpPower(selectedControlId)
    }
  }

  return (
    <div className="data-summary-panel">
      <div className="summary-title">数据摘要</div>
      <div className="summary-content">
        {hasSelection ? (
          <>
            <div className="summary-row">
              <span className="summary-label">选中节点</span>
              <span className="summary-value">{selectedControlName}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">
                {selectedControlType === 'valve' ? '阀门开度' : '泵站功率'}
              </span>
              <span className="summary-value">
                {selectedControlType === 'valve'
                  ? `${controlValue.toFixed(0)}%`
                  : `${(1.0 + (controlValue / 100) * 2.0).toFixed(2)}x`}
              </span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row">
              <span className="summary-label">管段流速</span>
              <span className="summary-value highlight">{realtimeData.velocity.toFixed(2)} m/s</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">节点压力</span>
              <span className="summary-value highlight">{realtimeData.pressure.toFixed(1)} MPa</span>
            </div>
          </>
        ) : (
          <div className="summary-empty">
            <p>点击阀门或泵站</p>
            <p>查看详细数据</p>
          </div>
        )}
      </div>
      <div className="summary-footer">
        <div className="legend">
          <div className="legend-item">
            <span className="legend-color valve-color" />
            <span className="legend-text">阀门</span>
          </div>
          <div className="legend-item">
            <span className="legend-color pump-color" />
            <span className="legend-text">泵站</span>
          </div>
          <div className="legend-item">
            <span className="legend-color node-color" />
            <span className="legend-text">节点</span>
          </div>
        </div>
      </div>
    </div>
  )
}
