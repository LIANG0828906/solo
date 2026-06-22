import { useStore } from '@/store/useStore'
import { Play, Pause, Scissors } from 'lucide-react'

export default function ControlBar() {
  const autoRotate = useStore((s) => s.autoRotate)
  const toggleAutoRotate = useStore((s) => s.toggleAutoRotate)
  const clipPlaneY = useStore((s) => s.clipPlaneY)
  const setClipPlaneY = useStore((s) => s.setClipPlaneY)
  const clipEnabled = useStore((s) => s.clipEnabled)
  const setClipEnabled = useStore((s) => s.setClipEnabled)

  const handleClipSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setClipPlaneY(val)
  }

  const minClip = -4
  const maxClip = 4

  return (
    <div className="control-bar">
      <div className="control-section">
        <button
          className={`clip-toggle ${clipEnabled ? 'active' : ''}`}
          onClick={() => setClipEnabled(!clipEnabled)}
          title={clipEnabled ? '关闭剖切' : '开启剖切'}
        >
          <Scissors size={16} />
          <span className="clip-label">剖切</span>
        </button>
        <div className="slider-container">
          <input
            type="range"
            min={minClip}
            max={maxClip}
            step={0.05}
            value={clipPlaneY}
            onChange={handleClipSlider}
            className="clip-slider"
            disabled={!clipEnabled}
          />
          <span className="slider-value">{clipPlaneY.toFixed(1)}</span>
        </div>
      </div>
      <div className="control-divider" />
      <button
        className="play-btn"
        onClick={toggleAutoRotate}
        title={autoRotate ? '暂停旋转' : '自动旋转'}
      >
        {autoRotate ? <Pause size={18} /> : <Play size={18} />}
      </button>
    </div>
  )
}
