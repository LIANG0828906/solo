import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import SceneManager from './scene/SceneManager'
import { FragmentEngine, Fragment } from './fragments/FragmentEngine'
import { SymbolDetector, SymbolCompletedEvent } from './symbols/SymbolDetector'
import InfoPanel from './ui/InfoPanel'
import { useStore } from './store/useStore'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)
  const fragmentEngineRef = useRef<FragmentEngine | null>(null)
  const symbolDetectorRef = useRef<SymbolDetector | null>(null)
  const isDraggingRef = useRef(false)
  const outlineMeshesRef = useRef<Map<string, THREE.LineSegments>>(new Map())
  const [, setFragments] = useState<Fragment[]>([])
  const [isResetting, setIsResetting] = useState(false)
  const animationRef = useRef<number | null>(null)

  const {
    completedSymbols,
    hoveredFragment,
    allSymbolsCompleted,
    addCompletedSymbol,
    setAllSymbolsCompleted,
    setHoveredFragment,
    resetAll
  } = useStore()

  const createOutline = useCallback((fragment: Fragment) => {
    if (outlineMeshesRef.current.has(fragment.id)) return

    const geometry = fragment.mesh.geometry
    const edges = new THREE.EdgesGeometry(geometry)
    const material = new THREE.LineBasicMaterial({
      color: 0xFFFFCC,
      transparent: true,
      opacity: 0.6
    })
    const outline = new THREE.LineSegments(edges, material)
    outline.visible = false

    const targetObject = fragment.group || fragment.mesh
    targetObject.add(outline)
    outline.position.set(0, 0.01, 0)
    outlineMeshesRef.current.set(fragment.id, outline)
  }, [])

  const showOutline = useCallback((fragmentId: string) => {
    const outline = outlineMeshesRef.current.get(fragmentId)
    if (outline) {
      outline.visible = true
    }
  }, [])

  const hideOutline = useCallback((fragmentId: string) => {
    const outline = outlineMeshesRef.current.get(fragmentId)
    if (outline) {
      outline.visible = false
    }
  }, [])

  const handleSymbolComplete = useCallback((event: SymbolCompletedEvent) => {
    addCompletedSymbol(event.symbolId)
    
    if (symbolDetectorRef.current) {
      const completed = symbolDetectorRef.current.getCompletedSymbols()
      if (completed.length >= 5) {
        setAllSymbolsCompleted(true)
        startTopViewAnimation()
      }
    }
  }, [addCompletedSymbol, setAllSymbolsCompleted])

  const startTopViewAnimation = useCallback(() => {
    if (!sceneManagerRef.current) return

    const { camera, controls } = sceneManagerRef.current
    const startTime = Date.now()
    const duration = 5000
    const startPosition = camera.position.clone()
    const targetPosition = new THREE.Vector3(0, 15, 0.01)
    const startTarget = controls.target.clone()
    const targetTarget = new THREE.Vector3(0, 0, 0)

    controls.enabled = false

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      camera.position.lerpVectors(startPosition, targetPosition, eased)
      controls.target.lerpVectors(startTarget, targetTarget, eased)

      if (progress >= 0.2) {
        const rotationProgress = (progress - 0.2) / 0.8
        const angle = rotationProgress * Math.PI * 2
        const radius = 15
        camera.position.x = Math.cos(angle) * radius
        camera.position.z = Math.sin(angle) * radius
        camera.position.y = 15 * (1 - rotationProgress * 0.3)
      }

      camera.lookAt(controls.target)
      controls.update()

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        controls.enabled = true
      }
    }

    animate()
  }, [])

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!sceneManagerRef.current || !fragmentEngineRef.current) return

    const meshes = fragmentEngineRef.current.getFragments().map(f => f.mesh)
    const intersection = sceneManagerRef.current.getFirstIntersection(
      event.clientX,
      event.clientY,
      meshes
    )

    if (intersection) {
      isDraggingRef.current = true
      if (sceneManagerRef.current) {
        sceneManagerRef.current.controls.enabled = false
      }
      fragmentEngineRef.current.startDrag(event)
    }
  }, [])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!sceneManagerRef.current || !fragmentEngineRef.current) return

    if (isDraggingRef.current) {
      fragmentEngineRef.current.onDrag(event)
      return
    }

    const meshes = fragmentEngineRef.current.getFragments().map(f => f.mesh)
    const intersection = sceneManagerRef.current.getFirstIntersection(
      event.clientX,
      event.clientY,
      meshes
    )

    const currentFragments = fragmentEngineRef.current.getFragments()

    if (intersection) {
      const mesh = intersection.object as THREE.Mesh
      const fragmentIndex = mesh.userData.fragmentIndex
      const fragment = currentFragments[fragmentIndex]

      if (fragment && hoveredFragment !== fragment.id) {
        if (hoveredFragment) {
          hideOutline(hoveredFragment)
        }
        setHoveredFragment(fragment.id)
        showOutline(fragment.id)
      }
    } else if (hoveredFragment) {
      hideOutline(hoveredFragment)
      setHoveredFragment(null)
    }
  }, [hoveredFragment, setHoveredFragment, showOutline, hideOutline])

  const handleMouseUp = useCallback(() => {
    if (!fragmentEngineRef.current) return

    if (isDraggingRef.current) {
      fragmentEngineRef.current.endDrag()
      isDraggingRef.current = false
      if (sceneManagerRef.current) {
        sceneManagerRef.current.controls.enabled = true
      }
    }
  }, [])

  const handleReset = useCallback(() => {
    if (isResetting) return
    setIsResetting(true)

    setTimeout(() => {
      resetAll()
      outlineMeshesRef.current.forEach(outline => {
        outline.removeFromParent()
        outline.geometry.dispose()
        if (Array.isArray(outline.material)) {
          outline.material.forEach(m => m.dispose())
        } else {
          outline.material.dispose()
        }
      })
      outlineMeshesRef.current.clear()

      if (symbolDetectorRef.current) {
        symbolDetectorRef.current.dispose()
      }

      if (fragmentEngineRef.current) {
        const newFragments = fragmentEngineRef.current.generateFragments()
        setFragments(newFragments)

        if (sceneManagerRef.current && symbolDetectorRef.current) {
          symbolDetectorRef.current = new SymbolDetector(
            fragmentEngineRef.current,
            sceneManagerRef.current
          )
          symbolDetectorRef.current.on('symbolCompleted', handleSymbolComplete)
        }

        newFragments.forEach(f => {
          createOutline(f)
        })
      }

      if (sceneManagerRef.current) {
        sceneManagerRef.current.resetCamera()
      }

      setIsResetting(false)
    }, 500)
  }, [isResetting, resetAll, createOutline, handleSymbolComplete])

  useEffect(() => {
    if (!containerRef.current) return

    const sceneManager = new SceneManager()
    sceneManager.init(containerRef.current)
    sceneManagerRef.current = sceneManager

    const fragmentEngine = new FragmentEngine({
      scene: sceneManager.scene,
      camera: sceneManager.camera,
      renderer: sceneManager.renderer
    })
    fragmentEngineRef.current = fragmentEngine

    const symbolDetector = new SymbolDetector(fragmentEngine, sceneManager)
    symbolDetectorRef.current = symbolDetector

    const initialFragments = fragmentEngine.generateFragments()
    setFragments(initialFragments)

    initialFragments.forEach(f => {
      createOutline(f)
    })

    symbolDetector.on('symbolCompleted', handleSymbolComplete)

    sceneManager.start()

    const domElement = sceneManager.getDomElement()
    domElement.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      domElement.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      outlineMeshesRef.current.forEach(outline => {
        outline.geometry.dispose()
        if (Array.isArray(outline.material)) {
          outline.material.forEach(m => m.dispose())
        } else {
          outline.material.dispose()
        }
      })
      outlineMeshesRef.current.clear()

      if (symbolDetector) {
        symbolDetector.dispose()
      }

      sceneManager.dispose()
    }
  }, [createOutline, handleMouseDown, handleMouseMove, handleMouseUp, handleSymbolComplete])

  const progress = (completedSymbols.length / 5) * 100
  const radius = 35
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, #3d2914 0%, #2d1f14 40%, #0a0502 100%)'
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: 'rgba(205, 127, 50, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(205, 127, 50, 0.4)',
          borderRadius: '12px',
          transition: 'all 0.2s ease'
        }}
      >
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="rgba(205, 127, 50, 0.2)"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="#CD7F32"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dashoffset 0.2s ease' }}
          />
          <text
            x="40"
            y="40"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#CD7F32"
            fontSize="18"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            {completedSymbols.length}/5
          </text>
        </svg>
        <div style={{ color: '#CD7F32', fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>已收集符号</div>
          <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
            {allSymbolsCompleted ? '全部完成！' : '拖拽陶片进行拼接'}
          </div>
        </div>
      </div>

      <button
        onClick={handleReset}
        disabled={isResetting}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(205, 127, 50, 0.15)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(205, 127, 50, 0.5)',
          cursor: isResetting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          transform: isResetting ? 'rotate(360deg)' : 'rotate(0deg)',
          opacity: isResetting ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (!isResetting) {
            e.currentTarget.style.transform = 'scale(1.1)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isResetting) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#CD7F32"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: 'transform 0.5s ease',
            transform: isResetting ? 'rotate(360deg)' : 'rotate(0deg)'
          }}
        >
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
        </svg>
      </button>

      <InfoPanel symbolDetector={symbolDetectorRef.current} />

      {allSymbolsCompleted && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '24px 48px',
            background: 'rgba(205, 127, 50, 0.2)',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            border: '2px solid rgba(205, 127, 50, 0.6)',
            borderRadius: '16px',
            color: '#CD7F32',
            fontFamily: 'sans-serif',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            animation: 'fadeIn 0.5s ease',
            pointerEvents: 'none'
          }}
        >
          🎉 恭喜完成所有符号拼接！
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </div>
  )
}

export default App
