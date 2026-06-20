import { useCallback } from 'react'
import { WishingPool } from './components/WishingPool'
import { CoinButton } from './components/CoinButton'
import { HotWords } from './components/HotWords'
import { useWishStore, getTopHotWords } from './store/useWishStore'
import './App.css'

function App() {
  const { totalBottles, hotWords, incrementBottle, addWish } = useWishStore()

  const topWords = getTopHotWords(hotWords, 5)

  const handleCoinDrop = useCallback(() => {
    incrementBottle()
  }, [incrementBottle])

  const handleWishSubmit = useCallback(
    (content: string) => {
      addWish(content)
    },
    [addWish]
  )

  return (
    <div className="app-container">
      <div className="bg-grid" />

      <div className="main-content">
        <h1 className="app-title">微光许愿池</h1>
        <p className="app-subtitle">在静谧的夜里，许下一个心愿</p>

        <WishingPool
          onCoinDrop={handleCoinDrop}
          onWishSubmit={handleWishSubmit}
        />
      </div>

      <CoinButton onClick={handleCoinDrop} />

      <div className="stats-panel">
        <div className="stats-inner">
          <div className="stats-item stats-bottles">
            <div className="stats-label">今日投放</div>
            <div className="stats-value">{totalBottles}</div>
            <div className="stats-unit">个心愿瓶</div>
          </div>

          <div className="stats-divider" />

          <div className="stats-item stats-hotwords">
            <HotWords hotWords={topWords} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
