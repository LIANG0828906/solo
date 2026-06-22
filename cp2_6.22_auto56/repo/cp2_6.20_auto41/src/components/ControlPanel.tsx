import { useState, useRef } from 'react'
import {
  useControlParams,
  useVisualizerStore,
  useAudioState,
} from '@/store/useStore'
import { Layers, Eye, Zap } from 'lucide-react'
import { VisualizationMode } from '@/types'
import { cn } from '@/lib/utils'

interface SliderConfig {
  key: keyof Omit<
    typeof useControlParams extends () => infer T
      ? T
      : never,
    'currentPreset' | 'visualizationMode' | 'performanceMode'
  >
  label: string
  min: number
  max: number
  step: number
  unit?: string
}

export default function ControlPanel() {
  const controlParams = useControlParams()
  const { setControlParams, setVisualizationMode } = useVisualizerStore()
  const audioState = useAudioState()
  const [animatingKey, setAnimatingKey] = useState<string | null>(null)
  const prevValuesRef = useRef<Record<string, number>>({})

  const sliders: SliderConfig[] = [
    { key: 'particleCount', label: '粒子数量', min: 1000, max: 8000, step: 100 },
    { key: 'speed', label: '速度', min: 0.1, max: 3.0, step: 0.1, unit: 'x' },
    { key: 'colorSensitivity', label: '色彩敏感度', min: 0.2, max: 2.0, step: 0.1 },
    { key: 'opacity', label: '透明度', min: 0.2, max: 1.0, step: 0.1 },
  ]

  const modes: { key: VisualizationMode; label: string; icon: React.ReactNode }[] = [
    { key: '3d', label: '3D', icon: <Layers className="w-4 h-4" /> },
    { key: '2d', label: '2D', icon: <Eye className="w-4 h-4" /> },
    { key: 'spectrum', label: '频谱', icon: <Zap className="w-4 h-4" /> },
  ]

  const handleSliderChange = (key: SliderConfig['key'], value: number) => {
    const prevValue = prevValuesRef.current[key]
    setControlParams({ [key]: value })
    if (prevValue !== undefined && prevValue !== value) {
      setAnimatingKey(key)
      setTimeout(() => setAnimatingKey(null), 200)
    }
    prevValuesRef.current[key] = value
  }

  const formatValue = (value: number, unit?: string) => {
    return `${value}${unit || ''}`
  }

  if (!audioState.currentFileName) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-20">
      <div className="glass-panel p-6 w-72 fade-in stagger-2">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">控制面板</h3>

        <div className="space-y-5">
          {sliders.map((slider, index) => (
            <div
              key={slider.key}
              className={cn('fade-in', `stagger-${index + 1}`)}
              style={{ opacity: 1 }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">{slider.label}</span>
                <span
                  className={cn(
                    'slider-value-animate text-sm font-medium text-blue-400',
                    animatingKey === slider.key && 'changing'
                  )}
                >
                  {formatValue(controlParams[slider.key], slider.unit)}
                </span>
              </div>
              <div className="slider-container">
                <input
                  type="range"
                  className="slider"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={controlParams[slider.key]}
                  onChange={(e) =>
                    handleSliderChange(slider.key, parseFloat(e.target.value))
                  }
                />
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-white/10">
            <span className="text-sm text-gray-300 block mb-3">可视化模式</span>
            <div className="flex gap-2">
              {modes.map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setVisualizationMode(mode.key)}
                  className={cn(
                    'btn-glass flex-1 py-2 px-3 flex items-center justify-center gap-2',
                    controlParams.visualizationMode === mode.key && 'active'
                  )}
                >
                  {mode.icon}
                  <span className="text-xs">{mode.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
