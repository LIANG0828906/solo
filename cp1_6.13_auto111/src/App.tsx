import { useState, useEffect, useRef, useCallback } from 'react'
import SceneManager from '@/scene/SceneManager'
import ControlPanel from '@/components/ControlPanel'
import { saveAs } from 'file-saver'
import type { PaintingData, WallMaterial, LightPreset, HistoryState, FrameColor } from '@/types'

const MAX_HISTORY = 20

const FRAME_COLORS: FrameColor[] = ['gold', 'black', 'white']

function randomFrameColor(): FrameColor {
  return FRAME_COLORS[Math.floor(Math.random() * FRAME_COLORS.length)]
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function clonePaintings(paintings: PaintingData[]): PaintingData[] {
  return paintings.map((p) => ({
    ...p,
    position: { ...p.position },
  }))
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)
  const [paintings, setPaintings] = useState<PaintingData[]>([])
  const [wallMaterial, setWallMaterialState] = useState<WallMaterial>('white')
  const [lightPreset, setLightPresetState] = useState<LightPreset>('natural')
  const [loadingProgress, setLoadingProgress] = useState<number | null>(null)
  const historyRef = useRef<HistoryState[]>([])
  const historyIndexRef = useRef<number>(-1)
  const isRestoringRef = useRef(false)

  const pushHistory = useCallback(() => {
    if (isRestoringRef.current) return
    const newState: HistoryState = {
      paintings: clonePaintings(paintings),
      wallMaterial,
      lightPreset,
    }
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    historyRef.current.push(newState)
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current = historyRef.current.slice(-MAX_HISTORY)
    }
    historyIndexRef.current = historyRef.current.length - 1
  }, [paintings, wallMaterial, lightPreset])

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current--
    const state = historyRef.current[historyIndexRef.current]
    isRestoringRef.current = true
    applyState(state)
    isRestoringRef.current = false
  }, [])

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current++
    const state = historyRef.current[historyIndexRef.current]
    isRestoringRef.current = true
    applyState(state)
    isRestoringRef.current = false
  }, [])

  const applyState = useCallback((state: HistoryState) => {
    setPaintings(state.paintings)
    setWallMaterialState(state.wallMaterial)
    setLightPresetState(state.lightPreset)
    const sm = sceneManagerRef.current
    if (!sm) return
    sm.clearPaintings()
    state.paintings.forEach((p) => sm.addPainting(p))
    sm.setWallMaterial(state.wallMaterial)
    sm.setLightPreset(state.lightPreset)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const sm = new SceneManager(containerRef.current, (id, updates) => {
      setPaintings((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
        return next
      })
    })
    sceneManagerRef.current = sm
    const initState: HistoryState = {
      paintings: [],
      wallMaterial: 'white',
      lightPreset: 'natural',
    }
    historyRef.current = [initState]
    historyIndexRef.current = 0
    return () => {
      sm.dispose()
      sceneManagerRef.current = null
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        undo()
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  const handleImagesUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).slice(0, 8 - paintings.length)
    if (fileArray.length === 0) return
    const sm = sceneManagerRef.current
    if (!sm) return
    setLoadingProgress(0)
    const newPaintings: PaintingData[] = []
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      const url = URL.createObjectURL(file)
      const aspect = await new Promise<number>((resolve) => {
        const img = new Image()
        img.onload = () => resolve(img.width / img.height)
        img.onerror = () => resolve(1)
        img.src = url
      })
      newPaintings.push({ url, aspect, file })
      setLoadingProgress(Math.round(((i + 1) / fileArray.length) * 100))
    }
    pushHistory()
    const existingCount = paintings.length
    const totalCount = existingCount + newPaintings.length
    const spacing = 10 / Math.max(totalCount, 1)
    const startX = -((totalCount - 1) * spacing) / 2
    const finalPaintings: PaintingData[] = []
    for (let i = 0; i < newPaintings.length; i++) {
      const { url, aspect } = newPaintings[i]
      const data: PaintingData = {
        id: generateId(),
        imageUrl: url,
        position: { x: startX + (existingCount + i) * spacing, y: 2.5 },
        scale: 1,
        rotationY: 0,
        frameColor: randomFrameColor(),
        aspectRatio: aspect,
      }
      finalPaintings.push(data)
      await sm.addPainting(data)
    }
    setPaintings((prev) => [...prev, ...finalPaintings])
    setLoadingProgress(null)
  }, [paintings, pushHistory])

  const handleWallMaterialChange = useCallback((material: WallMaterial) => {
    pushHistory()
    setWallMaterialState(material)
    sceneManagerRef.current?.setWallMaterial(material)
  }, [pushHistory])

  const handleLightPresetChange = useCallback((preset: LightPreset) => {
    pushHistory()
    setLightPresetState(preset)
    sceneManagerRef.current?.setLightPreset(preset)
  }, [pushHistory])

  const handleResetCamera = useCallback(() => {
    sceneManagerRef.current?.resetCamera()
  }, [])

  const handleExportScreenshot = useCallback(async () => {
    const sm = sceneManagerRef.current
    if (!sm) return
    try {
      const blob = await sm.screenshot()
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      saveAs(blob, `artplacer-${timestamp}.png`)
    } catch (err) {
      console.error('Failed to export screenshot:', err)
    }
  }, [])

  const handlePaintingUpdate = useCallback(() => {
    pushHistory()
  }, [pushHistory])

  useEffect(() => {
    if (!isRestoringRef.current && (paintings.length > 0 || historyRef.current.length > 0)) {
    }
  }, [paintings, wallMaterial, lightPreset])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-sky-200 to-white">
      <div ref={containerRef} className="w-full h-full" />

      {loadingProgress !== null && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-xl px-6 py-3 shadow-lg z-50">
          <div className="text-sm font-medium text-gray-700 mb-2">加载画作中... {loadingProgress}%</div>
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-300 rounded-full"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      )}

      <ControlPanel
        paintings={paintings}
        wallMaterial={wallMaterial}
        lightPreset={lightPreset}
        onImagesUpload={handleImagesUpload}
        onWallMaterialChange={handleWallMaterialChange}
        onLightPresetChange={handleLightPresetChange}
        onResetCamera={handleResetCamera}
        onExportScreenshot={handleExportScreenshot}
        onPaintingInteractionEnd={handlePaintingUpdate}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndexRef.current > 0}
        canRedo={historyIndexRef.current < historyRef.current.length - 1}
      />
    </div>
  )
}
