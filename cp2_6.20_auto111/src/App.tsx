import { useEffect, useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { saveAs } from 'file-saver'
import Scene from './components/Scene'
import ControlPanel from './components/ControlPanel'
import { useAtomsStore } from './stores/atomsStore'
import type { DisplayMode } from './stores/atomsStore'

function App() {
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  const molecule = useAtomsStore((s) => s.molecule)
  const displayMode = useAtomsStore((s) => s.displayMode)
  const rotationSpeed = useAtomsStore((s) => s.rotationSpeed)
  const autoRotate = useAtomsStore((s) => s.autoRotate)
  const resetTrigger = useAtomsStore((s) => s.resetTrigger)
  const annotations = useAtomsStore((s) => s.annotations)
  const highlightedAtomId = useAtomsStore((s) => s.highlightedAtomId)
  const hoveredAtom = useAtomsStore((s) => s.hoveredAtom)
  const selectedAtomId = useAtomsStore((s) => s.selectedAtomId)
  const setHoveredAtom = useAtomsStore((s) => s.setHoveredAtom)
  const setSelectedAtomId = useAtomsStore((s) => s.setSelectedAtomId)
  const getAnnotationByAtomId = useAtomsStore((s) => s.getAnnotationByAtomId)
  const addAnnotation = useAtomsStore((s) => s.addAnnotation)
  const setHighlightedAtomId = useAtomsStore((s) => s.setHighlightedAtomId)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  const handleExport = useCallback(() => {
    if (!canvasContainerRef.current) return
    setIsExporting(true)

    try {
      const canvas = canvasContainerRef.current.querySelector('canvas')
      if (!canvas) {
        setIsExporting(false)
        return
      }

      const exportCanvas = document.createElement('canvas')
      const ctx = exportCanvas.getContext('2d')!
      exportCanvas.width = 1920
      exportCanvas.height = 1080

      const gradient = ctx.createLinearGradient(0, 0, 1920, 1080)
      gradient.addColorStop(0, '#1a1a2e')
      gradient.addColorStop(1, '#16213e')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 1920, 1080)

      const sourceAspect = canvas.width / canvas.height
      const targetAspect = 1920 / 1080
      let drawWidth, drawHeight, offsetX, offsetY

      if (sourceAspect > targetAspect) {
        drawWidth = 1920
        drawHeight = 1920 / sourceAspect
        offsetX = 0
        offsetY = (1080 - drawHeight) / 2
      } else {
        drawHeight = 1080
        drawWidth = 1080 * sourceAspect
        offsetX = (1920 - drawWidth) / 2
        offsetY = 0
      }

      ctx.drawImage(canvas, offsetX, offsetY, drawWidth, drawHeight)

      const dataURL = exportCanvas.toDataURL('image/png')
      const moleculeName = molecule.name.replace(/[^\w\u4e00-\u9fa5]/g, '_')
      const now = new Date()
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`
      const fileName = `${moleculeName}_${timestamp}.png`

      saveAs(dataURL, fileName)

      setTimeout(() => setIsExporting(false), 500)
    } catch (err) {
      console.error('Export failed:', err)
      setIsExporting(false)
    }
  }, [molecule.name])

  const handleAtomClick = useCallback((atomId: string) => {
    const annotation = getAnnotationByAtomId(atomId)
    if (annotation) {
      setHighlightedAtomId(atomId)
    }
  }, [getAnnotationByAtomId, setHighlightedAtomId])

  const handleAtomDoubleClick = useCallback((atomId: string) => {
    setSelectedAtomId(atomId)
  }, [setSelectedAtomId])

  const controlsRef = useRef<any>(null)

  useEffect(() => {
    if (controlsRef.current && resetTrigger > 0) {
      controlsRef.current.reset()
    }
  }, [resetTrigger])

  const selectedAtom = selectedAtomId
    ? molecule.atoms.find((a) => a.id === selectedAtomId) || null
    : null

  const existingAnnotation = selectedAtomId
    ? getAnnotationByAtomId(selectedAtomId)
    : undefined

  const [annotationNote, setAnnotationNote] = useState('')

  useEffect(() => {
    setAnnotationNote(existingAnnotation?.note || '')
  }, [selectedAtomId, existingAnnotation?.note])

  const handleSaveAnnotation = () => {
    if (selectedAtomId) {
      addAnnotation(selectedAtomId, annotationNote.trim())
      setSelectedAtomId(null)
    }
  }

  const handleCancelAnnotation = () => {
    setSelectedAtomId(null)
  }

  return (
    <div className="app-container">
      <div className="canvas-container" ref={canvasContainerRef}>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          gl={{
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]}
        >
          <Scene
            molecule={molecule}
            displayMode={displayMode as DisplayMode}
            highlightedAtomId={highlightedAtomId}
            hoveredAtom={hoveredAtom}
            setHoveredAtom={setHoveredAtom}
            onAtomClick={handleAtomClick}
            onAtomDoubleClick={handleAtomDoubleClick}
            moleculeChanged={molecule.id}
          />
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.95}
            minDistance={4}
            maxDistance={24}
            autoRotate={autoRotate}
            autoRotateSpeed={rotationSpeed * 0.5}
            enablePan
            enableZoom
            zoomSpeed={0.8}
            rotateSpeed={0.8}
            panSpeed={0.8}
            mouseButtons={{
              LEFT: THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.PAN,
            }}
            touches={{
              ONE: THREE.TOUCH.ROTATE,
              TWO: THREE.TOUCH.DOLLY_PAN,
            }}
          />
        </Canvas>
      </div>

      {isMobile && (
        <>
          <div
            className={`mobile-overlay ${mobileMenuOpen ? 'visible' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          />
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="打开菜单"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </>
      )}

      <ControlPanel
        isMobile={isMobile}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <button
        className="export-btn"
        onClick={handleExport}
        disabled={isExporting}
        title="导出PNG截图 (1920x1080)"
      >
        {isExporting ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
      </button>

      {hoveredAtom && (
        <div
          className="tooltip"
          style={{
            left: `${hoveredAtom.screenPosition.x}px`,
            top: `${hoveredAtom.screenPosition.y}px`,
          }}
        >
          <div className="tooltip-element">
            {hoveredAtom.atom.elementName} ({hoveredAtom.atom.element})
          </div>
          <div className="tooltip-coords">
            X: {hoveredAtom.atom.position[0].toFixed(2)} · Y: {hoveredAtom.atom.position[1].toFixed(2)} · Z: {hoveredAtom.atom.position[2].toFixed(2)}
          </div>
        </div>
      )}

      {annotations.length > 0 &&
        annotations.map((ann) => {
          const atom = molecule.atoms.find((a) => a.id === ann.atomId)
          if (!atom) return null
          return (
            <div key={ann.id}>
              <div
                className="annotation-label"
                style={{
                  left: `calc(50% + ${atom.position[0] * 30}px)`,
                  top: `calc(50% + ${-atom.position[1] * 30 - 60}px)`,
                }}
              >
                {ann.note || `${atom.elementName}原子`}
              </div>
            </div>
          )
        })}

      {selectedAtom && (
        <div className="annotation-card-overlay" onClick={handleCancelAnnotation}>
          <div className="annotation-card" onClick={(e) => e.stopPropagation()}>
            <div className="annotation-card-header">
              <div className="annotation-card-title">
                <div
                  className="annotation-card-symbol"
                  style={{ backgroundColor: selectedAtom.color, color: isLightColor(selectedAtom.color) ? '#1a1a2e' : '#ffffff' }}
                >
                  {selectedAtom.element}
                </div>
                <div>
                  <div className="annotation-card-name">{selectedAtom.elementName}原子</div>
                  <div className="annotation-card-number">原子序号: {selectedAtom.atomicNumber}</div>
                </div>
              </div>
              <button className="annotation-card-close" onClick={handleCancelAnnotation} aria-label="关闭">
                ×
              </button>
            </div>
            <div className="annotation-card-body">
              <div className="annotation-field">
                <span className="annotation-field-label">元素符号</span>
                <div className="annotation-field-value">{selectedAtom.element}</div>
              </div>
              <div className="annotation-field">
                <span className="annotation-field-label">3D坐标 (Å)</span>
                <div className="annotation-field-value">
                  X: {selectedAtom.position[0].toFixed(3)} &nbsp; Y: {selectedAtom.position[1].toFixed(3)} &nbsp; Z: {selectedAtom.position[2].toFixed(3)}
                </div>
              </div>
              <div className="annotation-field">
                <span className="annotation-field-label">自定义备注</span>
                <textarea
                  className="annotation-textarea"
                  placeholder="输入对该原子的标注信息..."
                  value={annotationNote}
                  onChange={(e) => setAnnotationNote(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="annotation-card-footer">
              <button className="secondary-btn" onClick={handleCancelAnnotation}>
                取消
              </button>
              <button className="primary-btn" onClick={handleSaveAnnotation}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                保存标注
              </button>
            </div>
          </div>
        </div>
      )}

      {showHint && (
        <div className="info-hint">
          💡 拖拽旋转 · 右键平移 · 滚轮缩放 · 双击原子添加标注
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128
}

export default App
