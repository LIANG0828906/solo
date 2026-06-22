import { useState, useEffect, useRef } from 'react'
import { useAppStore } from './store'
import { controlPoints } from './PipeNetworkData'

export default function ControlPanel() {
  const selectedControlId = useAppStore(state => state.selectedControlId)
  const selectedControlType = useAppStore(state => state.selectedControlType)
  const selectedControlName = useAppStore(state => state.selectedControlName)
  const flowEngine = useAppStore(state => state.flowEngine)
  const setSelectedControl = useAppStore(state => state.setSelectedControl)
  const setControlValue = useAppStore(state => state.setControlValue)

  const [sliderValue, setSliderValue] = useState(50)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedControlId && flowEngine) {
      if (selectedControlType === 'valve') {
        setSliderValue(flowEngine.getValveOpening(selectedControlId))
      } else if (selectedControlType === 'pump') {
        setSliderValue(flowEngine.getPumpPower(selectedControlId))
      }
    }
  }, [selectedControlId, selectedControlType, flowEngine])

  const controlPoint = controlPoints.find(c => c.id === selectedControlId)

  if (!selectedControlId || !controlPoint) return null

  const handleConfirm = () => {
    setControlValue(selectedControlId, sliderValue)
  }

  const handleClose = () => {
    setSelectedControl(null, null, '', null)
  }

  const displayValue = selectedControlType === 'valve'
    ? `${sliderValue.toFixed(0)}%`
    : `${(1.0 + (sliderValue / 100) * 2.0).toFixed(2)}x`

  return (
    <div className="control-panel" ref={panelRef}>
      <div className="panel-header">
        <span className="panel-title">{selectedControlName}</span>
        <button className="close-btn" onClick={handleClose}>×</button>
      </div>
      <div className="panel-body">
        <div className="value-display">
          <span className="value-label">
            {selectedControlType === 'valve' ? '阀门开度' : '泵站功率'}
          </span>
          <span className="value-number">{displayValue}</span>
        </div>
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="custom-slider"
          />
        </div>
        <button className="confirm-btn" onClick={handleConfirm}>
          确定
        </button>
      </div>
    </div>
  )
}
