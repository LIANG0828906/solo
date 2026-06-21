import { useState, useCallback, createContext, useContext, useRef, useEffect } from 'react'
import MoleculeScene from '@/scene/MoleculeScene'
import MoleculeLibrary from '@/panels/MoleculeLibrary'
import AtomInfoPanel from '@/panels/AtomInfoPanel'
import type { Molecule, Marker } from '@/utils/moleculeData'
import { molecules } from '@/utils/moleculeData'

interface AppContextType {
  currentMolecule: Molecule | null
  highlightedAtomId: string | null
  markers: Marker[]
  setCurrentMolecule: (molecule: Molecule | null) => void
  setHighlightedAtomId: (atomId: string | null) => void
  addMarker: (atomId: string, label?: string) => void
  updateMarker: (markerId: string, newLabel: string) => void
  deleteMarker: (markerId: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}

function ContextMenu({
  position,
  onAddMarker,
  onClose,
}: {
  position: { x: number; y: number }
  onAddMarker: () => void
  onClose: () => void
}) {
  useEffect(() => {
    const handleClick = () => onClose()
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        backgroundColor: '#1E293B',
        borderRadius: '8px',
        padding: '4px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        zIndex: 1000,
        border: '1px solid #334155',
        minWidth: '120px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onAddMarker}
        style={{
          width: '100%',
          padding: '8px 12px',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '6px',
          color: '#E2E8F0',
          fontSize: '13px',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#334155'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        📍 添加标记
      </button>
    </div>
  )
}

function Toolbar({
  onResetView,
  onExportMarkers,
  onToggleFullscreen,
  isFullscreen,
}: {
  onResetView: () => void
  onExportMarkers: () => void
  onToggleFullscreen: () => void
  isFullscreen: boolean
}) {
  return (
    <div
      style={{
        height: '60px',
        backgroundColor: '#1A1A2E',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderTop: '1px solid #1E293B',
      }}
    >
      <button
        onClick={onResetView}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: '#2D3748',
          border: 'none',
          borderRadius: '8px',
          color: '#E2E8F0',
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#334155'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#2D3748'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'rotate(45deg)' }}>
          <path d="M1 4v6h6" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
        重置视角
      </button>

      <button
        onClick={onExportMarkers}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: '#2D3748',
          border: 'none',
          borderRadius: '8px',
          color: '#E2E8F0',
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#334155'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#2D3748'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        导出标记
      </button>

      <div style={{ flex: 1 }} />

      <button
        onClick={onToggleFullscreen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: '#2D3748',
          border: 'none',
          borderRadius: '8px',
          color: '#E2E8F0',
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#334155'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#2D3748'
        }}
      >
        {isFullscreen ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 14 4 20 10 20" />
          <polyline points="20 10 20 4 14 4" />
          <line x1="14" y1="20" x2="4" y2="10" />
          <line x1="4" y1="14" x2="10" y2="20" />
          <line x1="20" y1="4" x2="10" y2="14" />
          <line x1="20" y1="10" x2="14" y2="4" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      )}
        {isFullscreen ? '退出全屏' : '全屏'}
      </button>
    </div>
  )
}

export default function App() {
  const [currentMolecule, setCurrentMolecule] = useState<Molecule | null>(molecules[0])
  const [highlightedAtomId, setHighlightedAtomId] = useState<string | null>(null)
  const [markers, setMarkers] = useState<Marker[]>([])
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; atomId: string } | null>(null)
  const [resetTrigger, setResetTrigger] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleAtomClick = useCallback((atomId: string) => {
    setHighlightedAtomId((prev) => (prev === atomId ? null : atomId))
  }, [])

  const handleAtomContextMenu = useCallback((atomId: string, event: any) => {
    event.preventDefault?.()
    setHighlightedAtomId(atomId)
    setContextMenu({
      x: event.clientX || event.pageX,
      y: event.clientY || event.pageY,
      atomId,
    })
  }, [])

  const handleAddMarker = useCallback(() => {
    if (contextMenu) {
      const newMarker: Marker = {
        id: `marker-${Date.now()}`,
        atomId: contextMenu.atomId,
        label: `标记 ${markers.length + 1}`,
      }
      setMarkers((prev) => [...prev, newMarker])
      setContextMenu(null)
    }
  }, [contextMenu, markers.length])

  const handleUpdateMarker = useCallback((markerId: string, newLabel: string) => {
    setMarkers((prev) =>
      prev.map((m) => (m.id === markerId ? { ...m, label: newLabel } : m))
    )
  }, [])

  const handleDeleteMarker = useCallback((markerId: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== markerId))
  }, [])

  const handleResetView = useCallback(() => {
    setResetTrigger((prev) => prev + 1)
  }, [])

  const handleExportMarkers = useCallback(() => {
    const data = JSON.stringify(markers, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `markers_${currentMolecule?.name || 'molecule'}_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [markers, currentMolecule])

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const addMarker = useCallback((atomId: string, label?: string) => {
    const newMarker: Marker = {
      id: `marker-${Date.now()}`,
      atomId,
      label: label || `标记 ${markers.length + 1}`,
    }
    setMarkers((prev) => [...prev, newMarker])
  }, [markers.length])

  const contextValue: AppContextType = {
    currentMolecule,
    highlightedAtomId,
    markers,
    setCurrentMolecule,
    setHighlightedAtomId,
    addMarker,
    updateMarker: handleUpdateMarker,
    deleteMarker: handleDeleteMarker,
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0F0F1A',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          <MoleculeLibrary
            selectedMoleculeId={currentMolecule?.id || null}
            onSelectMolecule={(mol) => {
              setCurrentMolecule(mol)
              setHighlightedAtomId(null)
            }}
          />

          <div
            style={{
              flex: '1 1 auto',
              minWidth: 0,
              position: 'relative',
              overflow: 'hidden',
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {currentMolecule ? (
              <MoleculeScene
                atoms={currentMolecule.atoms}
                bonds={currentMolecule.bonds}
                highlightedAtomId={highlightedAtomId}
                markers={markers}
                onAtomClick={handleAtomClick}
                onAtomContextMenu={handleAtomContextMenu}
                resetTrigger={resetTrigger}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  fontSize: '16px',
                }}
              >
                请从左侧选择一个分子
              </div>
            )}

            {contextMenu && (
              <ContextMenu
                position={{ x: contextMenu.x, y: contextMenu.y }}
                onAddMarker={handleAddMarker}
                onClose={() => setContextMenu(null)}
              />
            )}
          </div>

          <AtomInfoPanel
            molecule={currentMolecule}
            atomId={highlightedAtomId}
            markers={markers}
            onUpdateMarker={handleUpdateMarker}
            onDeleteMarker={handleDeleteMarker}
          />
        </div>

        <Toolbar
          onResetView={handleResetView}
          onExportMarkers={handleExportMarkers}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
        />
      </div>
    </AppContext.Provider>
  )
}
