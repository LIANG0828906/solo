import { useCallback, useState, useEffect } from 'react'
import { ArrowLeft, Play, Pause } from 'lucide-react'
import { GameCanvas } from '../components/GameCanvas'
import { ResultPanel } from '../components/ResultPanel'
import { useGameStore } from '../store/useGameStore'

export function GamePage() {
  const {
    screen,
    gameStatus,
    setScreen,
    setGameStatus,
    showResultPanel,
    lastLapStats,
    setShowResultPanel,
    resetGame,
  } = useGameStore()

  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 720 })

  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 40, 1920)
      const maxHeight = Math.min(window.innerHeight - 120, 1080)
      const ratio = 16 / 9

      let width = maxWidth
      let height = width / ratio

      if (height > maxHeight) {
        height = maxHeight
        width = height * ratio
      }

      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const handleBackToMenu = useCallback(() => {
    resetGame()
    setScreen('menu')
  }, [resetGame, setScreen])

  const handleContinue = useCallback(() => {
    setShowResultPanel(false)
    setGameStatus('racing')
  }, [setShowResultPanel, setGameStatus])

  const handlePauseToggle = useCallback(() => {
    if (gameStatus === 'racing') {
      setGameStatus('paused')
    } else if (gameStatus === 'paused') {
      setGameStatus('racing')
    }
  }, [gameStatus, setGameStatus])

  return (
    <div className="relative w-full h-screen min-h-[720px] flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
            top: '-10%',
            left: '-10%',
          }}
        />
      </div>

      <div className="relative z-10 w-full flex items-center justify-between px-6 py-4">
        <button
          onClick={handleBackToMenu}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-purple-500/30 text-white hover:bg-purple-600/30 hover:border-purple-400/50 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回主菜单</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePauseToggle}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-purple-500/30 text-white hover:bg-purple-600/30 hover:border-purple-400/50 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {gameStatus === 'paused' ? (
              <>
                <Play className="w-5 h-5" />
                <span>继续</span>
              </>
            ) : (
              <>
                <Pause className="w-5 h-5" />
                <span>暂停</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center">
        <GameCanvas width={canvasSize.width} height={canvasSize.height} />
      </div>

      <div className="relative z-10 py-4 text-purple-400/60 text-sm text-center">
        <p>WASD 控制方向 · 空格键 + 转向 = 漂移 · 能量满后松空格释放氮气</p>
      </div>

      {showResultPanel && lastLapStats && (
        <ResultPanel
          time={lastLapStats.time}
          driftScore={lastLapStats.driftScore}
          nitroUses={lastLapStats.nitroUses}
          onContinue={handleContinue}
          onBackToMenu={handleBackToMenu}
        />
      )}

      {gameStatus === 'paused' && !showResultPanel && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center">
            <h2
              className="text-5xl font-black text-white mb-4"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              已暂停
            </h2>
            <p className="text-purple-300">点击继续按钮恢复游戏</p>
          </div>
        </div>
      )}
    </div>
  )
}
