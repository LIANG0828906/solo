import { useEffect, useRef, useState } from 'react'
import { GameController } from './GameController'
import { AudioAnalyzer } from './AudioAnalyzer'
import { useGameStore } from './state'
import LoadingScreen from './components/LoadingScreen'
import GameCanvas from './components/GameCanvas'
import StatusBar from './components/StatusBar'
import GameOverScreen from './components/GameOverScreen'
import PauseScreen from './components/PauseScreen'
import LevelUpEffect from './components/LevelUpEffect'
import './App.css'

function App() {
  const gameControllerRef = useRef<GameController | null>(null)
  const audioAnalyzerRef = useRef<AudioAnalyzer | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzedBpm, setAnalyzedBpm] = useState(0)
  const gameState = useGameStore((state) => state.gameState)

  useEffect(() => {
    gameControllerRef.current = new GameController()
    audioAnalyzerRef.current = new AudioAnalyzer()

    return () => {
      if (gameControllerRef.current) {
        gameControllerRef.current.destroy()
      }
      if (audioAnalyzerRef.current) {
        audioAnalyzerRef.current.destroy()
      }
    }
  }, [])

  const handleFileDrop = async (file: File) => {
    if (!audioAnalyzerRef.current || !gameControllerRef.current) return

    setIsAnalyzing(true)
    setAnalyzedBpm(0)

    try {
      const result = await audioAnalyzerRef.current.analyzeFile(file)
      setAnalyzedBpm(result.bpm)
      gameControllerRef.current.setAudioFile(file, result)
    } catch (error) {
      console.error('Audio analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDemo = () => {
    if (!gameControllerRef.current) return
    gameControllerRef.current.startDemo()
  }

  return (
    <div className="app-container">
      {gameState === 'loading' && (
        <LoadingScreen
          onFileDrop={handleFileDrop}
          onDemo={handleDemo}
          isAnalyzing={isAnalyzing}
          bpm={analyzedBpm}
        />
      )}

      {(gameState === 'ready' ||
        gameState === 'playing' ||
        gameState === 'paused' ||
        gameState === 'gameover') && (
        <>
          <StatusBar />
          <GameCanvas />
          <LevelUpEffect />
        </>
      )}

      {gameState === 'paused' && <PauseScreen />}
      {gameState === 'gameover' && <GameOverScreen />}
    </div>
  )
}

export default App
