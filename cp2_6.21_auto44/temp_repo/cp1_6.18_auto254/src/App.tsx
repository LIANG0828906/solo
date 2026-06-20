import React, { useEffect, useRef, useState } from 'react'
import { ForgeScene } from './main'
import { useForgeStore } from './store'
import RunePanel from './components/RunePanel'
import CollectionShelf from './components/CollectionShelf'
import TopBar from './components/TopBar'
import TemperatureSlider from './components/TemperatureSlider'
import ForgeButton from './components/ForgeButton'
import { RuneType } from './types'

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const forgeSceneRef = useRef<ForgeScene | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOverForge, setDragOverForge] = useState(false)

  const {
    runeSequence,
    temperature,
    isForging,
    forgeStartTime,
    craftedItems,
    currentHint,
    addRune,
    clearRunes,
    setTemperature,
    startForging,
    finishForging
  } = useForgeStore()

  useEffect(() => {
    if (!containerRef.current) return

    const forgeScene = new ForgeScene(containerRef.current)
    forgeScene.start()
    forgeSceneRef.current = forgeScene

    return () => {
      forgeScene.dispose()
      forgeSceneRef.current = null
    }
  }, [])

  useEffect(() => {
    if (forgeSceneRef.current) {
      forgeSceneRef.current.setTemperature(temperature)
    }
  }, [temperature])

  useEffect(() => {
    if (isForging) {
      const timer = setTimeout(() => {
        finishForging()
      }, 3000)
      return () => clearTimeout(timer)
    } else {
      forgeSceneRef.current?.clearRunes()
    }
  }, [isForging, finishForging])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOverForge(true)
  }

  const handleDragLeave = () => {
    setDragOverForge(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverForge(false)
    setIsDragging(false)

    const runeType = e.dataTransfer.getData('runeType') as RuneType
    if (runeType && runeSequence.length < 5 && !isForging) {
      addRune(runeType)
      forgeSceneRef.current?.addRune(runeType)
    }
  }

  const handleForgeClick = () => {
    if (runeSequence.length < 2 || isForging) return
    startForging()
  }

  const handleClearRunes = () => {
    if (isForging) return
    clearRunes()
    forgeSceneRef.current?.clearRunes()
  }

  const canForge = runeSequence.length >= 2 && !isForging

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <div
        ref={containerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'copy' : 'default',
          outline: 'none'
        }}
      />

      {dragOverForge && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -70%)',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            border: '3px dashed #FFB300',
            pointerEvents: 'none',
            zIndex: 5,
            animation: 'pulse-border 1s infinite'
          }}
        />
      )}

      <TopBar
        runeSequence={runeSequence}
        temperature={temperature}
        isForging={isForging}
        forgeStartTime={forgeStartTime}
        hint={currentHint}
        onClearRunes={handleClearRunes}
      />

      <TemperatureSlider
        temperature={temperature}
        onChange={setTemperature}
        disabled={isForging}
      />

      <RunePanel
        onRuneDragStart={() => setIsDragging(true)}
        onRuneDragEnd={() => {
          setIsDragging(false)
          setDragOverForge(false)
        }}
      />

      <CollectionShelf items={craftedItems} />

      <ForgeButton
        onClick={handleForgeClick}
        disabled={!canForge}
        isForging={isForging}
      />

      <style>{`
        @keyframes pulse-border {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -70%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -70%) scale(1.05); }
        }
      `}</style>
    </div>
  )
}

export default App
