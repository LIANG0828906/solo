import React, { useEffect, useRef, useCallback } from 'react'
import { useModuleStore, ModuleType } from '@/store/moduleStore'
import { ModuleLibrary } from '@/components/ModuleCard'
import { WirePanel } from '@/components/WirePanel'
import { audioEngine } from '@/utils/audioEngine'

const GRID_SIZE = 24

function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

const WaveformVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const isPlaying = useModuleStore((s) => s.isPlaying)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const w = rect.width
      const h = rect.height

      ctx.fillStyle = 'rgba(15, 15, 27, 0.85)'
      ctx.fillRect(0, 0, w, h)

      ctx.strokeStyle = 'rgba(124, 58, 237, 0.08)'
      ctx.lineWidth = 1
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }

      ctx.strokeStyle = 'rgba(124, 58, 237, 0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, h / 2)
      ctx.lineTo(w, h / 2)
      ctx.stroke()

      const analyser = audioEngine.getAnalyser()

      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyser.getByteTimeDomainData(dataArray)

        ctx.lineWidth = 2
        ctx.strokeStyle = '#22d3ee'
        ctx.shadowColor = '#22d3ee'
        ctx.shadowBlur = 8
        ctx.beginPath()

        const sliceWidth = w / bufferLength
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0
          const y = (v * h) / 2

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
          x += sliceWidth
        }

        ctx.stroke()

        ctx.shadowBlur = 0
        ctx.lineWidth = 0.5
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)'
        ctx.beginPath()
        x = 0
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0
          const y = (v * h) / 2
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
          x += sliceWidth
        }
        ctx.stroke()
      } else {
        const t = Date.now() / 1000
        ctx.lineWidth = 1.5
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.25)'
        ctx.shadowColor = 'rgba(34, 211, 238, 0.15)'
        ctx.shadowBlur = 4
        ctx.beginPath()
        for (let x = 0; x < w; x++) {
          const y = h / 2 + Math.sin(x * 0.02 + t * 2) * 4 * Math.sin(x * 0.005 + t * 0.5)
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [isPlaying])

  return (
    <div className="waveform-container" style={{ height: 100, marginBottom: 12 }}>
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-2 left-3 font-mono text-[10px] text-synth-highlight/50 uppercase tracking-widest">
        波形监视器
      </div>
    </div>
  )
}

const App: React.FC = () => {
  const {
    isPlaying,
    addModule,
    togglePlay,
    setWiring,
    addConnection,
    moveModule,
    activateChain,
    resetActivation,
  } = useModuleStore()

  const moduleCount = useModuleStore((s) => s.modules.length)
  const connectionCount = useModuleStore((s) => s.connections.length)
  const panelRef = useRef<HTMLDivElement | null>(null)

  const moduleDragRef = useRef<{
    moduleId: string
    offsetX: number
    offsetY: number
    isDragging: boolean
  } | null>(null)

  const wiringRef = useRef<{
    sourceModuleId: string
    sourcePortIndex: number
    active: boolean
  } | null>(null)

  useEffect(() => {
    if (isPlaying) {
      const modules = useModuleStore.getState().modules
      const connections = useModuleStore.getState().connections
      audioEngine.start(modules, connections)
      activateChain()
    } else {
      audioEngine.stop()
      resetActivation()
    }
  }, [isPlaying, activateChain, resetActivation])

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      const { modules, connections } = useModuleStore.getState()
      audioEngine.stop()
      audioEngine.start(modules, connections)
    }, 500)

    return () => clearInterval(interval)
  }, [isPlaying])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (moduleDragRef.current?.isDragging) {
        const { moduleId, offsetX, offsetY } = moduleDragRef.current
        const panel = panelRef.current?.getBoundingClientRect()
        if (!panel) return

        const newGridX = snapToGrid(e.clientX - panel.left - offsetX)
        const newGridY = snapToGrid(e.clientY - panel.top - offsetY)
        moveModule(moduleId, newGridX, newGridY)
      }

      if (wiringRef.current?.active) {
        setWiring({
          sourceModuleId: wiringRef.current.sourceModuleId,
          sourcePortIndex: wiringRef.current.sourcePortIndex,
          mouseX: e.clientX,
          mouseY: e.clientY,
          active: true,
        })
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (moduleDragRef.current?.isDragging) {
        moduleDragRef.current.isDragging = false
      }

      if (wiringRef.current?.active) {
        const targetEl = (e.target as HTMLElement).closest('[data-port-direction]')
        if (targetEl) {
          const targetModuleId = targetEl.getAttribute('data-module-id')!
          const direction = targetEl.getAttribute('data-port-direction') as 'input' | 'output'
          const portIndex = parseInt(targetEl.getAttribute('data-port-index')!, 10)

          if (direction === 'input') {
            addConnection(
              wiringRef.current.sourceModuleId,
              wiringRef.current.sourcePortIndex,
              targetModuleId,
              portIndex
            )
          }
        }

        wiringRef.current = null
        setWiring({
          sourceModuleId: null,
          sourcePortIndex: 0,
          mouseX: 0,
          mouseY: 0,
          active: false,
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [moveModule, setWiring, addConnection])

  const handleLibraryDragStart = useCallback((type: ModuleType, e: React.DragEvent) => {
    e.dataTransfer.setData('moduleType', type)
    e.dataTransfer.effectAllowed = 'copy'
  }, [])

  const handlePanelDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const type = e.dataTransfer.getData('moduleType') as ModuleType
      if (!type) return

      const panel = panelRef.current?.getBoundingClientRect()
      if (!panel) return

      const x = snapToGrid(e.clientX - panel.left - CARD_W / 2)
      const y = snapToGrid(e.clientY - panel.top - CARD_H / 2)
      addModule(type, x, y)
    },
    [addModule]
  )

  const handlePanelDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleModuleDragStart = useCallback((moduleId: string, e: React.MouseEvent) => {
    e.preventDefault()

    const modules = useModuleStore.getState().modules
    const mod = modules.find((m) => m.id === moduleId)
    if (!mod) return

    const panel = panelRef.current?.getBoundingClientRect()
    if (!panel) return

    moduleDragRef.current = {
      moduleId,
      offsetX: e.clientX - panel.left - mod.gridX,
      offsetY: e.clientY - panel.top - mod.gridY,
      isDragging: true,
    }
  }, [])

  const handleModuleDrag = useCallback(() => {}, [])

  const handleModuleDragEnd = useCallback((moduleId: string) => {
    if (moduleDragRef.current?.moduleId === moduleId) {
      moduleDragRef.current.isDragging = false
    }
  }, [])

  const handlePortMouseDown = useCallback(
    (moduleId: string, direction: 'input' | 'output', portIndex: number, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (direction === 'output') {
        wiringRef.current = {
          sourceModuleId: moduleId,
          sourcePortIndex: portIndex,
          active: true,
        }
        setWiring({
          sourceModuleId: moduleId,
          sourcePortIndex: portIndex,
          mouseX: e.clientX,
          mouseY: e.clientY,
          active: true,
        })
      }
    },
    [setWiring]
  )

  return (
    <div className="h-screen w-screen flex flex-col bg-synth-bg overflow-hidden">
      {/* Top Toolbar */}
      <header className="glass-bar flex items-center justify-between px-5 py-3 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-synth-highlight text-lg">⋎</span>
            <h1 className="font-display font-bold text-base text-white tracking-wide">
              Synth Studio
            </h1>
          </div>
          <span className="font-mono text-[10px] text-slate-500 hidden sm:inline-block">
            虚拟乐器合成器
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-slate-500">
            <span>模块: {moduleCount}</span>
            <span>连线: {connectionCount}</span>
          </div>

          <button
            onClick={togglePlay}
            className={`btn-press flex items-center gap-2 px-5 py-2 rounded-lg font-display font-semibold text-sm transition-all duration-200 ${
              isPlaying
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_12px_rgba(255,107,107,0.3)]'
                : 'bg-synth-primary/20 text-synth-highlight border border-synth-primary/40 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
            }`}
          >
            {isPlaying ? (
              <>
                <span className="text-xs">⏹</span> 停止
              </>
            ) : (
              <>
                <span className="text-xs">▶</span> 播放
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Module Library */}
        <aside className="w-48 shrink-0 border-r border-synth-border/30 bg-synth-surface/50 overflow-y-auto hidden sm:block">
          <ModuleLibrary onDragStart={handleLibraryDragStart} />
        </aside>

        {/* Mobile Module Library Button */}
        <button
          className="sm:hidden fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-synth-primary/80 text-white flex items-center justify-center shadow-glow-purple btn-press"
          onClick={() => {
            const sidebar = document.getElementById('mobile-sidebar')
            sidebar?.classList.toggle('translate-x-0')
            sidebar?.classList.toggle('-translate-x-full')
          }}
        >
          <span className="text-xl">+</span>
        </button>

        {/* Mobile Sidebar Overlay */}
        <div
          id="mobile-sidebar"
          className="sm:hidden fixed left-0 top-0 bottom-0 w-56 z-40 bg-synth-surface/95 backdrop-blur-xl border-r border-synth-border/30 -translate-x-full transition-transform duration-300"
        >
          <div className="pt-16">
            <ModuleLibrary onDragStart={handleLibraryDragStart} />
          </div>
        </div>

        {/* Center - Wire Panel + Waveform */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Waveform */}
          <div className="px-4 pt-3">
            <WaveformVisualizer />
          </div>

          {/* Wire Panel */}
          <div
            ref={(el) => {
              panelRef.current = el
            }}
            className="flex-1 relative"
            onDrop={handlePanelDrop}
            onDragOver={handlePanelDragOver}
          >
            <WirePanel
              onModuleDragStart={handleModuleDragStart}
              onModuleDrag={handleModuleDrag}
              onModuleDragEnd={handleModuleDragEnd}
              onPortMouseDown={handlePortMouseDown}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const CARD_W = 180
const CARD_H = 200

export default App
