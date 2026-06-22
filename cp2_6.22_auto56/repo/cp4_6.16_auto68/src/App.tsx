import { useEffect } from 'react'
import { useGameStore } from './store/useGameStore'
import { usePlayerStore } from './store/usePlayerStore'
import { MainMenu } from './components/MainMenu'
import { CustomizerPanel } from './components/CustomizerPanel'
import { Leaderboard } from './components/Leaderboard'
import { GamePage } from './pages/GamePage'

function App() {
  const { screen } = useGameStore()
  const { loadPlayer, isLoaded } = usePlayerStore()

  useEffect(() => {
    loadPlayer()
  }, [loadPlayer])

  if (!isLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-purple-300">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-indigo-950">
      {screen === 'menu' && <MainMenu />}
      {screen === 'game' && <GamePage />}
      {screen === 'customize' && <CustomizerPanel />}
      {screen === 'leaderboard' && <Leaderboard />}
    </div>
  )
}

export default App
