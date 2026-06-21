import React, { useState, useEffect, useRef, useCallback } from 'react'
import { GameEngine, GameState } from '../game/GameEngine'
import { GameCanvas } from './GameCanvas'
import { UIOverlay } from './UIOverlay'

export const App: React.FC = () => {
  const engineRef = useRef<GameEngine | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isSmallScreen = screenWidth < 1100
  const isVerySmallScreen = screenWidth < 600

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new GameEngine()
      setGameState(engineRef.current.getState())

      engineRef.current.subscribe((state) => {
        setGameState({ ...state })
      })
    }

    const handleResize = () => {
      setScreenWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleStart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.start()
    }
  }, [])

  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset()
      setTimeout(() => {
        engineRef.current?.start()
      }, 100)
    }
  }, [])

  const getCanvasScale = () => {
    const maxWidth = isVerySmallScreen ? screenWidth - 20 : Math.min(screenWidth - 40, 1000)
    const maxHeight = isVerySmallScreen ? window.innerHeight * 0.8 - 40 : 600
    const scaleX = maxWidth / 1000
    const scaleY = maxHeight / 600
    return Math.min(scaleX, scaleY, 1)
  }

  const scale = getCanvasScale()

  if (!engineRef.current || !gameState) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(circle at center, #1a0a2e, #0a0a1a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: 'Arial, sans-serif'
      }}>
        加载中...
      </div>
    )
  }

  const containerStyle: React.CSSProperties = isVerySmallScreen
    ? {
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        background: 'radial-gradient(circle at center, #1a0a2e, #0a0a1a)',
        overflow: 'hidden',
        paddingTop: '10px'
      }
    : {
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #1a0a2e, #0a0a1a)',
        overflow: 'hidden'
      }

  const gameContainerStyle: React.CSSProperties = {
    position: 'relative',
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
    width: '1000px',
    height: '600px'
  }

  return (
    <div style={containerStyle}>
      <div style={gameContainerStyle}>
        <GameCanvas
          engine={engineRef.current}
          onStart={handleStart}
        />
        <UIOverlay
          gameState={gameState}
          onRestart={handleRestart}
          isMobile={isMobile}
          isSmallScreen={isSmallScreen}
        />
      </div>
      {!isVerySmallScreen && !gameState.isRunning && !gameState.isGameOver && (
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#666',
          fontSize: '14px',
          fontFamily: 'Arial, sans-serif'
        }}>
          Night Roller v1.0 | 最高分: {gameState.highScore.toLocaleString()}
        </div>
      )}
    </div>
  )
}
