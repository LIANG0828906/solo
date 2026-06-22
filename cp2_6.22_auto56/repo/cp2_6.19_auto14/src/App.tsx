import React, { useEffect, useRef, useCallback, useState } from 'react'
import { useModuleStore, ModuleType, SynthModule } from '@/store/moduleStore'
import { ModuleLibrary } from '@/components/ModuleCard'
import { WirePanel, getGlobalPortPosition } from '@/components/WirePanel'
import { CARD_WIDTH, CARD_HEIGHT } from '@/components/ModuleCard'
import { audioEngine } from '@/utils/audioEngine'

const GRID_SIZE = 24

function snap(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

const PORT_HIT_RADIUS = 22

interface WaveformProps {
  height?: number
}

const WaveformVisualizer: React.FC<WaveformProps> = ({ height = 110 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const isPlaying = useModuleStore((s) => s.isPlaying)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const render = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        rafRef.current = requestAnimationFrame(render)
        return
      }

      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const W = Math.max(1, Math.floor(rect.width))
      const H = Math.max(1, Math.floor(rect.height))

      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr
        canvas.height = H * dpr
        canvas.style.width = W + 'px'
        canvas.style.height = H + 'px'
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)

      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, 'rgba(124,58,237,0.07)')
      bg.addColorStop(1, 'rgba(15,15,27,0.9)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = 'rgba(124,58,237,0.08)'
      ctx.lineWidth = 1
      for (let x = 0; x < W; x += 30) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
        ctx.stroke()
      }
      for (let y = 0; y < H; y += 30) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
      }

      ctx.strokeStyle = 'rgba(124,58,237,0.25)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(0, H / 2)
      ctx.lineTo(W, H / 2)
      ctx.stroke()
      ctx.setLineDash([])

      const analyser = audioEngine.getAnalyser()

      if (isPlaying && analyser) {
        const bufferLength = analyser.fftSize
        const data = new Uint8Array(bufferLength)
        analyser.getByteTimeDomainData(data)

        ctx.lineWidth = 2.5
        ctx.strokeStyle = '#22d3ee'
        ctx.shadowColor = '#22d3ee'
        ctx.shadowBlur = 10
        ctx.beginPath()

        const step = W / bufferLength
        for (let i = 0; i < bufferLength; i++) {
          const v = data[i] / 128
          const y = v * (H / 2)
          const x = i * step
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

        ctx.shadowBlur = 0
        ctx.lineWidth = 0.8
        ctx.strokeStyle = 'rgba(34,211,238,0.3)'
        ctx.beginPath()
        for (let i = 0; i < bufferLength; i++) {
          const v = data[i] / 128
          const y = v * (H / 2) + 1.5
          const x = i * step
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

        const freqData = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(freqData)
        const bars = Math.min(32, Math.floor(W / 6))
        const barW = W / bars
        ctx.fillStyle = 'rgba(124,58,237,0.25)'
        for (let b = 0; b < bars; b++) {
          const fi = Math.floor((b / bars) * freqData.length * 0.7)
          const v = freqData[fi] / 255
          const bh = v * (H * 0.35)
          if (bh > 1) {
            ctx.fillRect(b * barW + 1, H - bh, Math.max(1, barW - 2), bh)
          }
        }
      } else {
        const t = Date.now() / 1000
        ctx.lineWidth = 1.2
        ctx.strokeStyle = 'rgba(34,211,238,0.25)'
        ctx.shadowColor = 'rgba(34,211,238,0.1)'
        ctx.shadowBlur = 3
        ctx.beginPath()
        for (let x = 0; x < W; x++) {
          const y =
            H / 2 +
            Math.sin(x * 0.02 + t * 1.8) * 4 * Math.sin(x * 0.007 + t * 0.5) +
            Math.sin(x * 0.05 + t * 0.9) * 2
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.shadowBlur = 0

        ctx.strokeStyle = 'rgba(124,58,237,0.12)'
        ctx.lineWidth = 0.8
        ctx.beginPath()
        for (let x = 0; x < W; x++) {
          const y = H / 2 + Math.cos(x * 0.013 - t * 1.2) * 3 * Math.cos(x * 0.02 + t * 0.3)
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying])

  return (
    <div className="waveform-container" style={{ height, marginBottom: 10 }}>
      <canvas ref={canvasRef} className="w-full h-full rounded-[10px]" />
      <div className="absolute top-2 left-3 font-mono text-[10px] text-synth-highlight/60 uppercase tracking-[0.2em]">
        波形监视器 / Waveform
      </div>
      <div className="absolute top-2 right-3 flex items-center gap-1.5">
        {isPlaying && (
          <>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="font-mono text-[10px] text-red-300/80 uppercase tracking-wider">
              REC
            </span>
          </>
        )}
      </div>
    </div>
  )
}

const App: React.FC = () => {
  const {
    isPlaying,
    addModule,
    setPlaying,
    setWiring,
    addConnection,
    moveModule,
    activateChain,
    resetActivation,
    triggerSpringIn,
    modules,
    connections,
    wiring,
  } = useModuleStore()

  const moduleCount = useModuleStore((s) => s.modules.length)
  const connectionCount = useModuleStore((s) => s.connections.length)

  const panelRef = useRef<HTMLDivElement | null>(null)
  const [panelRect, setPanelRect] = useState({ left: 0, top: 0 })

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
    const update = () => {
      if (panelRef.current) {
        const r = panelRef.current.getBoundingClientRect()
        setPanelRect({ left: r.left, top: r.top })
      }
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    const observer = panelRef.current ? new ResizeObserver(update) : null
    if (panelRef.current && observer) observer.observe(panelRef.current)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      observer?.disconnect()
    }
  }, [])

  const findNearestPort = useCallback(
    (
      clientX: number,
      clientY: number,
      preferredDirection: 'input' | 'output'
    ): { moduleId: string; direction: 'input' | 'output'; portIndex: number } | null => {
      let best: {
        moduleId: string
        direction: 'input' | 'output'
        portIndex: number
        dist: number
      } | null = null

      for (const mod of modules) {
        for (let i = 0; i < 3; i++) {
          const p = getGlobalPortPosition(mod, preferredDirection, i, panelRect)
          const dx = p.x - clientX
          const dy = p.y - clientY
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < PORT_HIT_RADIUS && (!best || d < best.dist)) {
            best = { moduleId: mod.id, direction: preferredDirection, portIndex: i, dist: d }
          }
        }
      }

      return best ? { moduleId: best.moduleId, direction: best.direction, portIndex: best.portIndex } : null
    },
    [modules, panelRect]
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (moduleDragRef.current?.isDragging) {
        const { moduleId, offsetX, offsetY } = moduleDragRef.current
        const panel = panelRef.current
        if (!panel) return
        const pr = panel.getBoundingClientRect()
        const nx = snap(e.clientX - pr.left - offsetX)
        const ny = snap(e.clientY - pr.top - offsetY)
        const cx = Math.max(0, Math.min(pr.width - CARD_WIDTH, nx))
        const cy = Math.max(0, Math.min(pr.height - CARD_HEIGHT, ny))
        moveModule(moduleId, cx, cy)
      }

      if (wiringRef.current?.active) {
        const hoverTargetPort = findNearestPort(e.clientX, e.clientY, 'input')
        setWiring({
          sourceModuleId: wiringRef.current.sourceModuleId,
          sourcePortIndex: wiringRef.current.sourcePortIndex,
          mouseX: e.clientX,
          mouseY: e.clientY,
          active: true,
          hoverTargetPort,
        })
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (moduleDragRef.current?.isDragging) {
        moduleDragRef.current.isDragging = false
        moduleDragRef.current = null
      }

      if (wiringRef.current?.active) {
        const target = findNearestPort(e.clientX, e.clientY, 'input')
        if (target && target.direction === 'input') {
          addConnection(
            wiringRef.current.sourceModuleId,
            wiringRef.current.sourcePortIndex,
            target.moduleId,
            target.portIndex
          )
        }

        wiringRef.current = null
        setWiring({
          sourceModuleId: null,
          sourcePortIndex: 0,
          mouseX: 0,
          mouseY: 0,
          active: false,
          hoverTargetPort: null,
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseup', handleMouseUp, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [moveModule, setWiring, addConnection, findNearestPort])

  useEffect(() => {
    if (!isPlaying) return
    if (modules.length === 0) return

    const tick = () => {
      const s = useModuleStore.getState()
      audioEngine.stop()
      audioEngine.start(s.modules, s.connections)
    }

    const interval = window.setInterval(tick, 400)
    return () => window.clearInterval(interval)
  }, [isPlaying, modules.length, connections.length])

  const handlePlay = useCallback(() => {
    audioEngine.initFromUserGesture()

    const willPlay = !isPlaying
    setPlaying(willPlay)

    if (willPlay) {
      if (modules.length === 0) return
      setTimeout(() => {
        const s = useModuleStore.getState()
        audioEngine.start(s.modules, s.connections)
        activateChain()
      }, 10)
    } else {
      audioEngine.stop()
      resetActivation()
    }
  }, [isPlaying, setPlaying, modules.length, activateChain, resetActivation])

  const handleLibraryDragStart = useCallback((type: ModuleType, e: React.DragEvent) => {
    e.dataTransfer.setData('application/x-synth-module', type)
    e.dataTransfer.effectAllowed = 'copy'
  }, [])

  const handlePanelDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const type = e.dataTransfer.getData('application/x-synth-module') as ModuleType
      if (!type) return

      const panel = panelRef.current
      if (!panel) return
      const pr = panel.getBoundingClientRect()

      let x = snap(e.clientX - pr.left - CARD_WIDTH / 2)
      let y = snap(e.clientY - pr.top - CARD_HEIGHT / 2)
      x = Math.max(0, Math.min(pr.width - CARD_WIDTH, x))
      y = Math.max(0, Math.min(pr.height - CARD_HEIGHT, y))

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
    const panel = panelRef.current
    if (!panel) return
    const pr = panel.getBoundingClientRect()
    const s = useModuleStore.getState()
    const mod = s.modules.find((m: SynthModule) => m.id === moduleId)
    if (!mod) return

    moduleDragRef.current = {
      moduleId,
      offsetX: e.clientX - pr.left - mod.gridX,
      offsetY: e.clientY - pr.top - mod.gridY,
      isDragging: true,
    }
  }, [])

  const handleModuleDrag = useCallback(() => {}, [])

  const handleModuleDragEnd = useCallback((moduleId: string) => {
    if (moduleDragRef.current?.moduleId === moduleId) {
      moduleDragRef.current.isDragging = false
      triggerSpringIn(moduleId)
    }
  }, [triggerSpringIn])

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
          hoverTargetPort: null,
        })
      }
    },
    [setWiring]
  )

  return (
    <div className="h-screen w-screen flex flex-col bg-synth-bg overflow-hidden">
      {/* Top Toolbar */}
      <header className="glass-bar flex items-center justify-between px-5 py-3 z-50 relative">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(34,211,238,0.3))',
                boxShadow: '0 0 16px rgba(124,58,237,0.35)',
              }}
            >
              <span className="text-synth-highlight text-base leading-none">⋎</span>
            </div>
            <div className="flex flex-col leading-tight">
              <h1 className="font-display font-bold text-sm text-white tracking-wide">
                Synth Studio
              </h1>
              <span className="font-mono text-[9px] text-slate-500 hidden sm:block tracking-widest uppercase">
                Modular Synthesizer
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:flex items-center gap-3 font-mono text-[10px] text-slate-500 px-3 py-1.5 rounded-md bg-synth-bg/50 border border-synth-border/30">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-synth-primary" />
              模块 {moduleCount}
            </span>
            <span className="opacity-30">│</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-synth-highlight" />
              连线 {connectionCount}
            </span>
          </div>

          <button
            onClick={handlePlay}
            className={`btn-press group flex items-center gap-2.5 px-5 py-2.5 rounded-lg font-display font-semibold text-sm transition-all duration-200 ${
              isPlaying
                ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-200 border border-red-500/40 hover:border-red-400/60'
                : 'bg-gradient-to-r from-synth-primary/25 to-synth-highlight/20 text-synth-highlight border border-synth-primary/40 hover:border-synth-primary/70 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]'
            }`}
            style={
              isPlaying
                ? { boxShadow: '0 0 16px rgba(255,107,107,0.3), inset 0 0 10px rgba(255,107,107,0.1)' }
                : undefined
            }
          >
            <span className={`text-xs leading-none ${isPlaying ? 'text-red-300' : 'text-synth-primary'}`}>
              {isPlaying ? '■' : '▶'}
            </span>
            {isPlaying ? '停止' : '播放'}
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 border-r border-synth-border/30 bg-synth-surface/40 overflow-y-auto hidden sm:block">
          <ModuleLibrary onDragStart={handleLibraryDragStart} />
        </aside>

        {/* Mobile FAB */}
        <button
          className="sm:hidden fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center btn-press"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #22d3ee)',
            boxShadow: '0 0 24px rgba(124,58,237,0.6)',
          }}
          onClick={() => {
            const el = document.getElementById('mobile-drawer')
            el?.classList.toggle('translate-x-0')
            el?.classList.toggle('-translate-x-full')
          }}
        >
          <span className="text-white text-2xl leading-none">+</span>
        </button>

        {/* Mobile Drawer */}
        <div
          id="mobile-drawer"
          className="sm:hidden fixed inset-y-0 left-0 z-40 w-64 -translate-x-full transition-transform duration-300 ease-out border-r border-synth-border/40"
          style={{
            background: 'linear-gradient(180deg, rgba(26,26,46,0.98), rgba(15,15,27,0.98))',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="pt-20">
            <ModuleLibrary onDragStart={handleLibraryDragStart} />
          </div>
        </div>

        {/* Center */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Waveform */}
          <div className="px-4 pt-3">
            <WaveformVisualizer height={110} />
          </div>

          {/* WirePanel */}
          <div
            ref={panelRef}
            className="flex-1 relative min-h-0"
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

export default App
