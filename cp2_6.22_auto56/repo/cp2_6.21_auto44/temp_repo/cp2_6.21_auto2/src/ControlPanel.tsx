import { useAppStore } from './store'
import { useMemo } from 'react'

const lerpColorHex = (a: string, b: string, t: number): string => {
  const ah = parseInt(a.replace('#', ''), 16)
  const bh = parseInt(b.replace('#', ''), 16)
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `rgb(${r},${g},${bl})`
}

const ControlPanel = () => {
  const environment = useAppStore((s) => s.environment)
  const smoothedEnv = useAppStore((s) => s.smoothedEnv)
  const setEnvironment = useAppStore((s) => s.setEnvironment)
  const resetEnvironment = useAppStore((s) => s.resetEnvironment)
  const startSimulation = useAppStore((s) => s.startSimulation)
  const isSimulating = useAppStore((s) => s.isSimulating)
  const growthStage = useAppStore((s) => s.growthStage)

  const lightDisplay = Math.round(smoothedEnv.light)
  const waterDisplay = Math.round(smoothedEnv.water)
  const tempDisplay = Math.round(smoothedEnv.temperature)

  const lightBg = useMemo(() => {
    const t = environment.light / 100
    const col = lerpColorHex('#5c4a00', '#fff6c2', t)
    return `linear-gradient(to right, ${col} 0%, #ffffff ${t * 100}%, rgba(255,255,255,0.15) ${t * 100}%, rgba(255,255,255,0.15) 100%)`
  }, [environment.light])

  const waterBg = useMemo(() => {
    const t = environment.water / 100
    const col = lerpColorHex('#1e3a5f', '#7be4ff', t)
    return `linear-gradient(to right, ${col} 0%, #a8f0ff ${t * 100}%, rgba(255,255,255,0.15) ${t * 100}%, rgba(255,255,255,0.15) 100%)`
  }, [environment.water])

  const tempBg = useMemo(() => {
    const t = (environment.temperature - 10) / 30
    const cold = '#4dc9ff'
    const mid = '#ffcc66'
    const hot = '#ff5555'
    const col = t < 0.5
      ? lerpColorHex(cold, mid, t * 2)
      : lerpColorHex(mid, hot, (t - 0.5) * 2)
    return `linear-gradient(to right, ${hot} 0%, ${mid} 50%, ${cold} 100%)`
  }, [environment.temperature])

  const lightTrackBg = useMemo(() => {
    const t = environment.light / 100
    return `linear-gradient(to right, #FFD700 0%, #FFEE88 50%, #FFFFFF 100%)`
  }, [environment.light])

  const waterTrackBg = useMemo(() => {
    return `linear-gradient(to right, #0066CC 0%, #33AAFF 50%, #66E0FF 100%)`
  }, [])

  const tempTrackBg = useMemo(() => {
    return `linear-gradient(to right, #FF3030 0%, #FF9933 33%, #FFFF66 66%, #33AAFF 100%)`
  }, [])

  const stageLabels: Record<string, string> = {
    seedling: '🌱 幼苗期',
    growing: '🌿 生长期',
    mature: '🌳 成熟期',
    flowering: '🌸 开花期',
  }

  return (
    <div style={{
      width: 320,
      height: '100%',
      flexShrink: 0,
      padding: '20px 16px',
      background: 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderLeft: '1px solid rgba(255,255,255,0.12)',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      overflowY: 'auto',
    }}>
      <div>
        <h2 style={{
          color: '#d4f5d4',
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 4,
          letterSpacing: 1,
        }}>环境参数控制</h2>
        <p style={{
          color: 'rgba(212,245,212,0.55)',
          fontSize: 12,
          lineHeight: 1.5,
        }}>调节滑块，观察植物实时响应</p>
      </div>

      {/* 光照 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#fff6c2', fontSize: 14, fontWeight: 500 }}>☀️ 光照强度</span>
          <span style={{
            color: '#fff6c2',
            fontSize: 13,
            fontFamily: 'monospace',
            background: 'rgba(255,246,194,0.12)',
            padding: '2px 8px',
            borderRadius: 4,
            minWidth: 52,
            textAlign: 'center',
          }}>{lightDisplay}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={environment.light}
          step={1}
          onChange={(e) => setEnvironment({ light: Number(e.target.value) })}
          style={{
            width: '100%',
            height: 6,
            borderRadius: 3,
            appearance: 'none',
            WebkitAppearance: 'none',
            outline: 'none',
            cursor: 'pointer',
            background: lightTrackBg,
            transition: 'all 0.3s ease-in-out',
          }}
        />
        <div style={{
          height: 4,
          borderRadius: 2,
          background: lightBg,
          transition: 'all 0.3s ease-in-out',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>阴暗</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>强光</span>
        </div>
      </div>

      {/* 水分 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#a8f0ff', fontSize: 14, fontWeight: 500 }}>💧 水分含量</span>
          <span style={{
            color: '#a8f0ff',
            fontSize: 13,
            fontFamily: 'monospace',
            background: 'rgba(168,240,255,0.12)',
            padding: '2px 8px',
            borderRadius: 4,
            minWidth: 52,
            textAlign: 'center',
          }}>{waterDisplay}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={environment.water}
          step={1}
          onChange={(e) => setEnvironment({ water: Number(e.target.value) })}
          style={{
            width: '100%',
            height: 6,
            borderRadius: 3,
            appearance: 'none',
            WebkitAppearance: 'none',
            outline: 'none',
            cursor: 'pointer',
            background: waterTrackBg,
            transition: 'all 0.3s ease-in-out',
          }}
        />
        <div style={{
          height: 4,
          borderRadius: 2,
          background: waterBg,
          transition: 'all 0.3s ease-in-out',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>干旱</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>充足</span>
        </div>
      </div>

      {/* 温度 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#ffb8a0', fontSize: 14, fontWeight: 500 }}>🌡️ 环境温度</span>
          <span style={{
            color: '#ffb8a0',
            fontSize: 13,
            fontFamily: 'monospace',
            background: 'rgba(255,184,160,0.12)',
            padding: '2px 8px',
            borderRadius: 4,
            minWidth: 52,
            textAlign: 'center',
          }}>{tempDisplay}°C</span>
        </div>
        <input
          type="range"
          min={10}
          max={40}
          value={environment.temperature}
          step={0.5}
          onChange={(e) => setEnvironment({ temperature: Number(e.target.value) })}
          style={{
            width: '100%',
            height: 6,
            borderRadius: 3,
            appearance: 'none',
            WebkitAppearance: 'none',
            outline: 'none',
            cursor: 'pointer',
            background: tempTrackBg,
            transition: 'all 0.3s ease-in-out',
          }}
        />
        <div style={{
          height: 4,
          borderRadius: 2,
          background: tempBg,
          transition: 'all 0.3s ease-in-out',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>10°C</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>25°C</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>40°C</span>
        </div>
      </div>

      {/* 环境状态指示 */}
      <div style={{
        padding: '12px 14px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ color: 'rgba(212,245,212,0.7)', fontSize: 12, marginBottom: 8, fontWeight: 500 }}>
          生长状态
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>当前阶段：</span>
            <span style={{ color: '#b8f5b8' }}>{stageLabels[growthStage]}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>生长速率：</span>
            <span style={{ color: '#a8f0ff' }}>
              {smoothedEnv.temperature < 15 ? '🐢 极慢' :
                smoothedEnv.temperature < 22 ? '🐌 较慢' :
                  smoothedEnv.temperature < 32 ? '⚡ 适中' : '🔥 高速'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>胁迫因子：</span>
            <span style={{ color: '#ffb8a0' }}>
              {smoothedEnv.light < 20 ? '⚠️ 光照不足' :
                smoothedEnv.water < 20 ? '⚠️ 严重缺水' :
                  smoothedEnv.temperature > 35 ? '⚠️ 高温胁迫' :
                    smoothedEnv.temperature < 12 ? '⚠️ 低温胁迫' : '✅ 良好'}
            </span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
        <button
          onClick={startSimulation}
          disabled={isSimulating}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: 14,
            fontWeight: 600,
            color: '#0d2818',
            background: isSimulating
              ? 'linear-gradient(135deg, #88c888, #6bb06b)'
              : 'linear-gradient(135deg, #b8f5b8 0%, #6bc86b 100%)',
            border: 'none',
            borderRadius: 10,
            cursor: isSimulating ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease-in-out',
            boxShadow: isSimulating ? 'none' : '0 4px 12px rgba(107,200,107,0.3)',
            opacity: isSimulating ? 0.7 : 1,
            letterSpacing: 1,
          }}
        >
          {isSimulating ? '⏳ 模拟生长中...' : '🌱 模拟生长周期'}
        </button>
        <button
          onClick={resetEnvironment}
          style={{
            width: '100%',
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.85)',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.3s ease-in-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          }}
        >
          🔄 重置为默认值
        </button>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 0 12px rgba(255,255,255,0.8), 0 0 20px rgba(184,245,184,0.5);
          border: 2px solid rgba(184,245,184,0.8);
          transition: all 0.3s ease-in-out;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 18px rgba(255,255,255,0.9), 0 0 28px rgba(184,245,184,0.7);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: 2px solid rgba(184,245,184,0.8);
          box-shadow: 0 0 12px rgba(255,255,255,0.8), 0 0 20px rgba(184,245,184,0.5);
        }
      `}</style>
    </div>
  )
}

export default ControlPanel
