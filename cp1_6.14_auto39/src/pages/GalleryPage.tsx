import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import ArtworkPanel from '../components/ArtworkPanel'
import ExhibitionCanvas from '../components/ExhibitionCanvas'
import PropertyPanel from '../components/PropertyPanel'
import { artworksAPI, exhibitionAPI } from '../services/api'
import type { UserData, PlacedArtwork, Artwork, WallType } from '../types'

interface GalleryPageProps {
  user: UserData | null
  onLogout: () => void
  isShareMode?: boolean
}

function GalleryPage({ user, onLogout, isShareMode = false }: GalleryPageProps) {
  const { id: shareId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [placedArtworks, setPlacedArtworks] = useState<PlacedArtwork[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragArtwork, setDragArtwork] = useState<Artwork | null>(null)
  const [cameraView, setCameraView] = useState('front')
  const [exhibitionName, setExhibitionName] = useState('我的展览')
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [fps, setFps] = useState(60)
  const [lowQuality, setLowQuality] = useState(false)
  const fpsRef = useRef({ frames: 0, lastTime: performance.now() })

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const data = await artworksAPI.getAll()
        setArtworks(data)
      } catch (err) {
        console.error('Failed to fetch artworks:', err)
      }
    }
    fetchArtworks()
  }, [])

  useEffect(() => {
    if (isShareMode && shareId) {
      const loadShare = async () => {
        try {
          const data = await exhibitionAPI.getShare(shareId)
          setPlacedArtworks(data.artworks)
          setExhibitionName(data.name)
        } catch (err) {
          console.error('Failed to load share:', err)
        }
      }
      loadShare()
    }
  }, [isShareMode, shareId])

  useEffect(() => {
    const checkFps = () => {
      const now = performance.now()
      fpsRef.current.frames++
      if (now - fpsRef.current.lastTime >= 1000) {
        const currentFps = fpsRef.current.frames
        setFps(currentFps)
        if (currentFps < 25 && !lowQuality) {
          setLowQuality(true)
        } else if (currentFps > 40 && lowQuality) {
          setLowQuality(false)
        }
        fpsRef.current.frames = 0
        fpsRef.current.lastTime = now
      }
      requestAnimationFrame(checkFps)
    }
    const id = requestAnimationFrame(checkFps)
    return () => cancelAnimationFrame(id)
  }, [lowQuality])

  const handleDragStart = (artwork: Artwork) => {
    setDragArtwork(artwork)
  }

  const handleDragEnd = () => {
    setDragArtwork(null)
  }

  const handlePlaceArtwork = useCallback(
    (artworkId: string, wall: WallType, posX: number, posY: number) => {
      const artwork = artworks.find((a) => a.id === artworkId)
      if (!artwork) return

      const newArtwork: PlacedArtwork = {
        id: uuidv4(),
        artworkId,
        wall,
        positionX: posX,
        positionY: posY,
        rotation: 0,
        scale: 1
      }
      setPlacedArtworks((prev) => [...prev, newArtwork])
      setSelectedId(newArtwork.id)
      setDragArtwork(null)
    },
    [artworks]
  )

  const handleUpdateArtwork = useCallback((id: string, updates: Partial<PlacedArtwork>) => {
    setPlacedArtworks((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    )
  }, [])

  const handleDeleteArtwork = useCallback((id: string) => {
    setPlacedArtworks((prev) => prev.filter((a) => a.id !== id))
    setSelectedId(null)
  }, [])

  const handleSelectArtwork = useCallback((id: string | null) => {
    setSelectedId(id)
  }, [])

  const selectedArtwork = placedArtworks.find((a) => a.id === selectedId) || null
  const selectedArtworkData = selectedArtwork
    ? artworks.find((a) => a.id === selectedArtwork.artworkId) || null
    : null

  const handleSaveExhibition = async () => {
    if (!user) return
    try {
      const existing = await exhibitionAPI.getByUser(user.userId)
      let exhibition
      if (existing.length > 0) {
        exhibition = await exhibitionAPI.update(existing[0].id, {
          name: exhibitionName,
          artworks: placedArtworks
        })
      } else {
        exhibition = await exhibitionAPI.create(
          user.userId,
          exhibitionName,
          placedArtworks
        )
      }
      const link = `${window.location.origin}/share/${exhibition.id}`
      setShareLink(link)
      setShowShareModal(true)
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
    alert('链接已复制到剪贴板')
  }

  const cameraViews = [
    { key: 'front', label: '正面全景' },
    { key: 'left', label: '左侧墙' },
    { key: 'right', label: '右侧墙' }
  ]

  return (
    <div style={styles.container}>
      <div style={styles.topBar} className="glass-panel">
        <div style={styles.topBarLeft}>
          <h1 style={styles.logo}>虚拟画廊</h1>
          {!isShareMode && user && (
            <span style={styles.userInfo}>欢迎, {user.username}</span>
          )}
          {isShareMode && (
            <span style={styles.userInfo}>访客模式 · {exhibitionName}</span>
          )}
        </div>
        <div style={styles.topBarCenter}>
          <div style={styles.viewButtons}>
            {cameraViews.map((view) => (
              <button
                key={view.key}
                style={{
                  ...styles.viewBtn,
                  ...(cameraView === view.key ? styles.viewBtnActive : {})
                }}
                onClick={() => setCameraView(view.key)}
              >
                {view.label}
              </button>
            ))}
            <button
              style={{
                ...styles.viewBtn,
                ...(cameraView === 'free' ? styles.viewBtnActive : {})
              }}
              onClick={() => setCameraView('free')}
            >
              自由视角
            </button>
          </div>
        </div>
        <div style={styles.topBarRight}>
          <div style={styles.fpsIndicator}>
            <span style={{
              ...styles.fpsDot,
              background: fps >= 30 ? '#2ecc71' : fps >= 25 ? '#f39c12' : '#e74c3c'
            }} />
            {fps} FPS
            {lowQuality && <span style={styles.qualityBadge}>低画质</span>}
          </div>
          {!isShareMode && (
            <>
              <button
                className="btn btn-primary btn-small"
                onClick={handleSaveExhibition}
                style={styles.saveBtn}
              >
                生成分享链接
              </button>
              <button className="btn btn-secondary btn-small" onClick={onLogout}>
                退出
              </button>
            </>
          )}
          {isShareMode && (
            <button
              className="btn btn-primary btn-small"
              onClick={() => navigate('/login')}
            >
              登录策展
            </button>
          )}
        </div>
      </div>

      <div style={styles.mainContent}>
        {!isShareMode && (
          <div style={styles.leftPanel}>
            <ArtworkPanel
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          </div>
        )}

        <div
          style={styles.canvasContainer}
          onDragOver={(e) => {
            e.preventDefault()
          }}
        >
          <ExhibitionCanvas
            placedArtworks={placedArtworks}
            artworks={artworks}
            selectedId={selectedId}
            onSelect={handleSelectArtwork}
            onPlaceArtwork={handlePlaceArtwork}
            onUpdateArtwork={handleUpdateArtwork}
            onDeleteArtwork={handleDeleteArtwork}
            dragArtwork={dragArtwork}
            onDragEnd={handleDragEnd}
            cameraView={cameraView}
            lowQuality={lowQuality}
          />
        </div>

        {selectedArtwork && !isShareMode && (
          <div style={styles.rightPanel}>
            <PropertyPanel
              selectedArtwork={selectedArtwork}
              artworkData={selectedArtworkData}
              onUpdate={handleUpdateArtwork}
              onDelete={handleDeleteArtwork}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </div>

      {showShareModal && (
        <div style={styles.modalOverlay} onClick={() => setShowShareModal(false)}>
          <div
            style={styles.modal}
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={styles.modalTitle}>分享你的展览</h3>
            <p style={styles.modalDesc}>
              将以下链接分享给朋友，他们就能在线浏览你的画廊：
            </p>
            <div style={styles.linkBox}>
              <input
                type="text"
                value={shareLink}
                readOnly
                style={styles.linkInput}
              />
              <button
                className="btn btn-primary btn-small"
                onClick={copyShareLink}
              >
                复制
              </button>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setShowShareModal(false)}
              style={styles.closeModalBtn}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {!isShareMode && (
        <div style={styles.hint}>
          <p>💡 从左侧艺术品库拖拽画作到墙面上 · 双击画作进入编辑模式 · 方向键微调位置</p>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#f0f0f0',
    position: 'relative'
  },
  topBar: {
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 100,
    position: 'relative',
    flexShrink: 0
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  logo: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    letterSpacing: '2px'
  },
  userInfo: {
    fontSize: '13px',
    color: '#888'
  },
  topBarCenter: {
    display: 'flex',
    alignItems: 'center'
  },
  viewButtons: {
    display: 'flex',
    gap: '4px',
    background: 'rgba(0,0,0,0.04)',
    padding: '4px',
    borderRadius: '8px'
  },
  viewBtn: {
    padding: '6px 14px',
    border: 'none',
    borderRadius: '6px',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#666',
    transition: 'all 0.2s ease'
  },
  viewBtnActive: {
    background: 'white',
    color: '#333',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  fpsIndicator: {
    fontSize: '12px',
    color: '#888',
    fontFamily: 'monospace',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginRight: '10px'
  },
  fpsDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block'
  },
  qualityBadge: {
    fontSize: '10px',
    background: '#f39c12',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '3px',
    marginLeft: '4px'
  },
  saveBtn: {
    marginRight: '8px'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    position: 'relative'
  },
  leftPanel: {
    width: '280px',
    flexShrink: 0,
    zIndex: 10
  },
  rightPanel: {
    width: '280px',
    flexShrink: 0,
    zIndex: 10
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    background: '#f0f0f0'
  },
  hint: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 50,
    pointerEvents: 'none'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    width: '440px',
    padding: '30px',
    borderRadius: '16px'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '10px'
  },
  modalDesc: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px'
  },
  linkBox: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  linkInput: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '8px',
    fontSize: '13px',
    background: 'rgba(255,255,255,0.8)',
    outline: 'none'
  },
  closeModalBtn: {
    width: '100%'
  }
}

export default GalleryPage
