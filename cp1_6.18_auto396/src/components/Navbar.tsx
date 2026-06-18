import { useStore } from '@/store/useStore'
import type { ViewMode } from '@/types'
import './Navbar.css'

export function Navbar() {
  const { viewMode, setViewMode } = useStore()

  const modes: { key: ViewMode; label: string }[] = [
    { key: 'size', label: '相对大小' },
    { key: 'distance', label: '相对距离' },
  ]

  return (
    <nav className="navbar">
      <h1 className="app-title">太阳系脉搏</h1>
      <div className="mode-buttons">
        {modes.map((mode) => (
          <button
            key={mode.key}
            className={`mode-btn ${viewMode === mode.key ? 'active' : ''}`}
            onClick={() => setViewMode(mode.key)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
