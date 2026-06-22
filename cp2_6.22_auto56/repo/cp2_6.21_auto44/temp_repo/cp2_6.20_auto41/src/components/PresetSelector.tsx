
import { PRESET_CONFIGS, VisualizerPreset } from '@/types'
import { useControlParams, useVisualizerStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

export default function PresetSelector() {
  const controlParams = useControlParams()
  const { setPreset } = useVisualizerStore()

  const presets: { key: VisualizerPreset; label: string }[] = [
    { key: 'nebula', label: PRESET_CONFIGS.nebula.label },
    { key: 'pulse', label: PRESET_CONFIGS.pulse.label },
    { key: 'spiral', label: PRESET_CONFIGS.spiral.label },
  ]

  return (
    <div className="fixed left-1/2 top-[65%] -translate-x-1/2 z-20">
      <div className="flex gap-3 fade-in stagger-1">
        {presets.map((preset) => (
          <button
            key={preset.key}
            onClick={() => setPreset(preset.key)}
            className={cn(
              'btn-glass px-6 py-3 preset-transition',
              controlParams.currentPreset === preset.key && 'active'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
