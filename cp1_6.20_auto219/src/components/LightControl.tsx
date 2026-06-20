import { useSceneStore } from '@/store/SceneStore'
import { Sun } from 'lucide-react'
import { useCallback } from 'react'

export default function LightControl() {
  const { lightParams, updateLightParams } = useSceneStore()

  const handleMainAngle = useCallback((v: number) => {
    updateLightParams({ mainLightAngle: v })
  }, [updateLightParams])

  const handleMainIntensity = useCallback((v: number) => {
    updateLightParams({ mainLightIntensity: v })
  }, [updateLightParams])

  const handleFillIntensity = useCallback((v: number) => {
    updateLightParams({ fillLightIntensity: v })
  }, [updateLightParams])

  const handleAmbient = useCallback((v: number) => {
    updateLightParams({ ambientIntensity: v })
  }, [updateLightParams])

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        width: 220,
        padding: '14px 16px',
        borderRadius: 12,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Sun size={16} style={{ color: '#ffd700' }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#ccc' }}>光照控制</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SliderControl
          label="主光角度"
          value={lightParams.mainLightAngle}
          min={0}
          max={360}
          step={1}
          unit="°"
          onChange={handleMainAngle}
          accentColor="#ffd700"
        />

        <SliderControl
          label="主光强度"
          value={lightParams.mainLightIntensity}
          min={0}
          max={3}
          step={0.05}
          onChange={handleMainIntensity}
          accentColor="#ffd700"
        />

        <SliderControl
          label="辅光强度"
          value={lightParams.fillLightIntensity}
          min={0}
          max={3}
          step={0.05}
          onChange={handleFillIntensity}
          accentColor="#4169e1"
        />

        <SliderControl
          label="环境光"
          value={lightParams.ambientIntensity}
          min={0}
          max={1}
          step={0.02}
          onChange={handleAmbient}
          accentColor="#8888aa"
        />
      </div>
    </div>
  )
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  onChange,
  accentColor,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (v: number) => void
  accentColor: string
}) {
  const displayValue = Number.isInteger(value) ? value : value.toFixed(2)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '11px', color: '#888' }}>{label}</span>
        <span style={{
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: accentColor,
        }}>
          {displayValue}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  )
}
