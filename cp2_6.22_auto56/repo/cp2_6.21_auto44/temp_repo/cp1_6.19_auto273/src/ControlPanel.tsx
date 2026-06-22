import { useState } from 'react'
import {
  useJewelryStore,
  METAL_COLORS,
  METAL_NAMES,
  GEM_NAMES,
  GEM_COLORS,
  LIGHT_NAMES,
  VIEW_NAMES,
  getRingSizeCode,
  MetalType,
  GemType,
  LightEnvType,
  ViewType,
} from './store'

const MetalIcon = ({ metal }: { metal: MetalType }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" fill={METAL_COLORS[metal]} stroke="#2D2D44" strokeWidth="1.5" />
    <circle cx="9" cy="9" r="2" fill="rgba(255,255,255,0.4)" />
  </svg>
)

const GemIcon = ({ gem }: { gem: GemType }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <polygon
      points="12,3 20,9 16,21 8,21 4,9"
      fill={GEM_COLORS[gem]}
      stroke="#2D2D44"
      strokeWidth="1.5"
      opacity={gem === 'diamond' ? 0.95 : 0.85}
    />
    <polygon points="12,3 14,9 10,9" fill="rgba(255,255,255,0.4)" />
  </svg>
)

const StoreLightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="6" cy="8" r="3" />
    <circle cx="18" cy="8" r="3" />
    <circle cx="12" cy="6" r="2.5" />
    <path d="M3 18h18v2H3z" opacity="0.5" />
  </svg>
)

const OutdoorLightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" />
  </svg>
)

const StageLightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3L4 21h16L12 3z" opacity="0.6" />
    <circle cx="12" cy="5" r="2.5" />
  </svg>
)

const ViewIcon = ({ view }: { view: ViewType }) => {
  if (view === 'front') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  if (view === 'side45') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default function ControlPanel() {
  const metal = useJewelryStore((s) => s.metal)
  const gem = useJewelryStore((s) => s.gem)
  const size = useJewelryStore((s) => s.size)
  const lightEnv = useJewelryStore((s) => s.lightEnv)
  const currentView = useJewelryStore((s) => s.currentView)
  const markers = useJewelryStore((s) => s.markers)

  const setMetal = useJewelryStore((s) => s.setMetal)
  const setGem = useJewelryStore((s) => s.setGem)
  const setSize = useJewelryStore((s) => s.setSize)
  const setLightEnv = useJewelryStore((s) => s.setLightEnv)
  const setCurrentView = useJewelryStore((s) => s.setCurrentView)
  const updateMarkerNote = useJewelryStore((s) => s.updateMarkerNote)
  const removeMarker = useJewelryStore((s) => s.removeMarker)

  const metals: MetalType[] = ['gold', 'silver', 'rosegold', 'platinum']
  const gems: GemType[] = ['diamond', 'ruby', 'sapphire', 'emerald']
  const lights: LightEnvType[] = ['store', 'outdoor', 'stage']
  const views: ViewType[] = ['front', 'side45', 'top']

  const LightIcon = lightEnv === 'store' ? StoreLightIcon : lightEnv === 'outdoor' ? OutdoorLightIcon : StageLightIcon

  return (
    <div
      style={{
        width: 280,
        height: '100%',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '0.5px solid #2D2D44',
        borderRadius: 12,
        padding: 20,
        overflowY: 'auto',
        color: '#E0E0E0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <style>{`
        .scrollbar::-webkit-scrollbar { width: 4px; }
        .scrollbar::-webkit-scrollbar-track { background: transparent; }
        .scrollbar::-webkit-scrollbar-thumb { background: #4A4A6E; border-radius: 2px; }
        @keyframes selectPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .selected-btn {
          animation: selectPulse 0.2s ease-out;
        }
      `}</style>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, letterSpacing: 0.5 }}>
        首饰设计控制台
      </h2>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          视角预览
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {views.map((v) => (
            <button
              key={v}
              onClick={() => setCurrentView(v)}
              className={currentView === v ? 'selected-btn' : ''}
              style={{
                flex: 1,
                padding: '10px 8px',
                background: currentView === v ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${currentView === v ? '#FFD700' : '#2D2D44'}`,
                borderRadius: 8,
                color: currentView === v ? '#FFD700' : '#E0E0E0',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s ease',
                fontSize: 11,
              }}
            >
              <ViewIcon view={v} />
              {VIEW_NAMES[v]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          金属材质
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {metals.map((m) => (
            <button
              key={m}
              onClick={() => setMetal(m)}
              className={metal === m ? 'selected-btn' : ''}
              style={{
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${metal === m ? '#FFD700' : '#2D2D44'}`,
                borderRadius: 8,
                color: '#E0E0E0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                fontSize: 12,
              }}
            >
              <MetalIcon metal={m} />
              {METAL_NAMES[m]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          主石类型
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {gems.map((g) => (
            <button
              key={g}
              onClick={() => setGem(g)}
              className={gem === g ? 'selected-btn' : ''}
              style={{
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${gem === g ? '#FFD700' : '#2D2D44'}`,
                borderRadius: 8,
                color: '#E0E0E0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                fontSize: 12,
              }}
            >
              <GemIcon gem={g} />
              {GEM_NAMES[g]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
            戒指尺寸
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#FFD700', fontWeight: 600 }}>
              {size.toFixed(1)}cm
            </span>
            <span style={{ fontSize: 11, color: '#888', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
              {getRingSizeCode(size)}
            </span>
          </div>
        </div>
        <input
          type="range"
          min="1.5"
          max="2.5"
          step="0.1"
          value={size}
          onChange={(e) => setSize(parseFloat(e.target.value))}
          style={{
            width: '100%',
            height: 4,
            appearance: 'none',
            WebkitAppearance: 'none',
            background: '#2D2D44',
            borderRadius: 2,
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#666' }}>
          <span>1.5</span>
          <span>2.0</span>
          <span>2.5</span>
        </div>
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #FFD700;
            cursor: pointer;
            border: 2px solid #1A1A2E;
            box-shadow: 0 0 8px rgba(255,215,0,0.5);
          }
        `}</style>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          光照环境
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {lights.map((l, idx) => {
            const Icon = idx === 0 ? StoreLightIcon : idx === 1 ? OutdoorLightIcon : StageLightIcon
            const isActive = lightEnv === l
            return (
              <button
                key={l}
                onClick={() => setLightEnv(l)}
                title={LIGHT_NAMES[l]}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: `2px solid ${isActive ? '#FFD700' : '#2D2D44'}`,
                  background: isActive
                    ? 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0.05) 100%)'
                    : 'rgba(255,255,255,0.03)',
                  color: isActive ? '#FFD700' : '#888',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.5s ease',
                }}
              >
                <Icon />
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
          {lights.map((l) => (
            <span key={l} style={{ fontSize: 10, color: lightEnv === l ? '#FFD700' : '#666', transition: 'color 0.3s' }}>
              {LIGHT_NAMES[l]}
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
            标记备注 ({markers.length})
          </span>
          <span style={{ fontSize: 10, color: '#555' }}>点击模型添加标记</span>
        </div>
        <div
          className="scrollbar"
          style={{
            maxHeight: 180,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {markers.length === 0 ? (
            <div style={{ fontSize: 11, color: '#555', textAlign: 'center', padding: 16, fontStyle: 'italic' }}>
              暂无标记，在3D模型上点击添加
            </div>
          ) : (
            markers.map((marker, idx) => (
              <MarkerNoteItem
                key={marker.id}
                index={idx + 1}
                note={marker.note}
                onNoteChange={(note) => updateMarkerNote(marker.id, note)}
                onRemove={() => removeMarker(marker.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function MarkerNoteItem({
  index,
  note,
  onNoteChange,
  onRemove,
}: {
  index: number
  note: string
  onNoteChange: (note: string) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(!note)

  return (
    <div
      style={{
        background: 'rgba(0,136,255,0.08)',
        border: '1px solid rgba(0,136,255,0.2)',
        borderRadius: 8,
        padding: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'rgba(0,136,255,0.5)',
              border: '1.5px solid #0088FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 600,
              color: 'white',
            }}
          >
            {index}
          </div>
          <span style={{ fontSize: 11, color: '#0088FF' }}>标记 #{index}</span>
        </div>
        <button
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            color: '#E74C3C',
            cursor: 'pointer',
            fontSize: 14,
            padding: '0 4px',
          }}
        >
          ×
        </button>
      </div>
      {editing ? (
        <textarea
          maxLength={50}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          onBlur={() => setEditing(false)}
          onFocus={() => setEditing(true)}
          autoFocus
          placeholder="输入备注（最多50字）..."
          style={{
            width: '100%',
            minHeight: 40,
            padding: 6,
            fontSize: 11,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid #2D2D44',
            borderRadius: 4,
            color: '#E0E0E0',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          style={{
            fontSize: 11,
            color: note ? '#E0E0E0' : '#666',
            padding: 6,
            cursor: 'pointer',
            fontStyle: note ? 'normal' : 'italic',
            minHeight: 28,
          }}
        >
          {note || '点击输入备注...'}
        </div>
      )}
      <div style={{ fontSize: 9, color: '#555', textAlign: 'right', marginTop: 2 }}>
        {note.length}/50
      </div>
    </div>
  )
}
