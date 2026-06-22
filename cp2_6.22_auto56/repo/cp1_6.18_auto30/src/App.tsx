import React, { useEffect, useState } from 'react'
import { useStore } from './store'
import BottleCard from './components/BottleCard'
import MessageModal from './components/MessageModal'
import ThrowForm from './components/ThrowForm'
import { Plus } from 'lucide-react'

const App: React.FC = () => {
  const {
    bottles,
    currentMessage,
    loading,
    toastMessage,
    fetchBottles,
    pickBottle,
    throwBottle,
    throwNewBottle,
    closeMessage,
  } = useStore()

  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchBottles()
  }, [fetchBottles])

  const handleThrowNew = (data: { url: string; comment: string; emoji: string; tag: string }) => {
    throwNewBottle(data)
    setShowForm(false)
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">🌊 收藏夹漂流瓶</h1>
        <p className="app-subtitle">捡起一个瓶子，发现一段未知的旅程</p>
      </header>

      {loading && bottles.length === 0 ? (
        <div className="app-loading">
          <div className="loading-spinner" />
          <p>海浪正在送来漂流瓶...</p>
        </div>
      ) : bottles.length === 0 ? (
        <div className="app-empty">
          <p className="empty-emoji">🌊</p>
          <p>海面上暂时没有漂流瓶了</p>
          <p className="empty-hint">点击右上角按钮扔回一个吧</p>
        </div>
      ) : (
        <div className="bottle-grid">
          {bottles.map((bottle) => (
            <BottleCard
              key={bottle.id}
              bottle={bottle}
              onPick={pickBottle}
              onThrow={throwBottle}
            />
          ))}
        </div>
      )}

      <button
        className="fab-button"
        onClick={() => setShowForm(true)}
        title="扔回一个漂流瓶"
      >
        <Plus size={24} />
      </button>

      {currentMessage && (
        <MessageModal message={currentMessage} onClose={closeMessage} />
      )}

      {showForm && (
        <ThrowForm onSubmit={handleThrowNew} onClose={() => setShowForm(false)} />
      )}

      {toastMessage && (
        <div className="toast-message">{toastMessage}</div>
      )}
    </div>
  )
}

export default App
