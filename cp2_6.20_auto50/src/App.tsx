import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import Stars from '@/components/Stars'
import Earth from '@/components/Earth'
import ControlBar from '@/components/ControlBar'
import Timeline from '@/components/Timeline'
import InfoPanel from '@/components/InfoPanel'
import LoadingScreen from '@/components/LoadingScreen'
import { useClimateStore } from '@/store/useClimateStore'

export default function App() {
  const loadData = useClimateStore((state) => state.loadData)
  const isLoading = useClimateStore((state) => state.isLoading)

  useEffect(() => {
    loadData()
  }, [loadData])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Canvas
        style={{ background: '#0a0e27' }}
        camera={{ position: [0, 0, 4.5], fov: 45 }}
      >
        <Stars />
        <Earth />
      </Canvas>

      <div className="fixed top-0 left-0 right-0 z-10">
        <ControlBar />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10">
        <Timeline />
      </div>

      <div className="fixed top-16 right-4 z-10 md:top-20 md:right-8">
        <InfoPanel />
      </div>
    </div>
  )
}
