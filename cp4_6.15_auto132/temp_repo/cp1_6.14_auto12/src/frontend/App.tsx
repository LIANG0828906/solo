import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import MapView from './components/MapView'
import SoundRecorder from './components/SoundRecorder'
import SoundDetail from './components/SoundDetail'
import type { Sound, SoundCategory } from '../shared/types'

function formatCategory(category: SoundCategory): string {
  const map: Record<SoundCategory, string> = {
    traffic: '交通',
    nature: '自然',
    crowd: '人群',
    machinery: '机械',
    other: '其他',
  }
  return map[category] || category
}

function App() {
  const [sounds, setSounds] = useState<Sound[]>([])
  const [filteredSounds, setFilteredSounds] = useState<Sound[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [confirmPosition, setConfirmPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [isRecorderOpen, setIsRecorderOpen] = useState(false)
  const [recorderPosition, setRecorderPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSounds = useCallback(async () => {
    try {
      const response = await axios.get<Sound[]>('/api/sounds')
      setSounds(response.data)
    } catch (error) {
      console.error('Failed to fetch sounds:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSounds()
  }, [fetchSounds])

  useEffect(() => {
    let result = sounds

    if (selectedCategory !== 'all') {
      result = result.filter((s) => s.category === selectedCategory)
    }

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase()
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(keyword) ||
          s.description.toLowerCase().includes(keyword) ||
          s.uploader.toLowerCase().includes(keyword) ||
          s.tags.some((t) => t.toLowerCase().includes(keyword)),
      )
    }

    setFilteredSounds(result)
  }, [sounds, selectedCategory, searchKeyword])

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setConfirmPosition({ lat, lng })
  }, [])

  const handleConfirmRecord = useCallback(() => {
    if (confirmPosition) {
      setRecorderPosition(confirmPosition)
      setIsRecorderOpen(true)
      setConfirmPosition(null)
    }
  }, [confirmPosition])

  const handleCancelRecord = useCallback(() => {
    setConfirmPosition(null)
  }, [])

  const handleMarkerClick = useCallback((sound: Sound) => {
    setSelectedSound(sound)
  }, [])

  const handleCloseRecorder = useCallback(() => {
    setIsRecorderOpen(false)
    setRecorderPosition(null)
  }, [])

  const handleRecordingUploaded = useCallback(() => {
    setIsRecorderOpen(false)
    setRecorderPosition(null)
    fetchSounds()
  }, [fetchSounds])

  const handleCloseDetail = useCallback(() => {
    setSelectedSound(null)
  }, [])

  const handleLike = useCallback(
    (id: string) => {
      setSounds((prev) =>
        prev.map((s) => (s.id === id ? { ...s, likes: s.likes + 1 } : s)),
      )
      if (selectedSound && selectedSound.id === id) {
        setSelectedSound((prev) => (prev ? { ...prev, likes: prev.likes + 1 } : null))
      }
    },
    [selectedSound],
  )

  const handleReport = useCallback(
    (id: string) => {
      setSounds((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, reports: s.reports + 1, isReported: true } : s,
        ),
      )
      if (selectedSound && selectedSound.id === id) {
        setSelectedSound((prev) =>
          prev ? { ...prev, reports: prev.reports + 1, isReported: true } : null,
        )
      }
    },
    [selectedSound],
  )

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🎧 城市声音地图</h1>
        <div className="filter-bar">
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">全部类型</option>
            <option value="traffic">🚗 交通</option>
            <option value="nature">🌿 自然</option>
            <option value="crowd">👥 人群</option>
            <option value="machinery">⚙️ 机械</option>
            <option value="other">🔊 其他</option>
          </select>
          <input
            type="text"
            className="search-input"
            placeholder="搜索地点或标签..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
      </header>

      <MapView
        sounds={filteredSounds}
        onMapClick={handleMapClick}
        onMarkerClick={handleMarkerClick}
        isLoading={isLoading}
      />

      {confirmPosition && (
        <div className="confirm-modal-overlay" onClick={handleCancelRecord}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">🎤</div>
            <h3 className="confirm-title">在此位置录制声音？</h3>
            <p className="confirm-location">
              📍 {confirmPosition.lat.toFixed(4)}, {confirmPosition.lng.toFixed(4)}
            </p>
            <p className="confirm-hint">
              录音时长需在 5~60 秒之间，完成后将自动在地图上生成标记
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn cancel" onClick={handleCancelRecord}>
                取消
              </button>
              <button className="confirm-btn start" onClick={handleConfirmRecord}>
                开始录音
              </button>
            </div>
          </div>
        </div>
      )}

      {isRecorderOpen && recorderPosition && (
        <SoundRecorder
          position={recorderPosition}
          onClose={handleCloseRecorder}
          onUploaded={handleRecordingUploaded}
        />
      )}

      {selectedSound && (
        <SoundDetail
          sound={selectedSound}
          onClose={handleCloseDetail}
          onLike={handleLike}
          onReport={handleReport}
        />
      )}

      <div className={`mobile-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div
          className="drawer-handle"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        />
        <div className="drawer-content">
          <h3 className="drawer-title">
            声音列表 ({filteredSounds.length})
          </h3>
          {filteredSounds.map((sound) => (
            <div
              key={sound.id}
              className="sound-list-item"
              onClick={() => {
                setSelectedSound(sound)
                setIsDrawerOpen(false)
              }}
            >
              <div className="sound-list-item-title">{sound.title}</div>
              <div className="sound-list-item-meta">
                <span className={`category-dot category-dot-${sound.category}`} />
                <span>{formatCategory(sound.category)}</span>
                <span>{sound.duration}秒</span>
                <span>❤️ {sound.likes}</span>
              </div>
            </div>
          ))}
          {filteredSounds.length === 0 && (
            <div className="drawer-empty">暂无符合条件的声音</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
