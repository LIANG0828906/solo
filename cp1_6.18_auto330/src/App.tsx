import { useEffect, useState, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AlbumPage from './components/AlbumPage'
import { usePhotoStore } from './store/usePhotoStore'
import './styles/global.scss'

function CoverView() {
  const enterAlbum = usePhotoStore((state) => state.enterAlbum)
  const photos = usePhotoStore((state) => state.photos)

  return (
    <div className="cover-page" onClick={enterAlbum}>
      <div className="cover-inner">
        <h1>菲林翻页相册</h1>
        <p className="photographer">—— 自由摄影师作品集 ——</p>
        <div className="decoration-line" />
        <p className="enter-hint">点击开启 · 共 {photos.length} 张照片</p>
      </div>
    </div>
  )
}

function AlbumView() {
  const {
    photos,
    currentPageIndex,
    flipState,
    viewMode,
    nextPage,
    prevPage,
    jumpToPage,
    goToCover,
    toggleFullscreen,
    exitFullscreen,
    preloadNeighbors
  } = usePhotoStore()

  const [showFullscreenHint, setShowFullscreenHint] = useState(false)

  const handleFlipComplete = useCallback(() => {
    const state = usePhotoStore.getState()
    let newIndex = state.currentPageIndex

    if (state.flipState.direction === 'left') {
      newIndex = Math.min(state.currentPageIndex + 1, state.photos.length - 1)
    } else if (state.flipState.direction === 'right') {
      newIndex = Math.max(state.currentPageIndex - 1, 0)
    }

    usePhotoStore.setState({
      currentPageIndex: newIndex,
      flipState: { isFlipping: false, direction: null, progress: 0 }
    })
    preloadNeighbors(newIndex)
  }, [preloadNeighbors])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = usePhotoStore.getState()

      if (e.key === 'Escape' && state.viewMode.isFullscreen) {
        exitFullscreen()
        return
      }

      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen()
        setShowFullscreenHint(true)
        setTimeout(() => setShowFullscreenHint(false), 1500)
        return
      }

      if (state.isCover || state.flipState.isFlipping) return

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        nextPage()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevPage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextPage, prevPage, toggleFullscreen, exitFullscreen])

  const handleThumbnailClick = (index: number) => {
    jumpToPage(index)
  }

  const isFullscreen = viewMode.isFullscreen

  return (
    <div className="album-manager">
      <div className={`top-bar ${isFullscreen ? 'hidden' : ''}`}>
        <button className="back-btn" onClick={goToCover}>
          <span>←</span>
          <span>返回封面</span>
        </button>
        <div className="title">菲林翻页相册</div>
        <button className="fullscreen-btn" onClick={toggleFullscreen}>
          {isFullscreen ? '退出全屏' : '全屏模式'}
        </button>
      </div>

      <AlbumPage
        photos={photos}
        currentIndex={currentPageIndex}
        totalPages={photos.length}
        flipState={flipState}
        onFlipComplete={handleFlipComplete}
        onNext={nextPage}
        onPrev={prevPage}
        isFullscreen={isFullscreen}
      />

      <div className={`thumbnail-nav ${isFullscreen ? 'hidden' : ''}`}>
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={`thumbnail ${index === currentPageIndex ? 'active' : ''}`}
            onClick={() => handleThumbnailClick(index)}
            title={photo.title}
          >
            <img src={photo.imageUrl} alt={photo.title} loading="lazy" />
          </div>
        ))}
      </div>

      <div className={`fullscreen-hint ${showFullscreenHint ? 'visible' : ''}`}>
        {isFullscreen ? '已进入全屏 · ESC 退出' : '已退出全屏'}
      </div>
    </div>
  )
}

function AlbumManager() {
  const isCover = usePhotoStore((state) => state.isCover)
  return isCover ? <CoverView /> : <AlbumView />
}

export default function App() {
  return (
    <Router>
      <div className="app-root">
        <Routes>
          <Route path="/" element={<AlbumManager />} />
        </Routes>
      </div>
    </Router>
  )
}
