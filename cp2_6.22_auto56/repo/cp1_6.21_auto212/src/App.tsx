import { useState, useCallback } from 'react'
import CityScene from './modules/CityScene'
import WeatherControl from './modules/WeatherControl'
import type { DayNightMode, WeatherType, BuildingUpdate } from './types'

export type { DayNightMode, WeatherType, BuildingUpdate }

function App() {
  const [dayNightMode, setDayNightMode] = useState<DayNightMode>('day')
  const [weather, setWeather] = useState<WeatherType>('sunny')
  const [hoveredBuilding, setHoveredBuilding] = useState<{
    height: number
    lightOn: boolean
  } | null>(null)
  const [regenerateTrigger, setRegenerateTrigger] = useState(0)

  const handleDayNightChange = useCallback((mode: DayNightMode) => {
    setDayNightMode(mode)
  }, [])

  const handleWeatherChange = useCallback((type: WeatherType) => {
    setWeather(type)
  }, [])

  const handleRandomRegenerate = useCallback(() => {
    setRegenerateTrigger(prev => prev + 1)
  }, [])

  const handleBuildingHover = useCallback((data: { height: number; lightOn: boolean } | null) => {
    setHoveredBuilding(data)
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <CityScene
        dayNightMode={dayNightMode}
        weather={weather}
        regenerateTrigger={regenerateTrigger}
        onBuildingHover={handleBuildingHover}
      />
      
      <WeatherControl
        dayNightMode={dayNightMode}
        weather={weather}
        onDayNightChange={handleDayNightChange}
        onWeatherChange={handleWeatherChange}
        onRandomRegenerate={handleRandomRegenerate}
      />

      {hoveredBuilding && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 16px',
          backgroundColor: 'rgba(30, 41, 59, 0.9)',
          border: '1px solid #475569',
          borderRadius: '8px',
          color: '#E2E8F0',
          fontSize: '14px',
          zIndex: 100,
          pointerEvents: 'none',
          transition: 'opacity 0.2s ease-out',
        }}>
          <div>高度：{hoveredBuilding.height.toFixed(0)} 单位</div>
          <div>灯光：{hoveredBuilding.lightOn ? 'ON' : 'OFF'}</div>
        </div>
      )}
    </div>
  )
}

export default App
