import { useState, useEffect, useRef, useCallback } from 'react'
import { CharacterRenderer } from './characterRenderer'
import { fetchWeather } from './weatherService'
import type { WeatherData, CharacterConfig, HistoryRecord } from './types'
import { v4 as uuidv4 } from 'uuid'

const DEFAULT_CONFIG: CharacterConfig = {
  hatColor: '#EF4444',
  clothesColor: '#6366F1',
  eyeSize: 20,
  showGlasses: false,
  skinColor: '#FCD34D',
}

const STORAGE_KEY = 'weather_announcer_config'
const HISTORY_KEY = 'weather_announcer_history'

function loadConfig(): CharacterConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) }
    }
  } catch (e) {
    console.error('Failed to load config', e)
  }
  return DEFAULT_CONFIG
}

function loadHistory(): HistoryRecord[] {
  try {
    const saved = localStorage.getItem(HISTORY_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load history', e)
  }
  return []
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

export default function App() {
  const [city, setCity] = useState('北京')
  const [inputValue, setInputValue] = useState('北京')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [config, setConfig] = useState<CharacterConfig>(loadConfig)
  const [loading, setLoading] = useState(false)
  const [panelFading, setPanelFading] = useState(false)
  const [history, setHistory] = useState<HistoryRecord[]>(loadHistory)
  const [isMobile, setIsMobile] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<CharacterRenderer | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [config])

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  useEffect(() => {
    if (canvasRef.current) {
      const renderer = new CharacterRenderer(canvasRef.current, config)
      rendererRef.current = renderer
      renderer.start()
      return () => {
        renderer.stop()
      }
    }
  }, [])

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setConfig(config)
    }
  }, [config])

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setWeather(weather)
    }
  }, [weather])

  const handleSearch = useCallback(async () => {
    if (!inputValue.trim()) return

    setLoading(true)
    setPanelFading(true)

    try {
      const data = await fetchWeather(inputValue.trim())
      setCity(inputValue.trim())
      setWeather(data)

      setTimeout(() => {
        setPanelFading(false)
      }, 100)

      const newRecord: HistoryRecord = {
        id: uuidv4(),
        city: data.city,
        weather: data,
        config: { ...config },
        timestamp: Date.now(),
      }

      setHistory(prev => {
        const updated = [newRecord, ...prev]
        if (updated.length > 20) {
          return updated.slice(0, 20)
        }
        return updated
      })
    } catch (e) {
      console.error('Failed to fetch weather', e)
    } finally {
      setLoading(false)
    }
  }, [inputValue, config])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleConfigChange = (key: keyof CharacterConfig, value: string | number | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleHistoryClick = (record: HistoryRecord) => {
    setCity(record.city)
    setInputValue(record.city)
    setWeather(record.weather)
    setConfig({ ...record.config })
    setPanelFading(true)
    setTimeout(() => setPanelFading(false), 10)
  }

  const renderHistoryAvatar = (record: HistoryRecord, canvas: HTMLCanvasElement | null) => {
    if (!canvas) return
    const tempRenderer = new CharacterRenderer(canvas, record.config)
    tempRenderer.setWeather(record.weather)
    tempRenderer.renderAvatar(canvas)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">个性化天气播报员</h1>
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="输入城市名称，如：北京 或 London"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="search-button" onClick={handleSearch} disabled={loading}>
            {loading ? '...' : '搜索'}
          </button>
        </div>
      </header>

      <div className="main-content">
        <aside className="settings-panel">
          <h2 className="settings-title">角色设置</h2>

          <div className="setting-item">
            <label className="setting-label">帽子颜色</label>
            <input
              type="color"
              className="color-input"
              value={config.hatColor}
              onChange={e => handleConfigChange('hatColor', e.target.value)}
            />
          </div>

          <div className="setting-item">
            <label className="setting-label">衣服颜色</label>
            <input
              type="color"
              className="color-input"
              value={config.clothesColor}
              onChange={e => handleConfigChange('clothesColor', e.target.value)}
            />
          </div>

          <div className="setting-item">
            <label className="setting-label">眼睛大小: {config.eyeSize}px</label>
            <input
              type="range"
              className="range-input"
              min="10"
              max="30"
              value={config.eyeSize}
              onChange={e => handleConfigChange('eyeSize', Number(e.target.value))}
            />
          </div>

          <div className="setting-item checkbox-item">
            <input
              type="checkbox"
              id="glasses"
              className="checkbox-input"
              checked={config.showGlasses}
              onChange={e => handleConfigChange('showGlasses', e.target.checked)}
            />
            <label htmlFor="glasses" className="setting-label" style={{ marginBottom: 0 }}>
              显示眼镜
            </label>
          </div>

          <div className="setting-item">
            <label className="setting-label">角色皮肤色</label>
            <input
              type="color"
              className="color-input"
              value={config.skinColor}
              onChange={e => handleConfigChange('skinColor', e.target.value)}
            />
          </div>
        </aside>

        <main className="canvas-area">
          {loading && (
            <div style={{ position: 'absolute', zIndex: 10 }}>
              <div className="loading-spinner"></div>
            </div>
          )}
          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              className="weather-canvas"
              width={800}
              height={600}
            />
            {weather && (
              <div className={`weather-panel ${panelFading ? 'fading' : ''}`}>
                <div className="temperature">{weather.temperature}°C</div>
                <div className="humidity">湿度: {weather.humidity}%</div>
                <div className="wind-speed">风速: {weather.windSpeed} km/h</div>
              </div>
            )}
          </div>
        </main>
      </div>

      <section className="history-section">
        <h2 className="history-title">历史记录</h2>
        <div className="history-list">
          {history.length === 0 ? (
            <div style={{ color: '#9CA3AF', padding: '20px' }}>暂无历史记录</div>
          ) : (
            history.map(record => (
              <div
                key={record.id}
                className="history-card"
                onClick={() => handleHistoryClick(record)}
              >
                <div className="history-city">{record.city}</div>
                <div className="history-temp">{record.weather.temperature}°C</div>
                <canvas
                  className="history-avatar"
                  width={80}
                  height={80}
                  ref={el => renderHistoryAvatar(record, el)}
                />
                <div className="history-time">{formatTime(record.timestamp)}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
