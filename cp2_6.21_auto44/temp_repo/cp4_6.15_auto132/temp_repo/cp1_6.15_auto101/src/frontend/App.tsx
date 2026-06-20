import React, { useState, useEffect, useCallback } from 'react'
import GalleryPage from './pages/GalleryPage'
import DetailPage from './pages/DetailPage'

type Page = 'gallery' | 'detail'

const CURRENT_USER_ID = 'user-1'

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('gallery')
  const [selectedGameId, setSelectedGameId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleGameClick = useCallback((gameId: string) => {
    setSelectedGameId(gameId)
    setCurrentPage('detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleBack = useCallback(() => {
    setCurrentPage('gallery')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleTagFilter = useCallback((tag: string | null) => {
    setSelectedTag(tag)
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
  }

  const handleLogoClick = () => {
    setCurrentPage('gallery')
    setSelectedTag(null)
    setSearchInput('')
    setSearchQuery('')
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-content">
          <h1 className="app-logo" onClick={handleLogoClick}>
            🎮 IndieGame Hub
          </h1>
          {currentPage === 'gallery' && (
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="搜索游戏或开发者..."
                value={searchInput}
                onChange={handleSearchChange}
              />
            </div>
          )}
        </div>
      </nav>

      <main className="main-content">
        {currentPage === 'gallery' && (
          <GalleryPage
            searchQuery={searchQuery}
            onGameClick={handleGameClick}
            onTagFilter={handleTagFilter}
            selectedTag={selectedTag}
          />
        )}
        {currentPage === 'detail' && selectedGameId && (
          <DetailPage
            gameId={selectedGameId}
            onBack={handleBack}
            currentUserId={CURRENT_USER_ID}
          />
        )}
      </main>
    </div>
  )
}

export default App
