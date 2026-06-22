import { useStore } from '../App'

export default function SettingsPanel() {
  const settingsOpen = useStore((s) => s.settingsOpen)
  const density = useStore((s) => s.density)
  const speed = useStore((s) => s.speed)
  const setDensity = useStore((s) => s.setDensity)
  const setSpeed = useStore((s) => s.setSpeed)

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100%',
        width: 260,
        background: 'rgba(26,26,46,0.95)',
        backdropFilter: 'blur(12px)',
        transform: settingsOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 999,
        padding: '60px 24px 24px',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        boxShadow: settingsOpen ? '-10px 0 30px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      <h3
        style={{
          color: '#E0E0E0',
          fontSize: 18,
          marginBottom: 32,
          fontWeight: 600,
          letterSpacing: 2,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: 16,
        }}
      >
        ⚙ 设置
      </h3>

      <div style={{ marginBottom: 32 }}>
        <label
          style={{
            color: '#CCCCCC',
            fontSize: 14,
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <span>气泡密度</span>
          <span style={{ color: '#FFD93D', fontFamily: 'monospace' }}>{density}</span>
        </label>
        <input
          type="range"
          min={10}
          max={40}
          value={density}
          onChange={(e) => setDensity(Number(e.target.value))}
          style={{
            width: '100%',
            height: 6,
            appearance: 'none',
            background: '#333',
            borderRadius: 3,
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: '#666',
            fontSize: 12,
            marginTop: 4,
          }}
        >
          <span>10</span>
          <span>40</span>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <label
          style={{
            color: '#CCCCCC',
            fontSize: 14,
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <span>移动速度</span>
          <span style={{ color: '#FFD93D', fontFamily: 'monospace' }}>
            {speed.toFixed(1)}
          </span>
        </label>
        <input
          type="range"
          min={0.1}
          max={1.0}
          step={0.1}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          style={{
            width: '100%',
            height: 6,
            appearance: 'none',
            background: '#333',
            borderRadius: 3,
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: '#666',
            fontSize: 12,
            marginTop: 4,
          }}
        >
          <span>0.1</span>
          <span>1.0</span>
        </div>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FFD93D;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(255,217,61,0.5);
          border: none;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FFD93D;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(255,217,61,0.5);
          border: none;
        }
      `}</style>
    </div>
  )
}
