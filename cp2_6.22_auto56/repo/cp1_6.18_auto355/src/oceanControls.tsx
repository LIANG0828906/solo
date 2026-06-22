import { useCallback, useRef, useEffect, useState } from 'react'
import { useOceanStore } from './oceanStore'
import { getTotalParticles, getParticleById, RenderParticle } from './oceanData'

const SPEED_OPTIONS = [0.5, 1, 2, 4]
const PRESET_MONTHS = [1, 6, 12]

interface InfoPanelProps {
  selectedParticle: RenderParticle | null
}

function InfoPanel({ selectedParticle }: InfoPanelProps) {
  const currentTime = useOceanStore(state => state.currentTime)
  const isPlaying = useOceanStore(state => state.isPlaying)
  const totalParticles = getTotalParticles()
  const currentMonth = Math.floor(currentTime) + 1

  return (
    <div className="info-panel">
      <div className="info-title">洋流观测系统</div>
      <div className="info-row">
        <span className="info-label">当前月份：</span>
        <span className="info-value">{currentMonth} 月</span>
      </div>
      <div className="info-row">
        <span className="info-label">播放状态：</span>
        <span className={`info-value status-${isPlaying ? 'playing' : 'paused'}`}>
          {isPlaying ? '● 播放中' : '❚❚ 已暂停'}
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">粒子总数：</span>
        <span className="info-value">{totalParticles}</span>
      </div>
      {selectedParticle && (
        <div className="particle-info-card">
          <div className="particle-info-header">粒子详情</div>
          <div className="particle-info-row">
            <span>纬度：</span>
            <span>
              {Math.abs(selectedParticle.lat).toFixed(2)}° {selectedParticle.latDir}
            </span>
          </div>
          <div className="particle-info-row">
            <span>经度：</span>
            <span>
              {Math.abs(selectedParticle.lon).toFixed(2)}° {selectedParticle.lonDir}
            </span>
          </div>
          <div className="particle-info-row">
            <span>温度：</span>
            <span style={{ color: selectedParticle.color.getStyle() }}>
              {selectedParticle.temperature.toFixed(1)}°C
            </span>
          </div>
          <div className="particle-info-row">
            <span>流速：</span>
            <span>{selectedParticle.speed.toFixed(2)} 节</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OceanControls() {
  const currentTime = useOceanStore(state => state.currentTime)
  const isPlaying = useOceanStore(state => state.isPlaying)
  const playSpeed = useOceanStore(state => state.playSpeed)
  const selectedParticleId = useOceanStore(state => state.selectedParticleId)
  const setCurrentTime = useOceanStore(state => state.setCurrentTime)
  const setPlaying = useOceanStore(state => state.setPlaying)
  const setPlaySpeed = useOceanStore(state => state.setPlaySpeed)
  const jumpToMonth = useOceanStore(state => state.jumpToMonth)
  const selectParticle = useOceanStore(state => state.selectParticle)

  const [selectedParticle, setSelectedParticle] = useState<RenderParticle | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)
  const dragTimeoutRef = useRef<number | null>(null)

  const progress = (currentTime / 23) * 100
  const currentMonth = Math.floor(currentTime) + 1

  useEffect(() => {
    if (selectedParticleId) {
      const p = getParticleById(selectedParticleId, currentTime)
      setSelectedParticle(p)
    } else {
      setSelectedParticle(null)
    }
  }, [selectedParticleId, currentTime])

  useEffect(() => {
    if (selectedParticle) {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current)
      }
      dragTimeoutRef.current = window.setTimeout(() => {
        if (selectedParticleId) {
          const p = getParticleById(selectedParticleId, currentTime)
          setSelectedParticle(p)
        }
      }, 50)
    }
    return () => {
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current)
    }
  }, [selectedParticle?.id, currentTime, selectedParticleId])

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current) return
      const rect = progressRef.current.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const newTime = ratio * 23
      setCurrentTime(newTime)
      selectParticle(null)
    },
    [setCurrentTime, selectParticle]
  )

  const handleProgressMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsDragging(true)
      handleProgressClick(e)
    },
    [handleProgressClick]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressRef.current) return
      const rect = progressRef.current.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const newTime = ratio * 23
      setCurrentTime(newTime)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, setCurrentTime])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!progressRef.current) return
      const touch = e.touches[0]
      const rect = progressRef.current.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width))
      const newTime = ratio * 23
      setCurrentTime(newTime)
      setIsDragging(true)
    },
    [setCurrentTime]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleTouchMove = (e: TouchEvent) => {
      if (!progressRef.current) return
      const touch = e.touches[0]
      const rect = progressRef.current.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width))
      const newTime = ratio * 23
      setCurrentTime(newTime)
    }

    const handleTouchEnd = () => setIsDragging(false)

    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, setCurrentTime])

  const togglePlay = () => {
    if (currentTime >= 23 && !isPlaying) {
      setCurrentTime(0)
    }
    setPlaying(!isPlaying)
  }

  const handlePresetClick = (month: number) => {
    jumpToMonth(month)
  }

  return (
    <>
      <InfoPanel selectedParticle={selectedParticle} />

      <div className="timeline-container">
        <div className="preset-buttons">
          {PRESET_MONTHS.map(month => (
            <button
              key={month}
              className={`preset-btn ${currentMonth === month ? 'active' : ''}`}
              onClick={() => handlePresetClick(month)}
            >
              {month}月
            </button>
          ))}
        </div>

        <div className="timeline-main">
          <button
            className={`play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlay}
            aria-label={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="7,4 20,12 7,20" />
              </svg>
            )}
          </button>

          <div className="progress-wrapper">
            <div className="progress-labels">
              <span>1月</span>
              <span>{currentMonth}月</span>
              <span>24月</span>
            </div>
            <div
              ref={progressRef}
              className="progress-bar"
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
              onTouchStart={handleTouchStart}
            >
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
              <div
                className="progress-thumb"
                style={{ left: `${progress}%` }}
              />
            </div>
          </div>

          <div className="speed-selector">
            {SPEED_OPTIONS.map(speed => (
              <button
                key={speed}
                className={`speed-btn ${playSpeed === speed ? 'active' : ''}`}
                onClick={() => setPlaySpeed(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
