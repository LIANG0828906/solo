import { useStore } from '@/store/useStore'
import './InfoPanel/InfoPanel.css'

export default function DepthIndicator() {
  const depth = useStore((s) => s.depth)
  const maxDepth = 120
  const percentage = Math.min(100, (depth / maxDepth) * 100)
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="depth-indicator">
      <div className="depth-gauge">
        <svg viewBox="0 0 56 56">
          <defs>
            <linearGradient id="depthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4DD0E1" />
              <stop offset="50%" stopColor="#2196F3" />
              <stop offset="100%" stopColor="#FF6B6B" />
            </linearGradient>
          </defs>
          <circle
            className="gauge-bg"
            cx="28"
            cy="28"
            r={radius}
          />
          <circle
            className="gauge-fill"
            cx="28"
            cy="28"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 28 28)"
          />
          <text
            x="28"
            y="32"
            textAnchor="middle"
            className="gauge-text"
          >
            DEPTH
          </text>
        </svg>
      </div>
      <div className="depth-info">
        <span className="depth-label">当前深度</span>
        <div>
          <span className="depth-value">{depth.toFixed(0)}</span>
          <span className="depth-unit">米</span>
        </div>
      </div>
    </div>
  )
}
