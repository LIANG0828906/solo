import { useState, useEffect } from 'react'
import { EventBus, WeatherType } from '../core/EventBus'

const weatherOptions: { value: WeatherType; label: string }[] = [
  { value: 'sunny', label: '☀️ 晴朗' },
  { value: 'cloudy', label: '☁️ 多云' },
  { value: 'rain', label: '🌧️ 暴雨' },
  { value: 'dusk', label: '🌅 黄昏' }
]

const getDensityLabel = (density: number): string => {
  if (density <= 33) return '低密度郊区'
  if (density <= 66) return '中密度城区'
  return '高密度CBD'
}

export function UIPanel() {
  const [weather, setWeather] = useState<WeatherType>('sunny')
  const [density, setDensity] = useState(50)
  const [fps, setFps] = useState(60)

  useEffect(() => {
    const unsubscribe = EventBus.on('FPS_UPDATE', (data) => {
      setFps(data.fps)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleWeatherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newWeather = e.target.value as WeatherType
    setWeather(newWeather)
    EventBus.emit('WEATHER_CHANGE', { weather: newWeather })
  }

  const handleDensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDensity = parseInt(e.target.value, 10)
    setDensity(newDensity)
    EventBus.emit('DENSITY_CHANGE', { density: newDensity })
  }

  const isLowFps = fps < 30

  return (
    <>
      <div style={styles.panel}>
        <div style={styles.title}>城市天际线模拟器</div>

        <div style={styles.section}>
          <label style={styles.label}>天气模式</label>
          <select
            value={weather}
            onChange={handleWeatherChange}
            style={styles.select}
          >
            {weatherOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.section}>
          <div style={styles.labelRow}>
            <label style={styles.label}>建筑密度</label>
            <span style={styles.densityValue}>{density}%</span>
          </div>
          <div style={styles.sliderContainer}>
            <div style={styles.sliderGradient} />
            <input
              type="range"
              min="0"
              max="100"
              value={density}
              onChange={handleDensityChange}
              style={styles.slider}
              className="density-slider"
            />
          </div>
          <div style={styles.densityLabel}>{getDensityLabel(density)}</div>
        </div>

        <div style={styles.hint}>
          💡 拖拽鼠标旋转视角 · 滚轮缩放
        </div>
      </div>

      <div
        style={{
          ...styles.fpsContainer,
          ...(isLowFps ? styles.fpsWarning : {})
        }}
        className={isLowFps ? 'fps-blink' : ''}
      >
        <span style={styles.fpsLabel}>FPS</span>
        <span style={{
          ...styles.fpsValue,
          color: isLowFps ? '#ff4757' : '#ffffff'
        }}>
          {fps}
        </span>
      </div>

      <style>{`
        .fps-blink {
          animation: blink 0.8s ease-in-out infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .density-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #63B3ED;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: transform 0.15s ease;
        }
        .density-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .density-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #63B3ED;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: transform 0.15s ease;
        }
        .density-slider::-moz-range-thumb:hover {
          transform: scale(1.15);
        }
        .density-slider::-webkit-slider-runnable-track {
          -webkit-appearance: none;
          background: transparent;
          border: none;
        }
        .density-slider::-moz-range-track {
          background: transparent;
          border: none;
        }
      `}</style>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    left: '20px',
    bottom: '20px',
    width: '280px',
    padding: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
    zIndex: 1000,
    userSelect: 'none'
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
    textAlign: 'center',
    letterSpacing: '1px',
    textShadow: '0 2px 8px rgba(0,0,0,0.3)'
  },
  section: {
    marginBottom: '12px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    marginBottom: '8px',
    color: 'rgba(255, 255, 255, 0.9)'
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  densityValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#63B3ED'
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: '#2D3748',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '32px'
  },
  sliderContainer: {
    position: 'relative',
    height: '20px',
    display: 'flex',
    alignItems: 'center'
  },
  sliderGradient: {
    position: 'absolute',
    top: '50%',
    left: '0',
    right: '0',
    height: '4px',
    transform: 'translateY(-50%)',
    borderRadius: '2px',
    background: 'linear-gradient(to right, #A0AEC0, #718096, #2D3748)',
    pointerEvents: 'none'
  },
  slider: {
    position: 'relative',
    width: '100%',
    height: '20px',
    margin: 0,
    padding: 0,
    appearance: 'none',
    background: 'transparent',
    cursor: 'pointer',
    outline: 'none'
  },
  densityLabel: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: '6px',
    textAlign: 'center'
  },
  hint: {
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: 'rgba(99, 179, 237, 0.15)',
    borderRadius: '6px',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center'
  },
  fpsContainer: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '8px 14px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 1000,
    userSelect: 'none'
  },
  fpsWarning: {
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    border: '1px solid rgba(255, 71, 87, 0.5)'
  },
  fpsLabel: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  fpsValue: {
    fontSize: '14px',
    fontWeight: 700,
    minWidth: '30px',
    textAlign: 'right'
  }
}
