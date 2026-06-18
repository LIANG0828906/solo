import { useEffect, useRef, useCallback } from 'react'
import { useGameStore, ManualTrigger } from './store'
import { AudioEngine } from './audioEngine'
import { GameEngine } from './gameEngine'
import { GameCanvas, GameOverScreen, StartScreen, RendererHandle } from './renderer'

export default function App() {
  const { phase, finalScore, survivalTime, maxBpm, startGame, endGame, resetGame } = useGameStore()

  const rendererRef = useRef<RendererHandle>(null)
  const audioEngineRef = useRef<AudioEngine | null>(null)
  const gameEngineRef = useRef<GameEngine | null>(null)
  const animFrameRef = useRef<number>(0)
  const manualTriggerRef = useRef<ManualTrigger | null>(null)
  const lastTimeRef = useRef<number>(0)
  const phaseRef = useRef(phase)

  phaseRef.current = phase

  const handleManualDodge = useCallback((direction: number) => {
    manualTriggerRef.current = { direction, time: performance.now() }
  }, [])

  const handleStart = useCallback(() => {
    startGame()
  }, [startGame])

  const handleRestart = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    audioEngineRef.current?.stopListening()
    audioEngineRef.current = null
    gameEngineRef.current = null
    lastTimeRef.current = 0
    manualTriggerRef.current = null
    resetGame()

    setTimeout(() => startGame(), 50)
  }, [resetGame, startGame])

  const handleShare = useCallback(() => {
    const text = `🎵 节奏星际 🚀\n得分: ${finalScore}\n存活: ${Math.floor(survivalTime / 60)}:${Math.floor(survivalTime % 60).toString().padStart(2, '0')}\n最高BPM: ${maxBpm}`
    if (navigator.share) {
      navigator.share({ title: '节奏星际', text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => {
        alert('成绩已复制到剪贴板！')
      }).catch(() => {})
    }
  }, [finalScore, survivalTime, maxBpm])

  useEffect(() => {
    if (phase !== 'playing') return

    const audioEngine = new AudioEngine()
    audioEngineRef.current = audioEngine

    const w = window.innerWidth
    const h = window.innerHeight
    const gameEngine = new GameEngine(w, h)
    gameEngineRef.current = gameEngine

    let running = true

    const startLoop = async () => {
      await audioEngine.startListening()

      const loop = (now: number) => {
        if (!running || phaseRef.current !== 'playing') return

        if (lastTimeRef.current === 0) lastTimeRef.current = now
        const delta = Math.min((now - lastTimeRef.current) / 1000, 0.05)
        lastTimeRef.current = now

        const audio = audioEngine.getAudioFeatures()
        const snapshot = gameEngine.update(audio, delta, manualTriggerRef.current)
        manualTriggerRef.current = null

        if (rendererRef.current) {
          rendererRef.current.draw(snapshot)
        }

        if (snapshot.isGameOver) {
          endGame(snapshot.score, snapshot.survivalTime, snapshot.maxBpm)
          return
        }

        animFrameRef.current = requestAnimationFrame(loop)
      }

      animFrameRef.current = requestAnimationFrame(loop)
    }

    startLoop()

    const handleResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      gameEngine.resize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      running = false
      cancelAnimationFrame(animFrameRef.current)
      audioEngine.stopListening()
      window.removeEventListener('resize', handleResize)
    }
  }, [phase, endGame])

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <GameCanvas ref={rendererRef} onManualDodge={handleManualDodge} />
      <StartScreen visible={phase === 'idle'} onStart={handleStart} />
      <GameOverScreen
        visible={phase === 'gameOver'}
        score={finalScore}
        survivalTime={survivalTime}
        maxBpm={maxBpm}
        onRestart={handleRestart}
        onShare={handleShare}
      />
    </div>
  )
}
