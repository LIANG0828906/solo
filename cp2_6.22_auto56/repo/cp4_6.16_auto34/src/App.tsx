import React, { useEffect, useState } from 'react'
import { usePoemStore } from './store/poemStore'
import PoemEditor from './components/PoemEditor'
import ExhibitionCanvas from './components/ExhibitionCanvas'

const App: React.FC = () => {
  const {
    poems,
    currentPoemId,
    isExhibition,
    createPoem,
    deletePoem,
    setCurrentPoemId
  } = usePoemStore()

  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const handleCreatePoem = () => {
    createPoem()
  }

  const handleDeletePoem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (poems.length <= 1) {
      alert('至少保留一首诗')
      return
    }
    if (confirm('确定要删除这首诗吗？')) {
      deletePoem(id)
    }
  }

  if (!isHydrated) {
    return (
      <div className="app-container">
        <div className="empty-state">
          <div className="empty-state-icon">✎</div>
          <div className="empty-state-text">诗境加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">诗 境</h1>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={handleCreatePoem}>
            + 新建
          </button>
        </div>
      </header>

      <div className="app-main">
        <aside className="poem-sidebar">
          <div className="sidebar-header">
            <h3>我的诗集</h3>
            <button className="new-poem-btn" onClick={handleCreatePoem}>
              + 新诗
            </button>
          </div>
          <div className="poem-list">
            {poems.map((poem) => (
              <div
                key={poem.id}
                className={`poem-list-item ${poem.id === currentPoemId ? 'active' : ''}`}
                onClick={() => setCurrentPoemId(poem.id)}
              >
                <button
                  className="poem-item-delete"
                  onClick={(e) => handleDeletePoem(e, poem.id)}
                >
                  删除
                </button>
                <div className="poem-item-title">{poem.title}</div>
                <div className="poem-item-date">
                  {formatDate(poem.updatedAt)}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <PoemEditor />
      </div>

      <ExhibitionCanvas />
    </div>
  )
}

export default App
