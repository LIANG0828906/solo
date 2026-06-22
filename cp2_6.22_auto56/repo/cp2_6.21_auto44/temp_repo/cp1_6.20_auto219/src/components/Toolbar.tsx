import { useSceneStore, GeometryType, MaterialType } from '@/store/SceneStore'
import { useState, useCallback } from 'react'
import {
  Box,
  Circle,
  Triangle,
  Donut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const GEOMETRY_ITEMS: { type: GeometryType; label: string; icon: React.ReactNode }[] = [
  { type: 'cube', label: '立方体', icon: <Box size={28} /> },
  { type: 'sphere', label: '球体', icon: <Circle size={28} /> },
  { type: 'cone', label: '圆锥', icon: <Triangle size={28} /> },
  { type: 'torus', label: '环面', icon: <Donut size={28} /> },
]

const MATERIAL_ITEMS: { type: MaterialType; label: string }[] = [
  { type: 'metal', label: '金属' },
  { type: 'glass', label: '玻璃' },
  { type: 'matte', label: '哑光' },
]

export default function Toolbar() {
  const { addGeometry, toolbarCollapsed, setToolbarCollapsed, isMobile, mobileToolbarOpen, setMobileToolbarOpen } = useSceneStore()
  const [dragInfo, setDragInfo] = useState<{ type: GeometryType; material: MaterialType } | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, type: GeometryType, material: MaterialType) => {
    setDragInfo({ type, material })
    e.dataTransfer.setData('application/geometry', JSON.stringify({ type, material }))
    e.dataTransfer.effectAllowed = 'copy'
  }, [])

  const handleAddGeometry = useCallback((type: GeometryType, material: MaterialType) => {
    addGeometry(type, material)
  }, [addGeometry])

  const panelContent = (
    <div style={{ padding: '16px 12px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#999',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '14px',
        }}>
          几何体
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {GEOMETRY_ITEMS.map((geo) => (
            <div
              key={geo.type}
              draggable
              onDragStart={(e) => {
                const mat = MATERIAL_ITEMS[0].type
                handleDragStart(e, geo.type, mat)
              }}
              onClick={() => handleAddGeometry(geo.type, MATERIAL_ITEMS[0].type)}
              className="glow-border"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 8px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                cursor: 'grab',
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.2s ease',
                userSelect: 'none',
              }}
            >
              <span style={{ color: '#ccc' }}>{geo.icon}</span>
              <span style={{ fontSize: '11px', color: '#aaa' }}>{geo.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#999',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '14px',
        }}>
          材质预设
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {GEOMETRY_ITEMS.map((geo) => (
            <div key={geo.type} style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', color: '#777', marginBottom: '6px' }}>{geo.label}</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {MATERIAL_ITEMS.map((mat) => (
                  <button
                    key={mat.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, geo.type, mat.type)}
                    onClick={() => handleAddGeometry(geo.type, mat.type)}
                    className="glow-border"
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      fontSize: '10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: mat.type === 'metal'
                        ? 'linear-gradient(135deg, #8B8B8B, #C0C0C0)'
                        : mat.type === 'glass'
                        ? 'linear-gradient(135deg, rgba(100,180,255,0.3), rgba(200,230,255,0.2))'
                        : 'linear-gradient(135deg, #4a4a4a, #666)',
                      color: mat.type === 'glass' ? '#8cf' : '#ddd',
                      cursor: 'grab',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {mat.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    if (!mobileToolbarOpen) {
      return (
        <button
          onClick={() => setMobileToolbarOpen(true)}
          className="glow-border"
          style={{
            position: 'fixed',
            left: 12,
            top: 12,
            zIndex: 100,
            width: 44,
            height: 44,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            color: '#ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Box size={20} />
        </button>
      )
    }

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(20px)',
          animation: 'fadeIn 0.2s ease-out',
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px' }}>
          <button
            onClick={() => setMobileToolbarOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ccc',
              fontSize: 24,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
        {panelContent}
      </div>
    )
  }

  return (
    <div
      style={{
        width: toolbarCollapsed ? 40 : 200,
        height: '100%',
        transition: 'width 0.3s ease-out',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          height: '100%',
          overflow: toolbarCollapsed ? 'hidden' : 'auto',
        }}
      >
        {toolbarCollapsed ? null : panelContent}
      </div>
      <button
        onClick={() => setToolbarCollapsed(!toolbarCollapsed)}
        className="glow-border"
        style={{
          position: 'absolute',
          top: 12,
          right: -16,
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'rgba(30,30,50,0.9)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        {toolbarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  )
}
