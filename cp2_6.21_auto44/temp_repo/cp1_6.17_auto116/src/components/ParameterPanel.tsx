import { useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function ParameterPanel() {
  const particleCount = useAppStore((state) => state.particleCount)
  const speedMultiplier = useAppStore((state) => state.speedMultiplier)
  const colorSaturation = useAppStore((state) => state.colorSaturation)
  const glowIntensity = useAppStore((state) => state.glowIntensity)

  const setParticleCount = useAppStore((state) => state.setParticleCount)
  const setSpeedMultiplier = useAppStore((state) => state.setSpeedMultiplier)
  const setColorSaturation = useAppStore((state) => state.setColorSaturation)
  const setGlowIntensity = useAppStore((state) => state.setGlowIntensity)

  const handleParticleCountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setParticleCount(parseInt(e.target.value))
    },
    [setParticleCount],
  )

  const handleSpeedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSpeedMultiplier(parseFloat(e.target.value))
    },
    [setSpeedMultiplier],
  )

  const handleSaturationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setColorSaturation(parseInt(e.target.value))
    },
    [setColorSaturation],
  )

  const handleGlowChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setGlowIntensity(parseFloat(e.target.value))
    },
    [setGlowIntensity],
  )

  return (
    <div className="parameter-panel">
      <div className="parameter-item">
        <div className="parameter-label">
          <span>粒子数量</span>
          <span className="parameter-value">{particleCount.toLocaleString()}</span>
        </div>
        <input
          type="range"
          className="parameter-slider"
          min="5000"
          max="50000"
          step="1000"
          value={particleCount}
          onChange={handleParticleCountChange}
        />
      </div>

      <div className="parameter-item">
        <div className="parameter-label">
          <span>运动速度</span>
          <span className="parameter-value">{speedMultiplier.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          className="parameter-slider"
          min="0.5"
          max="2.0"
          step="0.1"
          value={speedMultiplier}
          onChange={handleSpeedChange}
        />
      </div>

      <div className="parameter-item">
        <div className="parameter-label">
          <span>颜色饱和度</span>
          <span className="parameter-value">{colorSaturation}%</span>
        </div>
        <input
          type="range"
          className="parameter-slider"
          min="0"
          max="100"
          step="1"
          value={colorSaturation}
          onChange={handleSaturationChange}
        />
      </div>

      <div className="parameter-item">
        <div className="parameter-label">
          <span>发光强度</span>
          <span className="parameter-value">{glowIntensity.toFixed(2)}</span>
        </div>
        <input
          type="range"
          className="parameter-slider"
          min="0"
          max="1.0"
          step="0.01"
          value={glowIntensity}
          onChange={handleGlowChange}
        />
      </div>
    </div>
  )
}
