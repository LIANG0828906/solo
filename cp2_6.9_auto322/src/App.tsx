import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import Scene from './Scene'
import UI from './UI'
import { DyeColor, Mordant, calculateDyeColor, ColorResult } from './colorEngine'

interface DyeContextType {
  temperature: number
  setTemperature: (t: number) => void
  oxidationTime: number
  setOxidationTime: (t: number) => void
  baseColor: DyeColor
  setBaseColor: (c: DyeColor) => void
  dyeProgress: number
  setDyeProgress: (p: number) => void
  oxidationProgress: number
  setOxidationProgress: (p: number) => void
  mordant: Mordant
  setMordant: (m: Mordant) => void
  mordantProgress: number
  setMordantProgress: (p: number) => void
  isOxidizing: boolean
  setIsOxidizing: (v: boolean) => void
  isMordanting: boolean
  setIsMordanting: (v: boolean) => void
  currentColor: ColorResult
}

const DyeContext = createContext<DyeContextType | null>(null)

export function useDye() {
  const context = useContext(DyeContext)
  if (!context) throw new Error('useDye must be used within DyeProvider')
  return context
}

function App() {
  const [temperature, setTemperature] = useState(20)
  const [oxidationTime, setOxidationTime] = useState(20)
  const [baseColor, setBaseColor] = useState<DyeColor>(null)
  const [dyeProgress, setDyeProgress] = useState(0)
  const [oxidationProgress, setOxidationProgress] = useState(0)
  const [mordant, setMordant] = useState<Mordant>(null)
  const [mordantProgress, setMordantProgress] = useState(0)
  const [isOxidizing, setIsOxidizing] = useState(false)
  const [isMordanting, setIsMordanting] = useState(false)

  const currentColor = useMemo(() => {
    return calculateDyeColor(baseColor, oxidationProgress, mordant, mordantProgress)
  }, [baseColor, oxidationProgress, mordant, mordantProgress])

  const handleSave = useCallback(() => {
    const data = {
      color: currentColor.hex,
      name: currentColor.name,
      temperature,
      oxidationTime,
      mordant,
      timestamp: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `染布_${currentColor.name}_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [currentColor, temperature, oxidationTime, mordant])

  const handleStartOxidation = useCallback(() => {
    if (baseColor && dyeProgress >= 1 && !isOxidizing) {
      setIsOxidizing(true)
      setOxidationProgress(0)
    }
  }, [baseColor, dyeProgress, isOxidizing])

  const handleSelectMordant = useCallback((m: Mordant) => {
    if (baseColor && oxidationProgress >= 1 && !isMordanting && m) {
      setMordant(m)
      setIsMordanting(true)
      setMordantProgress(0)
    }
  }, [baseColor, oxidationProgress, isMordanting])

  const handleReset = useCallback(() => {
    setBaseColor(null)
    setDyeProgress(0)
    setOxidationProgress(0)
    setMordant(null)
    setMordantProgress(0)
    setIsOxidizing(false)
    setIsMordanting(false)
  }, [])

  const contextValue = useMemo<DyeContextType>(() => ({
    temperature,
    setTemperature,
    oxidationTime,
    setOxidationTime,
    baseColor,
    setBaseColor,
    dyeProgress,
    setDyeProgress,
    oxidationProgress,
    setOxidationProgress,
    mordant,
    setMordant,
    mordantProgress,
    setMordantProgress,
    isOxidizing,
    setIsOxidizing,
    isMordanting,
    setIsMordanting,
    currentColor,
  }), [
    temperature,
    oxidationTime,
    baseColor,
    dyeProgress,
    oxidationProgress,
    mordant,
    mordantProgress,
    isOxidizing,
    isMordanting,
    currentColor,
  ])

  return (
    <DyeContext.Provider value={contextValue}>
      <div style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        background: '#f5efe0',
        fontFamily: "'Noto Serif SC', serif",
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #c43a31, #2d6a9f, #e6b422)',
          zIndex: 100,
        }} />
        
        <Canvas
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'transparent',
          }}
          gl={{ antialias: true, alpha: true }}
        >
          <perspectiveCamera makeDefault position={[0, 3, 8]} fov={50} near={0.1} far={1000} lookAt={[0, 1, 0]} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={0.6} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.3} />
          <Scene />
        </Canvas>

        <UI
          onSave={handleSave}
          onOxidize={handleStartOxidation}
          onSelectMordant={handleSelectMordant}
          onReset={handleReset}
          currentColor={currentColor}
          temperature={temperature}
          oxidationTime={oxidationTime}
          isOxidizing={isOxidizing}
          isMordanting={isMordanting}
          oxidationProgress={oxidationProgress}
          canOxidize={!!baseColor && dyeProgress >= 1 && !isOxidizing && oxidationProgress < 1}
          canMordant={!!baseColor && oxidationProgress >= 1 && !isMordanting && mordantProgress < 1}
          mordant={mordant}
        />
      </div>
    </DyeContext.Provider>
  )
}

export default App
