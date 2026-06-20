import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  Play,
  Pause,
  RotateCcw,
  Cloud,
  Sun,
  Trash2,
  Plus,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { ValuePopup } from './ValuePopup'
import { formatDate, formatTime, getSolarTerm } from '@/utils/dateUtils'
import type { BuildingModel } from '@/types'

interface ControlPanelProps {
  className?: string
}

interface PresetCity {
  name: string
  latitude: number
  longitude: number
}

interface PresetModel {
  type: 'skyscraper' | 'villa' | 'complex'
  name: string
  defaultPosition: [number, number, number]
  defaultScale: [number, number, number]
}

const PRESET_CITIES: PresetCity[] = [
  { name: '北京', latitude: 39.9, longitude: 116.4 },
  { name: '纽约', latitude: 40.7, longitude: -74.0 },
  { name: '新加坡', latitude: 1.35, longitude: 103.8 },
  { name: '东京', latitude: 35.7, longitude: 139.7 },
  { name: '伦敦', latitude: 51.5, longitude: -0.1 },
]

const PRESET_MODELS: PresetModel[] = [
  {
    type: 'skyscraper',
    name: '摩天大楼',
    defaultPosition: [0, 0, 0],
    defaultScale: [1, 1, 1],
  },
  {
    type: 'villa',
    name: '独立别墅',
    defaultPosition: [-15, 0, -15],
    defaultScale: [1, 1, 1],
  },
  {
    type: 'complex',
    name: '商业综合体',
    defaultPosition: [15, 0, 15],
    defaultScale: [1, 1, 1],
  },
]

const PLAY_SPEEDS: Array<{ value: 1 | 2 | 4; label: string }> = [
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 4, label: '4x' },
]

const TIME_STEP = 10 / 60

const modelTypeNames: Record<string, string> = {
  skyscraper: '摩天大楼',
  villa: '独立别墅',
  complex: '商业综合体',
  custom: '自定义模型',
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ className }) => {
  const {
    config,
    buildings,
    selectedBuildingId,
    setConfig,
    addBuilding,
    removeBuilding,
    selectBuilding,
    startPlayback,
    pausePlayback,
    resetPlayback,
    runAnalysis,
  } = useAppStore()

  const [dateValue, setDateValue] = useState(config.date)
  const [timeValue, setTimeValue] = useState(config.time)
  const [isDraggingDate, setIsDraggingDate] = useState(false)
  const [isDraggingTime, setIsDraggingTime] = useState(false)
  const [datePopupPosition, setDatePopupPosition] = useState<{ x: number; y: number } | null>(null)
  const [timePopupPosition, setTimePopupPosition] = useState<{ x: number; y: number } | null>(null)
  const [selectedModelType, setSelectedModelType] = useState<'skyscraper' | 'villa' | 'complex'>('skyscraper')
  const [isExpanded, setIsExpanded] = useState(true)

  const dateSliderRef = useRef<HTMLInputElement>(null)
  const timeSliderRef = useRef<HTMLInputElement>(null)
  const dateDebounceRef = useRef<number | null>(null)
  const timeDebounceRef = useRef<number | null>(null)

  const updateSliderPosition = useCallback(
    (slider: HTMLInputElement, setPosition: (pos: { x: number; y: number } | null) => void) => {
      const rect = slider.getBoundingClientRect()
      const sliderThumb = slider.querySelector('input[type="range"]') as HTMLInputElement
      const min = Number(sliderThumb.min)
      const max = Number(sliderThumb.max)
      const value = Number(sliderThumb.value)
      const percentage = (value - min) / (max - min)
      const x = rect.left + percentage * rect.width
      const y = rect.top
      setPosition({ x, y })
    },
    []
  )

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value)
      setDateValue(value)
      setIsDraggingDate(true)

      if (dateSliderRef.current) {
        updateSliderPosition(dateSliderRef.current, setDatePopupPosition)
      }

      if (dateDebounceRef.current) {
        clearTimeout(dateDebounceRef.current)
      }
      dateDebounceRef.current = window.setTimeout(() => {
        setConfig({ date: value })
      }, 250)
    },
    [setConfig, updateSliderPosition]
  )

  const handleDateDragEnd = useCallback(() => {
    setIsDraggingDate(false)
    setConfig({ date: dateValue })
    if (dateDebounceRef.current) {
      clearTimeout(dateDebounceRef.current)
    }
  }, [dateValue, setConfig])

  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value)
      setTimeValue(value)
      setIsDraggingTime(true)

      if (timeSliderRef.current) {
        updateSliderPosition(timeSliderRef.current, setTimePopupPosition)
      }

      if (timeDebounceRef.current) {
        clearTimeout(timeDebounceRef.current)
      }
      timeDebounceRef.current = window.setTimeout(() => {
        setConfig({ time: value })
      }, 250)
    },
    [setConfig, updateSliderPosition]
  )

  const handleTimeDragEnd = useCallback(() => {
    setIsDraggingTime(false)
    setConfig({ time: timeValue })
    if (timeDebounceRef.current) {
      clearTimeout(timeDebounceRef.current)
    }
  }, [timeValue, setConfig])

  const handleCityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const cityName = e.target.value
      const city = PRESET_CITIES.find((c) => c.name === cityName)
      if (city) {
        setConfig({
          location: {
            latitude: city.latitude,
            longitude: city.longitude,
            cityName: city.name,
          },
        })
      }
    },
    [setConfig]
  )

  const handleLatitudeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value)
      if (!isNaN(value) && value >= -90 && value <= 90) {
        setConfig({
          location: {
            ...config.location,
            latitude: value,
            cityName: undefined,
          },
        })
      }
    },
    [config.location, setConfig]
  )

  const handleLongitudeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value)
      if (!isNaN(value) && value >= -180 && value <= 180) {
        setConfig({
          location: {
            ...config.location,
            longitude: value,
            cityName: undefined,
          },
        })
      }
    },
    [config.location, setConfig]
  )

  const handleAddBuilding = useCallback(() => {
    if (buildings.length >= 3) return

    const preset = PRESET_MODELS.find((m) => m.type === selectedModelType)
    if (!preset) return

    const existingPositions = buildings.map((b) => b.position)
    let position: [number, number, number] = preset.defaultPosition

    for (const existing of existingPositions) {
      if (
        Math.abs(existing[0] - position[0]) < 5 &&
        Math.abs(existing[2] - position[2]) < 5
      ) {
        const offset = (buildings.length + 1) * 12
        position = [offset - 18, 0, offset - 18]
        break
      }
    }

    addBuilding({
      name: `${preset.name} ${buildings.length + 1}`,
      modelType: preset.type,
      position,
      rotation: [0, 0, 0],
      scale: preset.defaultScale,
    })
  }, [selectedModelType, buildings, addBuilding])

  const handleRemoveBuilding = useCallback(
    (id: string) => {
      removeBuilding(id)
      if (selectedBuildingId === id) {
        selectBuilding(null)
      }
    },
    [removeBuilding, selectBuilding, selectedBuildingId]
  )

  const handleUploadModel = useCallback(() => {
    if (buildings.length >= 3) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.glb,.gltf'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        addBuilding({
          name: file.name.replace(/\.[^/.]+$/, ''),
          modelType: 'custom',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        })
      }
    }
    input.click()
  }, [buildings.length, addBuilding])

  const handlePlayPause = useCallback(() => {
    if (config.isPlaying) {
      pausePlayback()
    } else {
      startPlayback()
    }
  }, [config.isPlaying, pausePlayback, startPlayback])

  const handleSpeedChange = useCallback(
    (speed: 1 | 2 | 4) => {
      setConfig({ playSpeed: speed })
    },
    [setConfig]
  )

  const handleWeatherToggle = useCallback(() => {
    setConfig({ isCloudy: !config.isCloudy })
  }, [config.isCloudy, setConfig])

  const handleRunAnalysis = useCallback(() => {
    runAnalysis()
  }, [runAnalysis])

  useEffect(() => {
    if (!config.isPlaying) {
      setDateValue(config.date)
      setTimeValue(config.time)
    }
  }, [config.date, config.time, config.isPlaying])

  useEffect(() => {
    return () => {
      if (dateDebounceRef.current) clearTimeout(dateDebounceRef.current)
      if (timeDebounceRef.current) clearTimeout(timeDebounceRef.current)
    }
  }, [])

  const solarTerm = getSolarTerm(dateValue)
  const isDisabled = config.isPlaying

  return (
    <div
      className={cn(
        'relative w-full max-w-md transition-all duration-500 ease-out',
        className
      )}
    >
      <style>{`
        @keyframes neonPulse {
          0%, 100% {
            box-shadow: 0 0 5px rgba(34, 211, 238, 0.3),
                        0 0 10px rgba(34, 211, 238, 0.2),
                        inset 0 0 5px rgba(34, 211, 238, 0.1);
            border-color: rgba(34, 211, 238, 0.3);
          }
          50% {
            box-shadow: 0 0 15px rgba(34, 211, 238, 0.5),
                        0 0 30px rgba(34, 211, 238, 0.3),
                        inset 0 0 15px rgba(34, 211, 238, 0.2);
            border-color: rgba(34, 211, 238, 0.6);
          }
        }
        
        @keyframes sliderGlow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(34, 211, 238, 0.8),
                        0 0 10px rgba(34, 211, 238, 0.5);
          }
          50% {
            box-shadow: 0 0 15px rgba(34, 211, 238, 1),
                        0 0 25px rgba(34, 211, 238, 0.7);
          }
        }
        
        .btn-neon-hover:hover {
          animation: neonPulse 2s ease-in-out infinite;
        }
        
        .btn-press:active {
          transform: scale(0.97);
          transition: transform 0.1s ease-out;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
          cursor: pointer;
          animation: sliderGlow 2s ease-in-out infinite;
          transition: all 0.2s ease;
          border: 2px solid #ffffff;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
          cursor: pointer;
          animation: sliderGlow 2s ease-in-out infinite;
          transition: all 0.2s ease;
          border: 2px solid #ffffff;
        }
        
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
        }
        
        input[type="range"]:disabled::-webkit-slider-thumb {
          background: #475569;
          animation: none;
          cursor: not-allowed;
        }
        
        input[type="range"]:disabled::-moz-range-thumb {
          background: #475569;
          animation: none;
          cursor: not-allowed;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 2px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.4);
          border-radius: 2px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.6);
        }
      `}</style>

      <div
        className={cn(
          'relative bg-slate-900/70 backdrop-blur-xl border border-cyan-400/30 rounded-2xl overflow-hidden transition-all duration-500 ease-out',
          isExpanded ? 'max-h-[900px]' : 'max-h-[60px]'
        )}
        style={{ borderRadius: '16px' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-cyan-400/20 cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h2 className="text-xl font-bold text-white tracking-wide">
            日照参数控制
          </h2>
          <button
            className={cn(
              'text-cyan-400 transition-transform duration-300',
              isExpanded ? 'rotate-180' : ''
            )}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        <div
          className={cn(
            'p-5 space-y-6 transition-opacity duration-300 overflow-y-auto scrollbar-thin',
            isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          style={{ maxHeight: 'calc(90vh - 120px)' }}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-cyan-300">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">日期设置</span>
              <span className="ml-auto text-xs text-slate-400">
                {formatDate(dateValue)}
                {solarTerm && (
                  <span className="ml-2 text-emerald-400">· {solarTerm}</span>
                )}
              </span>
            </div>
            <div ref={dateSliderRef} className="relative">
              <input
                type="range"
                min={1}
                max={365}
                step={1}
                value={dateValue}
                onChange={handleDateChange}
                onMouseUp={handleDateDragEnd}
                onMouseLeave={handleDateDragEnd}
                onTouchEnd={handleDateDragEnd}
                disabled={isDisabled}
                className={cn(
                  'w-full h-2 rounded-lg appearance-none cursor-pointer',
                  'bg-gradient-to-r from-cyan-900/50 via-slate-700 to-amber-900/50',
                  isDisabled && 'opacity-50 cursor-not-allowed'
                )}
              />
              <ValuePopup
                visible={isDraggingDate}
                value={formatDate(dateValue).slice(0, -1)}
                subtitle={solarTerm || `第 ${dateValue} 天`}
                iconType="date"
                position={datePopupPosition || undefined}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 px-1">
              <span>1月1日</span>
              <span>6月21日</span>
              <span>12月31日</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-cyan-300">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">时间设置</span>
              <span className="ml-auto text-xs text-slate-400">
                {formatTime(timeValue)}
              </span>
            </div>
            <div ref={timeSliderRef} className="relative">
              <input
                type="range"
                min={6}
                max={19}
                step={TIME_STEP}
                value={timeValue}
                onChange={handleTimeChange}
                onMouseUp={handleTimeDragEnd}
                onMouseLeave={handleTimeDragEnd}
                onTouchEnd={handleTimeDragEnd}
                disabled={isDisabled}
                className={cn(
                  'w-full h-2 rounded-lg appearance-none cursor-pointer',
                  'bg-gradient-to-r from-indigo-900/50 via-amber-500/50 to-indigo-900/50',
                  isDisabled && 'opacity-50 cursor-not-allowed'
                )}
              />
              <ValuePopup
                visible={isDraggingTime}
                value={formatTime(timeValue)}
                subtitle={
                  timeValue < 9
                    ? '早晨'
                    : timeValue < 12
                    ? '上午'
                    : timeValue < 14
                    ? '中午'
                    : timeValue < 18
                    ? '下午'
                    : '傍晚'
                }
                iconType="time"
                position={timePopupPosition || undefined}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 px-1">
              <span>06:00</span>
              <span>12:00</span>
              <span>19:00</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-cyan-300">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">地理位置</span>
            </div>
            <div className="space-y-3">
              <select
                value={config.location.cityName || ''}
                onChange={handleCityChange}
                disabled={isDisabled}
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-cyan-400/30 text-white text-sm',
                  'focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40',
                  'transition-all duration-200 btn-neon-hover btn-press',
                  isDisabled && 'opacity-50 cursor-not-allowed'
                )}
                style={{ borderRadius: '12px' }}
              >
                <option value="" disabled>
                  选择预设城市
                </option>
                {PRESET_CITIES.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name} ({city.latitude.toFixed(1)}°N,{' '}
                    {city.longitude.toFixed(1)}°E)
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">纬度 (°N)</label>
                  <input
                    type="number"
                    value={config.location.latitude}
                    onChange={handleLatitudeChange}
                    min={-90}
                    max={90}
                    step={0.1}
                    disabled={isDisabled}
                    className={cn(
                      'w-full px-3 py-2 rounded-xl bg-slate-800/60 border border-cyan-400/30 text-white text-sm',
                      'focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40',
                      'transition-all duration-200 btn-neon-hover btn-press',
                      isDisabled && 'opacity-50 cursor-not-allowed'
                    )}
                    style={{ borderRadius: '12px' }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">经度 (°E)</label>
                  <input
                    type="number"
                    value={config.location.longitude}
                    onChange={handleLongitudeChange}
                    min={-180}
                    max={180}
                    step={0.1}
                    disabled={isDisabled}
                    className={cn(
                      'w-full px-3 py-2 rounded-xl bg-slate-800/60 border border-cyan-400/30 text-white text-sm',
                      'focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40',
                      'transition-all duration-200 btn-neon-hover btn-press',
                      isDisabled && 'opacity-50 cursor-not-allowed'
                    )}
                    style={{ borderRadius: '12px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-cyan-300">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-medium">建筑模型</span>
              <span className="ml-auto text-xs text-slate-400">
                {buildings.length}/3
              </span>
            </div>

            <div className="space-y-2">
              {buildings.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-sm">
                  暂无建筑模型，请添加
                </div>
              ) : (
                buildings.map((building: BuildingModel) => (
                  <div
                    key={building.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200',
                      building.isSelected
                        ? 'bg-cyan-500/10 border-cyan-400/50'
                        : 'bg-slate-800/40 border-slate-700/50 hover:border-cyan-400/30'
                    )}
                    style={{ borderRadius: '12px' }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: building.shadowColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">
                        {building.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {modelTypeNames[building.modelType] || building.modelType}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveBuilding(building.id)}
                      disabled={isDisabled}
                      className={cn(
                        'p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300',
                        'transition-all duration-200 btn-press',
                        isDisabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <select
                value={selectedModelType}
                onChange={(e) =>
                  setSelectedModelType(
                    e.target.value as 'skyscraper' | 'villa' | 'complex'
                  )
                }
                disabled={isDisabled || buildings.length >= 3}
                className={cn(
                  'flex-1 px-3 py-2.5 rounded-xl bg-slate-800/60 border border-cyan-400/30 text-white text-sm',
                  'focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40',
                  'transition-all duration-200 btn-neon-hover btn-press',
                  (isDisabled || buildings.length >= 3) &&
                    'opacity-50 cursor-not-allowed'
                )}
                style={{ borderRadius: '12px' }}
              >
                {PRESET_MODELS.map((model) => (
                  <option key={model.type} value={model.type}>
                    {model.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAddBuilding}
                disabled={isDisabled || buildings.length >= 3}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 rounded-xl',
                  'bg-emerald-600/80 hover:bg-emerald-500/80 text-white text-sm font-medium',
                  'border border-emerald-400/40',
                  'transition-all duration-200 btn-neon-hover btn-press',
                  (isDisabled || buildings.length >= 3) &&
                    'opacity-50 cursor-not-allowed'
                )}
                style={{ borderRadius: '12px' }}
              >
                <Plus className="w-4 h-4" />
                添加
              </button>

              <button
                onClick={handleUploadModel}
                disabled={isDisabled || buildings.length >= 3}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 rounded-xl',
                  'bg-violet-600/80 hover:bg-violet-500/80 text-white text-sm font-medium',
                  'border border-violet-400/40',
                  'transition-all duration-200 btn-neon-hover btn-press',
                  (isDisabled || buildings.length >= 3) &&
                    'opacity-50 cursor-not-allowed'
                )}
                style={{ borderRadius: '12px' }}
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-cyan-300">
              {config.isPlaying ? (
                <Play className="w-4 h-4 animate-pulse" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">播放控制</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl',
                  config.isPlaying
                    ? 'bg-amber-600/80 hover:bg-amber-500/80 border-amber-400/40'
                    : 'bg-cyan-600/80 hover:bg-cyan-500/80 border-cyan-400/40',
                  'text-white font-medium border',
                  'transition-all duration-200 btn-neon-hover btn-press'
                )}
                style={{ borderRadius: '12px' }}
              >
                {config.isPlaying ? (
                  <>
                    <Pause className="w-5 h-5" />
                    暂停
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    播放
                  </>
                )}
              </button>

              <button
                onClick={resetPlayback}
                disabled={isDisabled}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-xl',
                  'bg-slate-700/80 hover:bg-slate-600/80 text-white border border-slate-500/40',
                  'transition-all duration-200 btn-neon-hover btn-press',
                  isDisabled && 'opacity-50 cursor-not-allowed'
                )}
                style={{ borderRadius: '12px' }}
              >
                <RotateCcw className="w-5 h-5" />
                重置
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">速度:</span>
              {PLAY_SPEEDS.map((speed) => (
                <button
                  key={speed.value}
                  onClick={() => handleSpeedChange(speed.value)}
                  disabled={isDisabled}
                  className={cn(
                    'flex-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 btn-press',
                    config.playSpeed === speed.value
                      ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300'
                      : 'bg-slate-800/40 border-slate-600/40 text-slate-400 hover:border-cyan-400/30',
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                  style={{ borderRadius: '8px' }}
                >
                  {speed.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-cyan-300">
              <Sun className="w-4 h-4" />
              <span className="text-sm font-medium">天气设置</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => config.isCloudy && handleWeatherToggle()}
                disabled={isDisabled}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 btn-neon-hover btn-press',
                  !config.isCloudy
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                    : 'bg-slate-800/40 border-slate-600/40 text-slate-400 hover:border-amber-400/30',
                  isDisabled && 'opacity-50 cursor-not-allowed'
                )}
                style={{ borderRadius: '12px' }}
              >
                <Sun className="w-5 h-5" />
                晴天
              </button>

              <button
                onClick={() => !config.isCloudy && handleWeatherToggle()}
                disabled={isDisabled}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 btn-neon-hover btn-press',
                  config.isCloudy
                    ? 'bg-slate-500/20 border-slate-400/60 text-slate-300'
                    : 'bg-slate-800/40 border-slate-600/40 text-slate-400 hover:border-slate-400/30',
                  isDisabled && 'opacity-50 cursor-not-allowed'
                )}
                style={{ borderRadius: '12px' }}
              >
                <Cloud className="w-5 h-5" />
                阴天
              </button>
            </div>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={buildings.length === 0 || isDisabled}
            className={cn(
              'w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl',
              'bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600',
              'hover:from-cyan-500 hover:via-blue-500 hover:to-violet-500',
              'text-white font-bold text-lg border border-cyan-300/50',
              'shadow-lg shadow-cyan-500/30',
              'transition-all duration-300 btn-neon-hover btn-press',
              (buildings.length === 0 || isDisabled) &&
                'opacity-50 cursor-not-allowed from-slate-600 via-slate-600 to-slate-600'
            )}
            style={{ borderRadius: '16px' }}
          >
            <Sun className="w-6 h-6" />
            开始日照分析
          </button>
        </div>
      </div>
    </div>
  )
}

export default ControlPanel
