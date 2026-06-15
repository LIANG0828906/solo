import { useEffect, useRef } from 'react'
import { SceneManager } from './modules/scene/SceneManager'
import { UIManager } from './modules/ui/UIManager'
import { useInteriorStore } from './store/useInteriorStore'
import type { AreaId } from './types'

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)
  const sceneApiRef = useRef<{
    applyStyle: (id: any) => void
    setAreaMaterial: (a: AreaId, mid: string) => void
    animateCameraTo: (v: 'top' | 'firstPerson') => void
    resetCamera: () => void
    rotateCamera: (d: number) => void
    setFloorTextureImage: (url: string) => void
    clearFloorTexture: () => void
  } | null>(null)

  const setSelectedArea = useInteriorStore((s) => s.setSelectedArea)
  const storeGet = useInteriorStore.getState

  useEffect(() => {
    if (!canvasRef.current) return

    const mgr = new SceneManager(canvasRef.current, storeGet)
    sceneManagerRef.current = mgr
    sceneApiRef.current = {
      applyStyle: (id) => mgr.applyStyle(id),
      setAreaMaterial: (a, mid) => mgr.setAreaMaterial(a, mid),
      animateCameraTo: (v) => mgr.animateCameraTo(v),
      resetCamera: () => mgr.resetCamera(),
      rotateCamera: (d) => mgr.rotateCamera(d),
      setFloorTextureImage: (url) => mgr.setFloorTextureImage(url),
      clearFloorTexture: () => mgr.clearFloorTexture(),
    }
    mgr.start()

    const handleClick = (ev: MouseEvent) => {
      if (!canvasRef.current || !sceneManagerRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const ndc = {
        x: ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((ev.clientY - rect.top) / rect.height) * 2 + 1,
      }
      const area = sceneManagerRef.current.pickArea(ndc)
      if (area) {
        setSelectedArea(area)
      }
    }
    canvasRef.current.addEventListener('click', handleClick)

    const resize = () => {
      if (!canvasRef.current || !sceneManagerRef.current) return
      const renderer = sceneManagerRef.current.renderer
      const w = canvasRef.current.clientWidth
      const h = canvasRef.current.clientHeight
      sceneManagerRef.current.camera.aspect = w / h
      sceneManagerRef.current.camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvasRef.current)

    return () => {
      canvasRef.current?.removeEventListener('click', handleClick)
      observer.disconnect()
      mgr.dispose()
      sceneManagerRef.current = null
      sceneApiRef.current = null
    }
  }, [storeGet, setSelectedArea])

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#f0ebe3' }}>
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ display: 'block', cursor: 'crosshair' }}
      />
      <UIManager sceneRef={sceneApiRef} />
    </div>
  )
}

export default App
