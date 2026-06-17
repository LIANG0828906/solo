import React, { useEffect } from 'react'
import { GameBoard } from '@/ui/GameBoard'
import { HeroPanel } from '@/ui/HeroPanel'
import { BattleLog } from '@/ui/BattleLog'
import { useGameStore } from '@/stores/gameStore'
import { gameEngine } from '@/engine/GameEngine'

const WinModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn">
    <div className="modal-content bg-gradient-to-br from-[var(--win-start)] to-[var(--win-end)] p-10 rounded-[16px] shadow-2xl text-center transform transition-all duration-300 scale-100">
      <h2 className="text-white text-[32px] font-bold mb-4">胜利！</h2>
      <p className="text-white/80 mb-6">恭喜你击败了所有怪物！</p>
      <button
        onClick={onClose}
        className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 font-medium"
      >
        再来一局
      </button>
    </div>
  </div>
)

const LoseModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn">
    <div className="modal-content bg-gradient-to-br from-[var(--lose-start)] to-[var(--lose-end)] p-10 rounded-[16px] shadow-2xl text-center transform transition-all duration-300 scale-100">
      <h2 className="text-white text-[32px] font-bold mb-4">失败</h2>
      <p className="text-white/80 mb-6">你的英雄小队全军覆没...</p>
      <button
        onClick={onClose}
        className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 font-medium"
      >
        重新开始
      </button>
    </div>
  </div>
)

const App: React.FC = () => {
  const { gameStatus, resetGame } = useGameStore()

  useEffect(() => {
    gameEngine.start()

    return () => {
      gameEngine.stop()
    }
  }, [])

  return (
    <div className="app-container min-h-screen bg-[var(--app-bg)] flex flex-col h-screen">
      <div className="main-layout flex flex-1 overflow-hidden">
        <HeroPanel />

        <main className="board-container flex-1 flex items-center justify-center p-4 overflow-auto">
          <div className="w-[80%] min-h-[600px] flex items-center justify-center">
            <GameBoard />
          </div>
        </main>
      </div>

      <BattleLog />

      {gameStatus === 'won' && <WinModal onClose={resetGame} />}
      {gameStatus === 'lost' && <LoseModal onClose={resetGame} />}
    </div>
  )
}

export default App
