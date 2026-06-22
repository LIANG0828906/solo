import { useState, useCallback, createContext, useContext, ReactNode } from 'react'
import type { DayNightMode, WeatherType } from '../types'
import ControlPanel from '../components/ControlPanel'

interface WeatherControlContextType {
  dayNightMode: DayNightMode
  weather: WeatherType
  setDayNightMode: (mode: DayNightMode) => void
  setWeather: (type: WeatherType) => void
}

const WeatherControlContext = createContext<WeatherControlContextType | null>(null)

export function useWeatherControl() {
  const context = useContext(WeatherControlContext)
  if (!context) {
    throw new Error('useWeatherControl must be used within WeatherControlProvider')
  }
  return context
}

interface WeatherControlProviderProps {
  children: ReactNode
}

export function WeatherControlProvider({ children }: WeatherControlProviderProps) {
  const [dayNightMode, setDayNightMode] = useState<DayNightMode>('day')
  const [weather, setWeather] = useState<WeatherType>('sunny')

  const handleDayNightChange = useCallback((mode: DayNightMode) => {
    setDayNightMode(mode)
  }, [])

  const handleWeatherChange = useCallback((type: WeatherType) => {
    setWeather(type)
  }, [])

  return (
    <WeatherControlContext.Provider
      value={{
        dayNightMode,
        weather,
        setDayNightMode: handleDayNightChange,
        setWeather: handleWeatherChange,
      }}
    >
      {children}
    </WeatherControlContext.Provider>
  )
}

interface WeatherControlProps {
  dayNightMode: DayNightMode
  weather: WeatherType
  onDayNightChange: (mode: DayNightMode) => void
  onWeatherChange: (type: WeatherType) => void
  onRandomRegenerate: () => void
}

function WeatherControl({
  dayNightMode,
  weather,
  onDayNightChange,
  onWeatherChange,
  onRandomRegenerate,
}: WeatherControlProps) {
  return (
    <ControlPanel
      dayNightMode={dayNightMode}
      weather={weather}
      onDayNightChange={onDayNightChange}
      onWeatherChange={onWeatherChange}
      onRandomRegenerate={onRandomRegenerate}
    />
  )
}

export default WeatherControl
