import { useStore } from '../store/useStore'

interface PanelProps {
  type: 'control' | 'analysis'
}

const panelStyle: React.CSSProperties = {
  background: 'rgba(11, 29, 42, 0.9)',
  border: '1px solid rgba(57, 255, 20, 0.3)',
  borderRadius: '8px',
  padding: '16px',
  minWidth: '280px',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 0 20px rgba(57, 255, 20, 0.1), inset 0 0 30px rgba(75, 0, 130, 0.1)'
}

const titleStyle: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '14px',
  fontWeight: 'bold',
  marginBottom: '12px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  borderBottom: '1px solid rgba(57, 255, 20, 0.2)',
  paddingBottom: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  background: 'linear-gradient(135deg, rgba(57, 255, 20, 0.2), rgba(57, 255, 20, 0.05))',
  border: '1px solid rgba(57, 255, 20, 0.4)',
  borderRadius: '4px',
  color: '#39ff14',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  marginBottom: '12px',
  letterSpacing: '1px'
}

const buttonHoverStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(57, 255, 20, 0.3), rgba(57, 255, 20, 0.1))',
  boxShadow: '0 0 15px rgba(57, 255, 20, 0.3)',
  transform: 'translateY(-1px)'
}

const resetButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: 'linear-gradient(135deg, rgba(255, 127, 80, 0.2), rgba(255, 127, 80, 0.05))',
  border: '1px solid rgba(255, 127, 80, 0.4)',
  color: '#ff7f50',
  marginBottom: 0
}

const sliderContainerStyle: React.CSSProperties = {
  marginBottom: '12px'
}

const labelStyle: React.CSSProperties = {
  color: 'rgba(57, 255, 20, 0.8)',
  fontSize: '11px',
  marginBottom: '6px',
  display: 'flex',
  justifyContent: 'space-between',
  letterSpacing: '1px'
}

const sliderStyle: React.CSSProperties = {
  width: '100%',
  height: '6px',
  appearance: 'none',
  background: 'rgba(57, 255, 20, 0.1)',
  borderRadius: '3px',
  outline: 'none',
  cursor: 'pointer'
}

const dataRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '20px 1fr 1fr 1fr',
  gap: '8px',
  padding: '8px',
  marginBottom: '4px',
  background: 'rgba(57, 255, 20, 0.03)',
  borderRadius: '4px',
  border: '1px solid rgba(57, 255, 20, 0.1)',
  fontSize: '11px',
  alignItems: 'center'
}

const headerRowStyle: React.CSSProperties = {
  ...dataRowStyle,
  background: 'rgba(75, 0, 130, 0.2)',
  border: '1px solid rgba(75, 0, 130, 0.3)',
  color: 'rgba(57, 255, 20, 0.9)',
  fontWeight: 'bold',
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '1px'
}

const getIntensityColor = (intensity: number): string => {
  if (intensity > 0.7) return '#ff7f50'
  if (intensity > 0.4) return '#39ff14'
  return 'rgba(57, 255, 20, 0.6)'
}

const getIntensityBar = (intensity: number): React.ReactNode => {
  const bars = Math.ceil(intensity * 5)
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          style={{
            width: '8px',
            height: '12px',
            background: i < bars ? getIntensityColor(intensity) : 'rgba(57, 255, 20, 0.1)',
            borderRadius: '2px',
            transition: 'background 0.3s ease'
          }}
        />
      ))}
    </div>
  )
}

const ControlPanel = () => {
  const { waveFrequency, setWaveFrequency, resetScene, sonarProbes } = useStore()

  return (
    <div style={panelStyle}>
      <div style={titleStyle}>
        <span style={{ fontSize: '16px' }}>⚓</span>
        <span>探测工具</span>
      </div>

      <button
        style={buttonStyle}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, buttonHoverStyle)
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, buttonStyle)
        }}
        onClick={() => {
          setWaveFrequency(waveFrequency)
        }}
      >
        {sonarProbes.length > 0 ? `声呐探测中 (${sonarProbes.length}个)` : '🔊 放置声呐探测球'}
      </button>

      <div style={sliderContainerStyle}>
        <div style={labelStyle}>
          <span>波频调节</span>
          <span style={{ color: '#ff7f50' }}>{waveFrequency.toFixed(1)} Hz</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="5"
          step="0.1"
          value={waveFrequency}
          onChange={(e) => setWaveFrequency(parseFloat(e.target.value))}
          style={sliderStyle}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '9px',
            color: 'rgba(57, 255, 20, 0.4)',
            marginTop: '4px'
          }}
        >
          <span>低频</span>
          <span>高频</span>
        </div>
      </div>

      <button
        style={resetButtonStyle}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, {
            ...buttonHoverStyle,
            background: 'linear-gradient(135deg, rgba(255, 127, 80, 0.3), rgba(255, 127, 80, 0.1))',
            boxShadow: '0 0 15px rgba(255, 127, 80, 0.3)'
          })
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, resetButtonStyle)
        }}
        onClick={resetScene}
      >
        🔄 重置场景
      </button>

      <div
        style={{
          marginTop: '12px',
          padding: '8px',
          background: 'rgba(75, 0, 130, 0.1)',
          borderRadius: '4px',
          border: '1px solid rgba(75, 0, 130, 0.2)',
          fontSize: '10px',
          color: 'rgba(57, 255, 20, 0.5)',
          lineHeight: '1.6'
        }}
      >
        <div style={{ color: '#4b0082', marginBottom: '4px', fontWeight: 'bold' }}>💡 操作提示</div>
        <div>• 点击海面放置声呐探测球</div>
        <div>• 鼠标拖拽旋转视角</div>
        <div>• 滚轮缩放观察范围</div>
      </div>
    </div>
  )
}

const AnalysisPanel = () => {
  const { echoHistory, heatmapData } = useStore()

  const formatAngle = (angle: number): string => {
    const degrees = ((angle * 180) / Math.PI + 360) % 360
    return `${degrees.toFixed(0)}°`
  }

  const formatTime = (timestamp: number): string => {
    const diff = Date.now() - timestamp
    return `${(diff / 1000).toFixed(1)}s`
  }

  return (
    <div style={panelStyle}>
      <div style={titleStyle}>
        <span style={{ fontSize: '16px' }}>📊</span>
        <span>回声数据分析</span>
      </div>

      <div style={headerRowStyle}>
        <span>#</span>
        <span>强度</span>
        <span>距离</span>
        <span>角度</span>
      </div>

      {echoHistory.length === 0 ? (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: 'rgba(57, 255, 20, 0.3)',
            fontSize: '11px',
            fontStyle: 'italic'
          }}
        >
          等待回声信号...
          <div
            style={{
              marginTop: '8px',
              display: 'inline-block',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            ◉
          </div>
        </div>
      ) : (
        echoHistory.map((echo, index) => (
          <div
            key={echo.id}
            style={{
              ...dataRowStyle,
              opacity: 1 - index * 0.15,
              animation: `fadeIn 0.5s ease ${index * 0.1}s both`
            }}
          >
            <span
              style={{
                color: index === 0 ? '#ff7f50' : 'rgba(57, 255, 20, 0.6)',
                fontWeight: index === 0 ? 'bold' : 'normal'
              }}
            >
              {index + 1}
            </span>
            <div>
              {getIntensityBar(echo.intensity)}
              <div style={{ fontSize: '9px', color: 'rgba(57, 255, 20, 0.4)', marginTop: '2px' }}>
                {(echo.intensity * 100).toFixed(0)}% · {formatTime(echo.timestamp)}
              </div>
            </div>
            <span style={{ color: getIntensityColor(echo.intensity) }}>
              {echo.distance.toFixed(1)}
              <span style={{ fontSize: '9px', opacity: 0.6 }}>m</span>
            </span>
            <span style={{ color: 'rgba(57, 255, 20, 0.8)' }}>{formatAngle(echo.angle)}</span>
          </div>
        ))
      )}

      <div
        style={{
          marginTop: '12px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px'
        }}
      >
        <div
          style={{
            padding: '10px',
            background: 'rgba(57, 255, 20, 0.05)',
            borderRadius: '4px',
            border: '1px solid rgba(57, 255, 20, 0.2)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '9px', color: 'rgba(57, 255, 20, 0.5)', marginBottom: '4px' }}>
            探测点数量
          </div>
          <div style={{ fontSize: '20px', color: '#39ff14', fontWeight: 'bold' }}>
            {heatmapData.size}
          </div>
        </div>
        <div
          style={{
            padding: '10px',
            background: 'rgba(75, 0, 130, 0.1)',
            borderRadius: '4px',
            border: '1px solid rgba(75, 0, 130, 0.3)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '9px', color: 'rgba(57, 255, 20, 0.5)', marginBottom: '4px' }}>
            活跃声呐
          </div>
          <div style={{ fontSize: '20px', color: '#4b0082', fontWeight: 'bold' }}>
            {echoHistory.length > 0 ? Math.max(...echoHistory.map((e) => Math.ceil(e.intensity * 5))) : 0}
          </div>
        </div>
      </div>

      <style>{`
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: linear-gradient(135deg, #39ff14, #4b0082);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(57, 255, 20, 0.5);
          transition: transform 0.2s ease;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
      `}</style>
    </div>
  )
}

const Panel = ({ type }: PanelProps) => {
  return type === 'control' ? <ControlPanel /> : <AnalysisPanel />
}

export default Panel
