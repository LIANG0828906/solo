import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useBoardStore } from './store'
import Board from './components/Board'
import CardModal from './components/CardModal'
import StatsPanel from './components/StatsPanel'
import SearchBar from './components/SearchBar'

function App() {
  const initFromDB = useBoardStore((s) => s.initFromDB)
  const editingCardId = useBoardStore((s) => s.editingCardId)
  const setEditingCardId = useBoardStore((s) => s.setEditingCardId)
  const cards = useBoardStore((s) => s.cards)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    let mounted = true
    initFromDB().then(() => {
      if (mounted) setInitialized(true)
    })
    return () => {
      mounted = false
    }
  }, [initFromDB])

  const editingCard = editingCardId
    ? cards.find((c) => c.id === editingCardId) || null
    : null

  return (
    <Router>
      <div className="wc-app">
        <header className="wc-header">
          <div className="wc-header-left">
            <div className="wc-logo">
              <span className="wc-logo-icon">📋</span>
              <span className="wc-logo-text">WorkflowCanvas</span>
            </div>
          </div>
          <div className="wc-header-center">
            <SearchBar />
          </div>
          <div className="wc-header-right">
            <StatsPanel />
          </div>
        </header>

        <main className="wc-main">
          {initialized ? (
            <Routes>
              <Route path="/" element={<Board />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          ) : (
            <div className="wc-loading">
              <div className="wc-spinner" />
              <div className="wc-loading-text">加载中...</div>
            </div>
          )}
        </main>

        {editingCard && (
          <CardModal
            card={editingCard}
            onClose={() => setEditingCardId(null)}
          />
        )}
      </div>
    </Router>
  )
}

export default App
