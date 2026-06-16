import { useGameStore, PLANET_PRESETS } from '../store/gameStore'
import { getOrbitalParameters } from '../engine/physics'
import { getOrbitType } from '../engine/orbitUtils'

export default function ControlPanel() {
  const {
    mode,
    phase,
    targetOrbitType,
    zoom,
    planets,
    satellite,
    score,
    missionTime,
    thrustActive,
    setMode,
    setTargetOrbitType,
    setZoom,
    resetSimulation,
    triggerThrust,
    primaryPlanetType,
    setPrimaryPlanetType,
  } = useGameStore()

  const primary = planets.find(p => p.type === 'primary')
  const orbitalParams = satellite && primary
    ? getOrbitalParameters(satellite, primary)
    : null

  const fuelPercentage = satellite ? satellite.fuel * 100 : 100
  const fuelColor = fuelPercentage > 50
    ? 'linear-gradient(90deg, #FF8C00, #FF3C00)'
    : fuelPercentage > 20
      ? 'linear-gradient(90deg, #FF3C00, #FF0000)'
      : 'linear-gradient(90deg, #FF0000, #8B0000)'

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const orbitTypeOptions: { value: 'circular' | 'elliptical' | 'polar'; label: string }[] = [
    { value: 'circular', label: '圆形轨道' },
    { value: 'elliptical', label: '椭圆形轨道' },
    { value: 'polar', label: '极地轨道' },
  ]

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h2 style={styles.title}>QUANTUM ORBIT</h2>
        <div style={styles.subtitle}>轨道力学模拟器</div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>游戏模式</div>
        <div style={styles.buttonGroup}>
          <button
            style={{
              ...styles.modeButton,
              ...(mode === 'single' ? styles.modeButtonActive : {}),
            }}
            onClick={() => setMode('single')}
          >
            单星模式
          </button>
          <button
            style={{
              ...styles.modeButton,
              ...(mode === 'transfer' ? styles.modeButtonActive : {}),
            }}
            onClick={() => setMode('transfer')}
          >
            转移模式
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>目标轨道</div>
        <div style={styles.buttonGroup}>
          {orbitTypeOptions.map((option) => (
            <button
              key={option.value}
              style={{
                ...styles.orbitButton,
                ...(targetOrbitType === option.value ? styles.orbitButtonActive : {}),
              }}
              onClick={() => setTargetOrbitType(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>行星类型</div>
        <div style={styles.planetGrid}>
          {Object.entries(PLANET_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              style={{
                ...styles.planetButton,
                ...(primaryPlanetType === key ? styles.planetButtonActive : {}),
                borderColor: preset.color,
              }}
              onClick={() => setPrimaryPlanetType(key)}
              title={key}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: preset.color,
                  boxShadow: `0 0 8px ${preset.color}`,
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>实时数据</div>

        <div style={styles.dataRow}>
          <span style={styles.dataLabel}>速度</span>
          <span style={styles.dataValue}>
            {orbitalParams ? orbitalParams.orbitalSpeed.toFixed(1) : '0.0'} m/s
          </span>
        </div>

        <div style={styles.dataRow}>
          <span style={styles.dataLabel}>距离</span>
          <span style={styles.dataValue}>
            {orbitalParams ? (orbitalParams.distance * 10).toFixed(0) : '0'} km
          </span>
        </div>

        <div style={styles.dataRow}>
          <span style={styles.dataLabel}>偏心率</span>
          <span style={styles.dataValue}>
            {orbitalParams ? orbitalParams.eccentricity.toFixed(3) : '0.000'}
          </span>
        </div>

        <div style={styles.dataRow}>
          <span style={styles.dataLabel}>轨道类型</span>
          <span style={styles.dataValue}>
            {orbitalParams ? getOrbitType(orbitalParams.eccentricity) : '-'}
          </span>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>燃料剩余</div>
        <div style={styles.fuelBarContainer}>
          <div
            style={{
              ...styles.fuelBar,
              width: `${fuelPercentage}%`,
              background: fuelColor,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <div style={styles.fuelText}>
          {fuelPercentage.toFixed(0)}%
          {thrustActive && <span style={styles.thrustIndicator}> 🔥 推进中</span>}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>统计</div>
        <div style={styles.dataRow}>
          <span style={styles.dataLabel}>总得分</span>
          <span style={styles.dataValueHighlight}>{score}</span>
        </div>
        <div style={styles.dataRow}>
          <span style={styles.dataLabel}>任务用时</span>
          <span style={styles.dataValue}>{formatTime(missionTime)}</span>
        </div>
        <div style={styles.dataRow}>
          <span style={styles.dataLabel}>状态</span>
          <span style={{
            ...styles.dataValue,
            color: phase === 'success' ? '#00FF88' : phase === 'failed' ? '#FF3C00' : '#00F0FF'
          }}>
            {phase === 'idle' ? '准备中' :
             phase === 'aiming' ? '瞄准中' :
             phase === 'launched' ? '运行中' :
             phase === 'success' ? '成功' : '失败'}
          </span>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>缩放</div>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.zoomLabels}>
          <span>0.5x</span>
          <span style={{ fontWeight: 'bold' }}>{zoom.toFixed(1)}x</span>
          <span>3x</span>
        </div>
      </div>

      <div style={styles.section}>
        <button
          style={styles.resetButton}
          onClick={resetSimulation}
        >
          重置模拟
        </button>
      </div>

      {mode === 'transfer' && (
        <div style={styles.tipBox}>
          <div style={styles.tipTitle}>操作提示</div>
          <div style={styles.tipText}>按空格键触发加速</div>
          <div style={styles.tipText}>每次消耗10%燃料</div>
        </div>
      )}

      {mode === 'single' && (
        <div style={styles.tipBox}>
          <div style={styles.tipTitle}>操作提示</div>
          <div style={styles.tipText}>从发射台拖动设置初速度</div>
          <div style={styles.tipText}>虚线箭头指示发射方向</div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 320,
    height: '100%',
    backgroundColor: 'rgba(11, 14, 20, 0.95)',
    borderLeft: '1px solid #00F0FF33',
    boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)',
    padding: 20,
    overflowY: 'auto',
    transition: 'all 0.3s ease',
  },
  header: {
    marginBottom: 24,
    textAlign: 'center',
    paddingBottom: 16,
    borderBottom: '1px solid #00F0FF33',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#00F0FF',
    textShadow: '0 0 10px rgba(0, 240, 255, 0.5)',
    letterSpacing: 2,
    margin: 0,
  },
  subtitle: {
    fontSize: 12,
    color: '#00F0FF80',
    marginTop: 4,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    color: '#00F0FF80',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 700,
  },
  buttonGroup: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  modeButton: {
    flex: 1,
    minWidth: '40%',
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #00F0FF40',
    color: '#00F0FF',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderRadius: 0,
  },
  modeButtonActive: {
    backgroundColor: '#00F0FF',
    color: '#0B0E14',
    boxShadow: '0 0 15px rgba(0, 240, 255, 0.5)',
  },
  orbitButton: {
    flex: 1,
    minWidth: '30%',
    padding: '6px 8px',
    backgroundColor: 'transparent',
    border: '1px solid #00F0FF30',
    color: '#00F0FF80',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderRadius: 0,
  },
  orbitButtonActive: {
    backgroundColor: '#00F0FF20',
    borderColor: '#00F0FF',
    color: '#00F0FF',
  },
  planetGrid: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  planetButton: {
    width: 36,
    height: 36,
    backgroundColor: 'transparent',
    border: '2px solid transparent',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: 0,
  },
  planetButtonActive: {
    transform: 'scale(1.2)',
    boxShadow: '0 0 15px rgba(0, 240, 255, 0.6)',
  },
  dataRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #00F0FF10',
  },
  dataLabel: {
    fontSize: 12,
    color: '#00F0FF80',
  },
  dataValue: {
    fontSize: 12,
    color: '#00F0FF',
    fontWeight: 700,
  },
  dataValueHighlight: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 700,
    textShadow: '0 0 8px rgba(255, 215, 0, 0.5)',
  },
  fuelBarContainer: {
    width: '100%',
    height: 16,
    backgroundColor: '#1a1a2e',
    border: '1px solid #00F0FF33',
    position: 'relative',
    overflow: 'hidden',
  },
  fuelBar: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  fuelText: {
    fontSize: 12,
    color: '#00F0FF',
    marginTop: 6,
    textAlign: 'right',
    fontWeight: 700,
  },
  thrustIndicator: {
    color: '#FF6B35',
    fontSize: 11,
  },
  slider: {
    width: '100%',
    height: 4,
    backgroundColor: '#00F0FF30',
    WebkitAppearance: 'none',
    appearance: 'none',
    cursor: 'pointer',
  },
  zoomLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#00F0FF60',
    marginTop: 6,
  },
  resetButton: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #FF3C0080',
    color: '#FF3C00',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    letterSpacing: 1,
  },
  tipBox: {
    padding: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    border: '1px solid #00F0FF30',
    marginTop: 8,
  },
  tipTitle: {
    fontSize: 11,
    color: '#00F0FF',
    fontWeight: 700,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  tipText: {
    fontSize: 11,
    color: '#00F0FF80',
    lineHeight: 1.6,
  },
}
