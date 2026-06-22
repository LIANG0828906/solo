import { useState } from 'react'
import { useEditorStore, GeometryType, PointLightItem } from '@/store/editorStore'

const geometryButtons: { type: GeometryType; label: string; icon: JSX.Element }[] = [
  {
    type: 'box',
    label: '立方体',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="16" width="40" height="40" rx="4" fill="rgba(108,99,255,0.6)" stroke="#6c63ff" strokeWidth="2"/>
      <path d="M12 16 L32 6 L52 16" stroke="#6c63ff" strokeWidth="2" fill="none"/>
      <path d="M52 16 L52 56" stroke="#6c63ff" strokeWidth="2" fill="none" opacity="0.5"/>
      <path d="M32 6 L32 46" stroke="#6c63ff" strokeWidth="2" fill="none" opacity="0.5"/>
    </svg>
    ),
  },
  {
    type: 'sphere',
    label: '球体',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="22" fill="rgba(108,99,255,0.6)" stroke="#6c63ff" strokeWidth="2"/>
        <ellipse cx="32" cy="32" rx="22" ry="8" stroke="#6c63ff" strokeWidth="1.5" fill="none" opacity="0.5"/>
        <path d="M10 32 Q32 24 54 32" stroke="#6c63ff" strokeWidth="1.5" fill="none" opacity="0.5"/>
      </svg>
    ),
  },
  {
    type: 'cylinder',
    label: '圆柱',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="14" rx="18" ry="6" fill="rgba(108,99,255,0.6)" stroke="#6c63ff" strokeWidth="2"/>
      <rect x="14" y="14" width="36" height="36" fill="rgba(108,99,255,0.4)"/>
      <path d="M14 14 L14 50" stroke="#6c63ff" strokeWidth="2"/>
      <path d="M50 14 L50 50" stroke="#6c63ff" strokeWidth="2"/>
      <ellipse cx="32" cy="50" rx="18" ry="6" fill="rgba(108,99,255,0.6)" stroke="#6c63ff" strokeWidth="2"/>
    </svg>
    ),
  },
  {
    type: 'torus',
    label: '圆环',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="32" rx="24" ry="14" fill="none" stroke="#6c63ff" strokeWidth="6"/>
        <ellipse cx="32" cy="32" rx="24" ry="14" fill="rgba(108,99,255,0.3)" stroke="#6c63ff" strokeWidth="2"/>
        <ellipse cx="32" cy="26" rx="10" ry="5" fill="rgba(108,99,255,0.6)" stroke="#6c63ff" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    type: 'cone',
    label: '圆锥',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8 L12 52 L52 52 Z" fill="rgba(108,99,255,0.4)" stroke="#6c63ff" strokeWidth="2"/>
        <ellipse cx="32" cy="52" rx="20" ry="6" fill="rgba(108,99,255,0.6)" stroke="#6c63ff" strokeWidth="2"/>
        <path d="M32 8 L32 52" stroke="#6c63ff" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5"/>
      </svg>
    ),
  },
]

function LightCard({ light, index }: { light: PointLightItem; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const updatePointLight = useEditorStore((s) => s.updatePointLight)
  const removePointLight = useEditorStore((s) => s.removePointLight)

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 8,
        marginBottom: 8,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: light.color,
            boxShadow: `0 0 10px ${light.color}`,
            flexShrink: 0,
          }}
        />
        <span style={{ color: '#ccc', fontSize: 13, flex: 1 }}>
          点光源 {index + 1}
        </span>
        <span style={{ color: '#888', fontSize: 12, fontFamily: 'monospace' }}>
          {light.intensity.toFixed(1)}
        </span>
        <span style={{ color: '#666', fontSize: 12 }}>
          {expanded ? '▼' : '▶'}
        </span>
      </div>

      {expanded && (
        <div style={{ padding: '4px 12px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button
              onClick={() => removePointLight(light.id)}
              style={{
                background: 'rgba(255,80,80,0.2)',
                color: '#ff6b6b',
                border: 'none',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              删除
            </button>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ color: '#aaa', fontSize: 11 }}>颜色</label>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="color"
                value={light.color}
                onChange={(e) => updatePointLight(light.id, { color: e.target.value })}
                style={{
                  width: 36,
                  height: 24,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
              <input
                type="text"
                value={light.color}
                onChange={(e) => updatePointLight(light.id, { color: e.target.value })}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#ddd',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </div>

          {(['x', 'y', 'z'] as const).map((axis, i) => (
            <div key={axis} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <label style={{ color: '#aaa', fontSize: 11, textTransform: 'uppercase' }}>{axis}</label>
                <input
                  type="number"
                  step={0.1}
                  value={light.position[i]}
                  onChange={(e) => {
                    const newPos = [...light.position] as [number, number, number]
                    newPos[i] = parseFloat(e.target.value) || 0
                    updatePointLight(light.id, { position: newPos })
                  }}
                  style={{
                    width: 60,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#ddd',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontFamily: 'monospace',
                    textAlign: 'right',
                  }}
                />
              </div>
            </div>
          ))}

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <label style={{ color: '#aaa', fontSize: 11 }}>强度</label>
              <span style={{ color: '#888', fontSize: 11, fontFamily: 'monospace' }}>
                {light.intensity.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.01}
              value={light.intensity}
              onChange={(e) => updatePointLight(light.id, { intensity: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: '#6c63ff' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <label style={{ color: '#aaa', fontSize: 11 }}>衰减</label>
              <span style={{ color: '#888', fontSize: 11, fontFamily: 'monospace' }}>
                {light.decay.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={2}
              step={0.01}
              value={light.decay}
              onChange={(e) => updatePointLight(light.id, { decay: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: '#6c63ff' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

const GeometryPanel = () => {
  const addGeometry = useEditorStore((s) => s.addGeometry)
  const addPointLight = useEditorStore((s) => s.addPointLight)
  const lightList = useEditorStore((s) => s.lightList)

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 220,
    background: 'rgba(30,30,50,0.9)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRight: '1px solid #2a2a4a',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 4, letterSpacing: 0.5 }}>
          几何体
        </h2>
        <p style={{ color: '#666', fontSize: 11, margin: 0 }}>
          点击添加到场景中心
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
        {geometryButtons.map((btn) => (
          <button
            key={btn.type}
            onClick={() => addGeometry(btn.type)}
            title={btn.label}
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.08)',
              border: '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              padding: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3a3a5a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.borderColor = '#6c63ff'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.borderColor = 'transparent'
            }}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>
            光源
          </h3>
          <span style={{ color: '#666', fontSize: 11 }}>
            {lightList.length}/3
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, paddingRight: 2 }}>
          {lightList.length === 0 && (
            <p style={{ color: '#555', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
              暂无点光源
            </p>
          )}
          {lightList.map((light, i) => (
            <LightCard key={light.id} light={light} index={i} />
          ))}
        </div>

        <button
          onClick={addPointLight}
          disabled={lightList.length >= 3}
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: lightList.length >= 3 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
            border: '2px dashed rgba(108,99,255,0.4)',
            cursor: lightList.length >= 3 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: lightList.length >= 3 ? '#444' : '#6c63ff',
            fontSize: 24,
            fontWeight: 300,
            alignSelf: 'center',
            transition: 'all 0.15s ease',
            opacity: lightList.length >= 3 ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (lightList.length < 3) e.currentTarget.style.background = '#3a3a5a'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = lightList.length >= 3 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)'
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default GeometryPanel
