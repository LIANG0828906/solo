import React, { useEffect } from 'react'
import { useGameStore } from './store/useGameStore'
import GamePanel from './ui/GamePanel'
import CanvasBoard from './ui/CanvasBoard'

const App: React.FC = () => {
  const { isVictory } = useGameStore()

  useEffect(() => {
    if (isVictory) {
      ;(window as any).__victoryStart = performance.now()
      ;(window as any).__victoryStartReset = true
      setTimeout(() => {
        ;(window as any).__victoryStartReset = false
      }, 100)
    }
  }, [isVictory])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#1F2833',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        padding: 24,
        gap: 24,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 280,
          minWidth: 280,
          display: 'flex',
          alignItems: 'flex-start',
          paddingTop: 0,
        }}
      >
        <GamePanel />
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
        }}
      >
        <CanvasBoard />
      </div>
    </div>
  )
}

export default App
