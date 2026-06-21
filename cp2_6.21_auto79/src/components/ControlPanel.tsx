import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { fetchDeformation } from '../services/apiService'
import type { StructureType, StructureParams } from '../types'

const structureOptions: { value: StructureType; label: string; description: string }[] = [
  { value: 'anticline', label: '背斜', description: '向上拱起的褶皱' },
  { value: 'syncline', label: '向斜', description: '向下凹陷的褶皱' },
  { value: 'normal_fault', label: '正断层', description: '拉张作用形成' },
  { value: 'reverse_fault', label: '逆断层', description: '挤压作用形成' },
  { value: 'strike_slip_fault', label: '平移断层', description: '剪切作用形成' },
]

const defaultParamsMap: Record<StructureType, StructureParams> = {
  anticline: { pressureDirection: 0, stressMagnitude: 4.0, rockHardness: 5 },
  syncline: { pressureDirection: 0, stressMagnitude: 4.0, rockHardness: 5 },
  normal_fault: { pressureDirection: 90, stressMagnitude: 5.0, rockHardness: 4 },
  reverse_fault: { pressureDirection: 0, stressMagnitude: 6.0, rockHardness: 6 },
  strike_slip_fault: { pressureDirection: 45, stressMagnitude: 4.5, rockHardness: 5 },
}

export function ControlPanel() {
  const structureType = useAppStore((s) => s.structureType)
  const params = useAppStore((s) => s.params)
  const selectedPoints = useAppStore((s) => s.selectedPoints)
  const measurementResult = useAppStore((s) => s.measurementResult)
  const isLoading = useAppStore((s) => s.isLoading)
  const layerThickness = useAppStore((s) => s.deformationData?.layerThickness) || 0.6

  const setStructureType = useAppStore((s) => s.setStructureType)
  const setParams = useAppStore((s) => s.setParams)
  const setDeformationData = useAppStore((s) => s.setDeformationData)
  const setIsLoading = useAppStore((s) => s.setIsLoading)
  const clearSelectedPoints = useAppStore((s) => s.clearSelectedPoints)

  const [panelOpen, setPanelOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const requestRef = useRef<number>(0)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const loadDeformation = useCallback(async () => {
    const reqId = ++requestRef.current
    setIsLoading(true)
    try {
      const data = await fetchDeformation(structureType, params)
      if (reqId === requestRef.current) {
        setDeformationData(data)
      }
    } finally {
      if (reqId === requestRef.current) {
        setIsLoading(false)
      }
    }
  }, [structureType, params, setIsLoading, setDeformationData])

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }
    debounceRef.current = window.setTimeout(() => {
      loadDeformation()
    }, 300)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [loadDeformation])

  const handleStructureTypeChange = (type: StructureType) => {
    setStructureType(type)
    setParams(defaultParamsMap[type])
    clearSelectedPoints()
  }

  const handleSliderChange = (key: keyof StructureParams, value: number) => {
    setParams({ [key]: value })
  }

  const resetCamera = () => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      const event = new CustomEvent('resetCamera')
      window.dispatchEvent(event)
    }
  }

  const sliders = [
    {
      key: 'pressureDirection' as const,
      label: '压力方向',
      min: 0,
      max: 360,
      step: 1,
      unit: '°',
      value: params.pressureDirection,
    },
    {
      key: 'stressMagnitude' as const,
      label: '应力大小',
      min: 0.1,
      max: 10.0,
      step: 0.1,
      unit: '',
      value: params.stressMagnitude,
    },
    {
      key: 'rockHardness' as const,
      label: '岩层硬度',
      min: 1,
      max: 10,
      step: 1,
      unit: '',
      value: params.rockHardness,
    },
  ]

  const panelContent = (
    <div style={styles.panelInner}>
      <div style={styles.header}>
        <h2 style={styles.title}>地质结构演示</h2>
        <p style={styles.subtitle}>3D Interactive Geology</p>
      </div>

      <div style={styles.section}>
        <label style={styles.sectionLabel}>地质结构类型</label>
        <div style={styles.buttonGroup} role="group" aria-label="地质结构类型">
          {structureOptions.map((opt) => {
            const isActive = structureType === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                tabIndex={0}
                className={isActive ? 'active' : ''}
                onClick={() => handleStructureTypeChange(opt.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleStructureTypeChange(opt.value)
                  }
                }}
                style={{
                  ...styles.typeButton,
                  ...(isActive ? styles.typeButtonActive : {}),
                }}
                title={opt.description}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
        <p style={styles.typeHint}>
          {structureOptions.find((o) => o.value === structureType)?.description}
        </p>
      </div>

      {sliders.map((slider) => (
        <div key={slider.key} style={styles.section}>
          <div style={styles.sliderLabelRow}>
            <label style={styles.sectionLabel}>{slider.label}</label>
            <span
              className="slider-value-label"
              style={styles.valueLabel}
              aria-live="polite"
            >
              {slider.key === 'stressMagnitude'
                ? slider.value.toFixed(1)
                : Math.round(slider.value)}
              {slider.unit}
            </span>
          </div>
          <div style={styles.sliderRow}>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={slider.value}
              onChange={(e) => handleSliderChange(slider.key, parseFloat(e.target.value))}
              style={styles.slider}
              aria-label={slider.label}
              aria-valuemin={slider.min}
              aria-valuemax={slider.max}
              aria-valuenow={slider.value}
            />
          </div>
          <div style={styles.sliderRange}>
            <span>{slider.min}{slider.unit}</span>
            <span>{slider.max}{slider.unit}</span>
          </div>
        </div>
      ))}

      <div style={styles.section}>
        <button onClick={resetCamera} style={styles.secondaryBtn}>
          重置视角
        </button>
        <button onClick={clearSelectedPoints} style={{ ...styles.secondaryBtn, marginTop: 8 }}>
          清除测量点
        </button>
        {isLoading && (
          <p style={styles.loadingHint}>正在计算变形网格...</p>
        )}
      </div>

      {selectedPoints.length > 0 && (
        <div style={styles.section}>
          <label style={styles.sectionLabel}>测量信息</label>
          {selectedPoints.map((p, i) => (
            <div key={p.id} style={styles.pointInfo}>
              <span style={styles.pointName}>P{i + 1}</span>
              <span style={styles.pointCoord}>
                X:{p.position[0].toFixed(2)} Y:{p.position[1].toFixed(2)} Z:{p.position[2].toFixed(2)}
              </span>
              <span style={styles.pointLayer}>层厚: {layerThickness.toFixed(2)}</span>
            </div>
          ))}
          {selectedPoints.length === 1 && (
            <p style={styles.hint}>双击第二点以测量距离与角度</p>
          )}
          {measurementResult && (
            <div style={styles.measureResult}>
              <div>距离: <strong>{measurementResult.distance.toFixed(3)}</strong></div>
              <div>倾角: <strong>{measurementResult.horizontalAngle.toFixed(2)}°</strong></div>
            </div>
          )}
        </div>
      )}

      <div style={styles.footerHint}>
        <p>• 左键拖拽旋转视角</p>
        <p>• 滚轮缩放</p>
        <p>• 单击岩层选择测量点</p>
        <p>• 双击第二点完成测量</p>
      </div>
    </div>
  )

  return (
    <>
      <style>{cssStyles}</style>
      {isMobile ? (
        <>
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            style={styles.mobileToggle}
          >
            {panelOpen ? '收起 ▼' : '控制面板 ▲'}
          </button>
          <div
            style={{
              ...styles.panel,
              ...styles.mobilePanel,
              ...(panelOpen ? styles.mobilePanelOpen : styles.mobilePanelClosed),
            }}
          >
            {panelContent}
          </div>
        </>
      ) : (
        <div style={styles.panel}>{panelContent}</div>
      )}
    </>
  )
}

const cssStyles = `
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(to right, #0f3460 0%, #0f3460 var(--val, 50%), #2a3a5a var(--val, 50%), #2a3a5a 100%);
    outline: none;
    transition: background 0.2s ease;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #e94560;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 6px rgba(233, 69, 96, 0.5);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 3px 10px rgba(233, 69, 96, 0.7);
  }
  input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #e94560;
    cursor: pointer;
    border: 2px solid #fff;
  }
  .type-button.active {
    background: #007bff !important;
    color: #ffffff !important;
    box-shadow: 0 2px 10px rgba(0, 123, 255, 0.5) !important;
  }
  .type-button:focus-visible {
    outline: 2px solid #e94560;
    outline-offset: 2px;
  }
`

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    left: 0,
    top: 0,
    width: 320,
    height: '100vh',
    background: 'rgba(22, 33, 62, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    color: '#fff',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
  },
  mobilePanel: {
    left: 0,
    right: 0,
    top: 'auto',
    bottom: 0,
    width: '100%',
    height: 'auto',
    maxHeight: '60vh',
    borderRight: 'none',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  mobilePanelOpen: {
    transform: 'translateY(0)',
  },
  mobilePanelClosed: {
    transform: 'translateY(100%)',
  },
  mobileToggle: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '12px 20px',
    background: 'rgba(22, 33, 62, 0.95)',
    backdropFilter: 'blur(12px)',
    color: '#fff',
    border: 'none',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    zIndex: 11,
    transition: 'all 0.2s ease',
  },
  panelInner: {
    padding: '20px 18px',
    overflowY: 'auto',
    flex: 1,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    color: '#fff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    margin: '4px 0 0 0',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 22,
  },
  sectionLabel: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  sliderLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  valueLabel: {
    display: 'inline-block',
    minWidth: 56,
    padding: '3px 10px',
    background: 'rgba(15, 52, 96, 0.7)',
    border: '1px solid rgba(233, 69, 96, 0.4)',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    color: '#e94560',
    textAlign: 'center',
    fontFamily: 'monospace',
    transition: 'all 0.2s ease',
  },
  sliderRow: {
    padding: '4px 0',
  },
  slider: {
    width: '100%',
    cursor: 'pointer',
  },
  sliderRange: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeButton: {
    flex: '1 0 auto',
    minWidth: '30%',
    padding: '9px 10px',
    fontSize: 13,
    fontWeight: 500,
    background: 'rgba(15, 52, 96, 0.5)',
    color: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  typeButtonActive: {
    background: '#007bff',
    color: '#ffffff',
    boxShadow: '0 2px 10px rgba(0, 123, 255, 0.5)',
    borderColor: '#007bff',
  },
  typeHint: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontStyle: 'italic',
    marginBottom: 0,
  },
  secondaryBtn: {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(15, 52, 96, 0.6)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  loadingHint: {
    marginTop: 10,
    fontSize: 12,
    color: '#e94560',
    textAlign: 'center',
  },
  pointInfo: {
    background: 'rgba(15, 52, 96, 0.4)',
    padding: '8px 10px',
    borderRadius: 6,
    marginBottom: 6,
    fontSize: 12,
    lineHeight: 1.6,
  },
  pointName: {
    display: 'inline-block',
    fontWeight: 700,
    color: '#e94560',
    marginRight: 8,
  },
  pointCoord: {
    display: 'block',
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  pointLayer: {
    display: 'block',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 8,
    fontStyle: 'italic',
  },
  measureResult: {
    marginTop: 10,
    padding: '10px 12px',
    background: 'linear-gradient(135deg, rgba(233, 69, 96, 0.2), rgba(15, 52, 96, 0.4))',
    border: '1px solid rgba(233, 69, 96, 0.3)',
    borderRadius: 6,
    fontSize: 13,
    lineHeight: 1.8,
    color: 'rgba(255,255,255,0.9)',
  },
  footerHint: {
    marginTop: 'auto',
    paddingTop: 12,
    borderTop: '1px solid rgba(255,255,255,0.06)',
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    lineHeight: 1.8,
  },
}

export default ControlPanel
