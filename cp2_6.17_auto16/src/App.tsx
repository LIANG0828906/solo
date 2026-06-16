import { useEffect, useRef } from 'react'
import { SunScene } from './renderer/scene'
import { createUIPanel } from './renderer/uiFactory'
import { useSunStore } from './storage/store'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<SunScene | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new SunScene(containerRef.current)
    sceneRef.current = scene

    createUIPanel(containerRef.current)

    scene.start()

    const unsubscribe = useSunStore.subscribe((state) => {
      if (sceneRef.current) {
        sceneRef.current.updateSunFromStore()
      }
    })

    const loadingEl = document.getElementById('loading')
    if (loadingEl) {
      setTimeout(() => {
        loadingEl.classList.add('hidden')
        setTimeout(() => {
          loadingEl.style.display = 'none'
        }, 500)
      }, 300)
    }

    return () => {
      unsubscribe()
      scene.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    />
  )
}
