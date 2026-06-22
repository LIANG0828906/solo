import { useState, useEffect } from 'react'
import type { Atom } from '@/utils/moleculeData'
import {
  elementNames,
  elementAtomicNumbers,
  getBondLengthsForAtom,
  getBondAnglesForAtom,
  type Molecule,
  type Marker,
} from '@/utils/moleculeData'

interface AtomInfoPanelProps {
  molecule: Molecule | null
  atomId: string | null
  markers: Marker[]
  onUpdateMarker: (markerId: string, newLabel: string) => void
  onDeleteMarker: (markerId: string) => void
}

export default function AtomInfoPanel({
  molecule,
  atomId,
  markers,
  onUpdateMarker,
  onDeleteMarker,
}: AtomInfoPanelProps) {
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const atom = molecule && atomId ? molecule.atoms.find((a) => a.id === atomId) : null
  const bondLengths = molecule && atomId ? getBondLengthsForAtom(molecule, atomId) : []
  const bondAngles = molecule && atomId ? getBondAnglesForAtom(molecule, atomId) : []

  const atomMarkers = markers.filter((m) => m.atomId === atomId)

  const elementColor = atom ? {
    C: '#444444',
    H: '#FFFFFF',
    O: '#FF0D0D',
    N: '#3050F8',
    S: '#FFFF30',
  }[atom.element] || '#888888' : '#888888'

  const startEdit = (marker: Marker) => {
    setEditingMarkerId(marker.id)
    setEditText(marker.label)
  }

  const saveEdit = () => {
    if (editingMarkerId && editText.trim()) {
      onUpdateMarker(editingMarkerId, editText.trim())
    }
    setEditingMarkerId(null)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingMarkerId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!atom || !molecule) {
    return (
      <div
        style={{
          width: '300px',
          height: '100%',
          backgroundColor: '#0F172A',
          borderLeft: '1px solid #1E293B',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <div
          style={{
            fontSize: '48px',
            marginBottom: '16px',
            opacity: 0.3,
          }}
        >
          ⚛️
        </div>
        <div
          style={{
            fontSize: '14px',
            color: '#64748B',
            textAlign: 'center',
          }}
        >
          点击分子中的原子
          <br />
          查看详细信息
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        width: '300px',
        height: '100%',
        backgroundColor: '#0F172A',
        borderLeft: '1px solid #1E293B',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #1E293B',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: '#E2E8F0',
          }}
        >
          原子信息
        </h2>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: elementColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              color: atom.element === 'H' || atom.element === 'S' ? '#1E293B' : '#FFFFFF',
              boxShadow: `0 0 20px ${elementColor}40`,
            }}
          >
            {atom.element}
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#E2E8F0', fontWeight: 500 }}>
              {elementNames[atom.element] || atom.element} ({atom.element})
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
              原子序号: {elementAtomicNumbers[atom.element] || '?'}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>基本信息</div>
          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>原子ID</span>
              <span style={{ fontSize: '12px', color: '#E2E8F0' }}>{atom.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>杂化类型</span>
              <span style={{ fontSize: '12px', color: '#E2E8F0' }}>{atom.hybridization || '未知'}</span>
            </div>
            {atom.residue && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>所属残基</span>
                <span style={{ fontSize: '12px', color: '#E2E8F0' }}>{atom.residue}</span>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>坐标</div>
          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              gap: '8px',
              fontFamily: 'monospace',
            }}
          >
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748B' }}>X</div>
              <div style={{ fontSize: '13px', color: '#3B82F6' }}>{atom.x.toFixed(3)}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748B' }}>Y</div>
              <div style={{ fontSize: '13px', color: '#10B981' }}>{atom.y.toFixed(3)}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748B' }}>Z</div>
              <div style={{ fontSize: '13px', color: '#F59E0B' }}>{atom.z.toFixed(3)}</div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
            键长 ({bondLengths.length})
          </div>
          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {bondLengths.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
                无化学键
              </div>
            ) : (
              bondLengths.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: index < bondLengths.length - 1 ? '1px solid #1E293B' : 'none',
                    backgroundColor: index % 2 === 0 ? '#1E293B' : '#1A2435',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: {
                          C: '#444444',
                          H: '#FFFFFF',
                          O: '#FF0D0D',
                          N: '#3050F8',
                          S: '#FFFF30',
                        }[item.atom.element] || '#888888',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: item.atom.element === 'H' || item.atom.element === 'S' ? '#1E293B' : '#FFFFFF',
                      }}
                    >
                      {item.atom.element}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {item.atom.id}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#E2E8F0' }}>
                    {item.length.toFixed(2)} Å
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
            键角 ({bondAngles.length})
          </div>
          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {bondAngles.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
                无键角数据
              </div>
            ) : (
              bondAngles.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: index < bondAngles.length - 1 ? '1px solid #1E293B' : 'none',
                    backgroundColor: index % 2 === 0 ? '#1E293B' : '#1A2435',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{item.atom1.id}</span>
                    <span style={{ fontSize: '11px', color: '#6366F1' }}>—</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{atom.id}</span>
                    <span style={{ fontSize: '11px', color: '#6366F1' }}>—</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{item.atom2.id}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#E2E8F0' }}>
                    {item.angle.toFixed(1)}°
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {atomMarkers.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
              标记 ({atomMarkers.length})
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {atomMarkers.map((marker) => (
                <div
                  key={marker.id}
                  style={{
                    backgroundColor: '#1E293B',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  {editingMarkerId === marker.id ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit()
                      }}
                      autoFocus
                      style={{
                        flex: 1,
                        backgroundColor: '#334155',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        color: '#F8FAFC',
                        outline: 'none',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3B82F6'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '12px', color: '#E2E8F0', flex: 1 }}>{marker.label}</span>
                  )}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => startEdit(marker)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#64748B',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#334155'
                        e.currentTarget.style.color = '#E2E8F0'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#64748B'
                      }}
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => onDeleteMarker(marker.id)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#64748B',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#334155'
                        e.currentTarget.style.color = '#EF4444'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#64748B'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
