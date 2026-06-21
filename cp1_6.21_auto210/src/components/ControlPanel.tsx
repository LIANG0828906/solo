import { useState, useRef, useEffect } from 'react'
import { useMoleculeContext, type InteractionMode, type DisplayMode } from '../utils/context'

const MODE_ICONS: Record<InteractionMode, { icon: string; label: string }> = {
  select: { icon: '👆', label: '选择' },
  measure: { icon: '📏', label: '测量' },
  disassemble: { icon: '🔓', label: '拆解' },
}

const DISPLAY_LABELS: Record<DisplayMode, string> = {
  'ball-stick': '球棍模型',
  'space-fill': '空间填充',
  'wireframe': '线框模型',
}

export default function ControlPanel() {
  const { mode, setMode, displayMode, setDisplayMode, resetViewFnRef, setDisassembledAtoms } = useMoleculeContext()
  const [showDisplayMenu, setShowDisplayMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowDisplayMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleReset = () => {
    resetViewFnRef.current?.()
    setDisassembledAtoms([])
  }

  return (
    <div style={{
      position: 'absolute',
      left: 16,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: 10,
    }}>
      {(Object.keys(MODE_ICONS) as InteractionMode[]).map(m => (
        <button
          key={m}
          onClick={() => setMode(m)}
          title={MODE_ICONS[m].label}
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            border: mode === m ? '2px solid #3B82F6' : '2px solid transparent',
            background: '#1E293B',
            color: mode === m ? '#3B82F6' : '#94A3B8',
            fontSize: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            outline: 'none',
            boxShadow: mode === m ? '0 0 12px rgba(59,130,246,0.3)' : 'none',
          }}
          onMouseEnter={e => {
            if (mode !== m) (e.currentTarget.style.background = '#334155')
          }}
          onMouseLeave={e => {
            if (mode !== m) (e.currentTarget.style.background = '#1E293B')
          }}
        >
          {MODE_ICONS[m].icon}
        </button>
      ))}

      <button
        onClick={handleReset}
        title="重置视角"
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          border: '2px solid transparent',
          background: '#1E293B',
          color: '#94A3B8',
          fontSize: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#334155' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#1E293B' }}
      >
        🔄
      </button>

      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowDisplayMenu(!showDisplayMenu)}
          title="显示模式"
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            border: '2px solid transparent',
            background: '#1E293B',
            color: '#94A3B8',
            fontSize: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            outline: 'none',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#334155' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#1E293B' }}
        >
          🎨
        </button>

        {showDisplayMenu && (
          <div style={{
            position: 'absolute',
            left: 56,
            top: 0,
            background: '#334155',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            zIndex: 20,
          }}>
            {(Object.keys(DISPLAY_LABELS) as DisplayMode[]).map(dm => (
              <button
                key={dm}
                onClick={() => { setDisplayMode(dm); setShowDisplayMenu(false) }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 16px',
                  border: 'none',
                  background: displayMode === dm ? '#475569' : '#334155',
                  color: displayMode === dm ? '#3B82F6' : '#CBD5E1',
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s ease',
                  outline: 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#475569' }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = displayMode === dm ? '#475569' : '#334155'
                }}
              >
                {DISPLAY_LABELS[dm]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
