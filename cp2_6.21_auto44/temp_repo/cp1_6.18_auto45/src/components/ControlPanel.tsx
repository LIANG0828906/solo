import React, { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { UI_CONFIG, COLORS, PARTICLE_CONFIG, BREAKPOINTS } from '@/config/constants'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  unit?: string
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, onChange, unit = '' }) => {
  const [isHovering, setIsHovering] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  const percentage = ((value - min) / (max - min)) * 100

  const handleSliderClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    let clientX: number

    if ('touches' in e) {
      clientX = e.touches[0].clientX
    } else {
      clientX = e.clientX
    }

    const x = clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    const newValue = min + percent * (max - min)
    const stepped = Math.round(newValue / step) * step
    const clamped = Math.max(min, Math.min(max, stepped))
    onChange(clamped)
  }

  const handleDrag = useRef<{ isDragging: boolean }>({ isDragging: false })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!handleDrag.current.isDragging || !sliderRef.current) return
      const rect = sliderRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percent = Math.max(0, Math.min(1, x / rect.width))
      const newValue = min + percent * (max - min)
      const stepped = Math.round(newValue / step) * step
      const clamped = Math.max(min, Math.min(max, stepped))
      onChange(clamped)
    }

    const handleMouseUp = () => {
      handleDrag.current.isDragging = false
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchmove', (e) => {
      if (!handleDrag.current.isDragging || !sliderRef.current) return
      const rect = sliderRef.current.getBoundingClientRect()
      const x = e.touches[0].clientX - rect.left
      const percent = Math.max(0, Math.min(1, x / rect.width))
      const newValue = min + percent * (max - min)
      const stepped = Math.round(newValue / step) * step
      const clamped = Math.max(min, Math.min(max, stepped))
      onChange(clamped)
    })
    document.addEventListener('touchend', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [min, max, step, onChange])

  const thumbSize = isHovering ? UI_CONFIG.SLIDER_THUMB_HOVER_SIZE : UI_CONFIG.SLIDER_THUMB_SIZE

  return (
    <div style={{ marginBottom: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <span style={{ color: COLORS.TEXT, fontSize: '13px' }}>{label}</span>
        <span style={{ color: COLORS.SLIDER_THUMB, fontSize: '13px', fontWeight: 500 }}>
          {value}{unit}
        </span>
      </div>
      <div
        ref={sliderRef}
        onClick={handleSliderClick}
        onMouseDown={() => {
          handleDrag.current.isDragging = true
        }}
        onTouchStart={(e) => {
          handleDrag.current.isDragging = true
          handleSliderClick(e)
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          position: 'relative',
          width: '100%',
          height: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          minHeight: '44px',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '4px',
            background: COLORS.SLIDER_TRACK,
            borderRadius: '2px',
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${COLORS.PROGRESS_START}, ${COLORS.SLIDER_THUMB})`,
              borderRadius: '2px',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            left: `calc(${percentage}% - ${thumbSize / 2}px)`,
            width: `${thumbSize}px`,
            height: `${thumbSize}px`,
            borderRadius: '50%',
            background: COLORS.SLIDER_THUMB,
            boxShadow: isHovering
              ? `0 0 12px ${COLORS.SLIDER_THUMB}80`
              : '0 2px 6px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease',
          }}
        />
      </div>
    </div>
  )
}

export const ControlPanel: React.FC = () => {
  const {
    hueShift,
    particleCount,
    showExportMenu,
    isExportingVideo,
    exportProgress,
    controlPanelOpen,
    audioBuffer,
    setHueShift,
    setParticleCount,
    setShowExportMenu,
    setIsExportingVideo,
    setExportProgress,
    setControlPanelOpen,
  } = useAppStore()

  const [isMobile, setIsMobile] = useState(false)
  const [isMedium, setIsMedium] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth
      setIsMobile(width < BREAKPOINTS.MEDIUM)
      setIsMedium(width >= BREAKPOINTS.MEDIUM && width < BREAKPOINTS.LARGE)
      if (width >= BREAKPOINTS.LARGE) {
        setControlPanelOpen(true)
      }
    }

    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [setControlPanelOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setShowExportMenu])

  const handleExportScreenshot = () => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `voiceprint-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setShowExportMenu(false)
  }

  const handleExportVideo = async () => {
    const canvas = document.querySelector('canvas')
    if (!canvas) {
      setShowExportMenu(false)
      return
    }

    setIsExportingVideo(true)
    setExportProgress(0)
    setShowExportMenu(false)

    try {
      const stream = canvas.captureStream(30)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      })

      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      const duration = 3000
      const startTime = Date.now()
      mediaRecorder.start()

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(100, (elapsed / duration) * 100)
        setExportProgress(progress)
      }, 50)

      setTimeout(() => {
        mediaRecorder.stop()
        clearInterval(progressInterval)
        setExportProgress(100)

        setTimeout(() => {
          const blob = new Blob(chunks, { type: 'video/webm' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = `voiceprint-${Date.now()}.webm`
          link.href = url
          link.click()
          URL.revokeObjectURL(url)
          setIsExportingVideo(false)
          setExportProgress(0)
        }, 300)
      }, duration)
    } catch (err) {
      console.error('视频导出失败:', err)
      setIsExportingVideo(false)
      setExportProgress(0)
      alert('视频导出失败，您的浏览器可能不支持此功能')
    }
  }

  if (isMobile || isMedium) {
    return (
      <>
        <button
          onClick={() => setControlPanelOpen(!controlPanelOpen)}
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: COLORS.CONTROL_BG,
            border: `1px solid ${COLORS.BORDER}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                width: '20px',
                height: '2px',
                background: COLORS.TEXT,
                borderRadius: '1px',
              }}
            />
            <div
              style={{
                width: '20px',
                height: '2px',
                background: COLORS.TEXT,
                borderRadius: '1px',
              }}
            />
            <div
              style={{
                width: '20px',
                height: '2px',
                background: COLORS.TEXT,
                borderRadius: '1px',
              }}
            />
          </div>
        </button>

        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '280px',
            height: '100vh',
            background: COLORS.CONTROL_BG,
            borderLeft: `1px solid ${COLORS.BORDER}`,
            zIndex: 150,
            transform: controlPanelOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease-out',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
            padding: '24px 20px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: COLORS.TEXT,
              marginBottom: '24px',
            }}
          >
            控制面板
          </div>

          <Slider
            label="色相偏移"
            value={hueShift}
            min={UI_CONFIG.HUE_MIN}
            max={UI_CONFIG.HUE_MAX}
            step={UI_CONFIG.HUE_STEP}
            onChange={setHueShift}
            unit="°"
          />

          <Slider
            label="粒子密度"
            value={particleCount}
            min={PARTICLE_CONFIG.MIN_COUNT}
            max={PARTICLE_CONFIG.MAX_COUNT}
            step={PARTICLE_CONFIG.MIN_COUNT}
            onChange={setParticleCount}
            unit=" 个"
          />

          <div ref={menuRef} style={{ position: 'relative', marginTop: '16px' }}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={!audioBuffer}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: audioBuffer
                  ? `linear-gradient(135deg, ${COLORS.PROGRESS_START}, ${COLORS.PROGRESS_END})`
                  : COLORS.SLIDER_TRACK,
                color: audioBuffer ? 'white' : '#666',
                fontSize: '14px',
                fontWeight: 500,
                cursor: audioBuffer ? 'pointer' : 'not-allowed',
                minHeight: '44px',
                transition: 'transform 0.2s ease',
              }}
              onMouseDown={(e) => {
                if (audioBuffer) e.currentTarget.style.transform = 'scale(0.98)'
              }}
              onMouseUp={(e) => {
                if (audioBuffer) e.currentTarget.style.transform = 'scale(1)'
              }}
              onMouseLeave={(e) => {
                if (audioBuffer) e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {isExportingVideo ? '导出中...' : '导出'}
            </button>

            {isExportingVideo && (
              <div style={{ marginTop: '12px' }}>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    background: COLORS.SLIDER_TRACK,
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${exportProgress}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${COLORS.PROGRESS_START}, ${COLORS.PROGRESS_END})`,
                      transition: 'width 0.1s linear',
                    }}
                  />
                </div>
                <div
                  style={{
                    textAlign: 'center',
                    color: '#888',
                    fontSize: '12px',
                    marginTop: '6px',
                  }}
                >
                  {Math.round(exportProgress)}%
                </div>
              </div>
            )}

            {showExportMenu && !isExportingVideo && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: COLORS.PANEL_BG,
                  border: `1px solid ${COLORS.BORDER}`,
                  borderRadius: '12px',
                  padding: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  zIndex: 10,
                  minWidth: '140px',
                }}
              >
                <button
                  onClick={handleExportScreenshot}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    color: COLORS.TEXT,
                    fontSize: '13px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ marginRight: '10px' }}
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  截图 PNG
                </button>
                <button
                  onClick={handleExportVideo}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    color: COLORS.TEXT,
                    fontSize: '13px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ marginRight: '10px' }}
                  >
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  视频 MP4
                </button>
              </div>
            )}
          </div>
        </div>

        {controlPanelOpen && (
          <div
            onClick={() => setControlPanelOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.5)',
              zIndex: 140,
            }}
          />
        )}
      </>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        width: `${UI_CONFIG.CONTROL_PANEL_WIDTH}px`,
        background: COLORS.CONTROL_BG,
        borderRadius: `${UI_CONFIG.CONTROL_BORDER_RADIUS}px`,
        border: `${UI_CONFIG.BORDER_WIDTH}px solid ${COLORS.BORDER}`,
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        zIndex: 100,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: COLORS.TEXT,
          marginBottom: '20px',
        }}
      >
        控制面板
      </div>

      <Slider
        label="色相偏移"
        value={hueShift}
        min={UI_CONFIG.HUE_MIN}
        max={UI_CONFIG.HUE_MAX}
        step={UI_CONFIG.HUE_STEP}
        onChange={setHueShift}
        unit="°"
      />

      <Slider
        label="粒子密度"
        value={particleCount}
        min={PARTICLE_CONFIG.MIN_COUNT}
        max={PARTICLE_CONFIG.MAX_COUNT}
        step={UI_CONFIG.DENSITY_STEP}
        onChange={setParticleCount}
        unit=" 个"
      />

      <div ref={menuRef} style={{ position: 'relative', marginTop: '8px' }}>
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          disabled={!audioBuffer}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            background: audioBuffer
              ? `linear-gradient(135deg, ${COLORS.PROGRESS_START}, ${COLORS.PROGRESS_END})`
              : COLORS.SLIDER_TRACK,
            color: audioBuffer ? 'white' : '#666',
            fontSize: '13px',
            fontWeight: 500,
            cursor: audioBuffer ? 'pointer' : 'not-allowed',
            minHeight: '44px',
            transition: 'transform 0.2s ease',
          }}
          onMouseDown={(e) => {
            if (audioBuffer) e.currentTarget.style.transform = 'scale(0.98)'
          }}
          onMouseUp={(e) => {
            if (audioBuffer) e.currentTarget.style.transform = 'scale(1)'
          }}
          onMouseLeave={(e) => {
            if (audioBuffer) e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {isExportingVideo ? `导出中 ${Math.round(exportProgress)}%` : '导出'}
        </button>

        {isExportingVideo && (
          <div style={{ marginTop: '10px' }}>
            <div
              style={{
                width: '100%',
                height: '6px',
                background: COLORS.SLIDER_TRACK,
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${exportProgress}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${COLORS.PROGRESS_START}, ${COLORS.PROGRESS_END})`,
                  transition: 'width 0.1s linear',
                }}
              />
            </div>
          </div>
        )}

        {showExportMenu && !isExportingVideo && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: '8px',
              background: COLORS.PANEL_BG,
              border: `1px solid ${COLORS.BORDER}`,
              borderRadius: '12px',
              padding: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              zIndex: 10,
              minWidth: '140px',
            }}
          >
            <button
              onClick={handleExportScreenshot}
              style={{
                width: '100%',
                padding: '10px 14px',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                color: COLORS.TEXT,
                fontSize: '13px',
                cursor: 'pointer',
                borderRadius: '8px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ marginRight: '10px' }}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              截图 PNG
            </button>
            <button
              onClick={handleExportVideo}
              style={{
                width: '100%',
                padding: '10px 14px',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                color: COLORS.TEXT,
                fontSize: '13px',
                cursor: 'pointer',
                borderRadius: '8px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ marginRight: '10px' }}
              >
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              视频 MP4
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
