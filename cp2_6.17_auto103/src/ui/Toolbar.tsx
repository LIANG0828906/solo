import React from 'react'
import { useParticleStore, Preset } from '../store'

const presets: { value: Preset; label: string }[] = [
  { value: 'fire', label: '火焰' },
  { value: 'smoke', label: '烟雾' },
  { value: 'snow', label: '雪花' },
  { value: 'explosion', label: '爆炸' },
]

export const Toolbar: React.FC = () => {
  const { activePreset, applyPreset } = useParticleStore()

  const handlePreset = (preset: Preset) => {
    applyPreset(preset)
    const worker = (window as any).__particleWorker
    if (worker) {
      worker.postMessage({ type: 'clear' })
      worker.postMessage({
        type: 'setParams',
        payload: useParticleStore.getState(),
      })
    }
  }

  return (
    <div className="toolbar">
      {presets.map((p) => (
        <button
          key={p.value}
          className={`preset-btn ${activePreset === p.value ? 'active' : ''}`}
          onClick={() => handlePreset(p.value)}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
