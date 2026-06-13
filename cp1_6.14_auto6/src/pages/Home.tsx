import { useEffect, useState, useCallback, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Toolbar, { ScreenshotHelper } from '@/components/Toolbar'
import Terrain from '@/components/Terrain'
import { useStore } from '@/components/useStore'
import { fetchFlags } from '@/components/FlagManager'

export default function Home() {
  const { setFlags, mode, flags } = useStore()
  const [isLandscape, setIsLandscape] = useState(false)
  const [captureCallback, setCaptureCallback] = useState<((url: string) => void) | null>(null)

  useEffect(() => {
    fetchFlags().then((data) => {
      if (data && data.length > 0) {
        setFlags(data)
      }
    })
  }, [setFlags])

  useEffect(() => {
    const checkOrientation = () => {
      const landscape = window.innerWidth > window.innerHeight && window.innerHeight < 500
      setIsLandscape(landscape)
    }
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    const mql = window.matchMedia('(orientation: landscape) and (max-height: 500px)')
    mql.addEventListener('change', checkOrientation)
    return () => {
      window.removeEventListener('resize', checkOrientation)
      mql.removeEventListener('change', checkOrientation)
    }
  }, [])

  const handleCapture = useCallback((url: string) => {
    if (url && captureCallback) {
      captureCallback(url)
    }
  }, [captureCallback])

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#0a1628]">
      <div
        className="w-full h-full transition-all duration-500"
        style={{
          paddingLeft: isLandscape ? '56px' : '72px',
        }}
      >
        <Canvas
          gl={{
            preserveDrawingBuffer: true,
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
          }}
          camera={{
            position: [8, 10, 12],
            fov: 50,
            near: 0.1,
            far: 100,
          }}
          dpr={[1, 2]}
          style={{ background: 'linear-gradient(180deg, #0d1b2a 0%, #1b2d4a 50%, #2a3f5f 100%)' }}
        >
          <Suspense fallback={null}>
            <Terrain />
            <ScreenshotHelper onCapture={handleCapture} />
          </Suspense>
        </Canvas>
      </div>

      <Toolbar />

      {isLandscape && (
        <div className="fixed top-2 right-2 z-50 px-2 py-1 rounded-lg bg-black/30 text-white/40 text-[10px] backdrop-blur-sm">
          横屏模式
        </div>
      )}

      {mode === 'place' && flags.length === 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-black/30 backdrop-blur-sm text-white/60 text-sm pointer-events-none animate-pulse">
          点击地形表面放置旗子
        </div>
      )}
    </div>
  )
}
