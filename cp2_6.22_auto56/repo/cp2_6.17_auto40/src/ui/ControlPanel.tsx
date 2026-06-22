import { useState, useEffect } from 'react'
import { useFractalStore, MODE_NAMES } from '@/store/useFractalStore'

export default function ControlPanel() {
  const { params, render, setParams, reset } = useFractalStore()
  const [isMobile, setIsMobile] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams({ growthSpeed: parseFloat(e.target.value) })
  }

  const handleReset = () => {
    reset()
  }

  const mobileStyles: React.CSSProperties = isMobile
    ? isExpanded
      ? {
          position: 'fixed' as const,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(10, 14, 39, 0.9)',
          backdropFilter: 'blur(20px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'flex-end',
          animation: 'slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1)'
        }
      : {
          position: 'fixed' as const,
          bottom: '20px',
          right: '20px',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: '#00FFAA',
          cursor: 'pointer',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0, 255, 170, 0.4)'
        }
    : {}

  const panelStyles: React.CSSProperties = !isMobile
    ? {
        position: 'fixed' as const,
        top: '20px',
        left: '20px',
        width: '240px',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        zIndex: 10,
        color: '#E0E0E0',
        fontFamily: "'Exo 2', sans-serif"
      }
    : isExpanded
    ? {
        width: '100%',
        height: '60vh',
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px 16px 0 0',
        color: '#E0E0E0',
        fontFamily: "'Exo 2', sans-serif",
        overflowY: 'auto' as const
      }
    : {}

  const sliderTrackStyle: React.CSSProperties = {
    width: '100%',
    height: '4px',
    background: '#2C3E50',
    borderRadius: '2px',
    outline: 'none',
    WebkitAppearance: 'none',
    appearance: 'none',
    cursor: 'pointer'
  }

  const sliderThumbStyle = `
    .speed-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #00FFAA;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 255, 170, 0.5);
      transition: transform 0.2s ease;
    }
    .speed-slider::-webkit-slider-thumb:hover {
      transform: scale(1.2);
    }
    .speed-slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #00FFAA;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 8px rgba(0, 255, 170, 0.5);
    }
    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    @keyframes slideDown {
      from {
        transform: translateY(0);
        opacity: 1;
      }
      to {
        transform: translateY(100%);
        opacity: 0;
      }
    }
  `

  if (isMobile && !isExpanded) {
    return (
      <div
        style={mobileStyles}
        onClick={() => setIsExpanded(true)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A0E27">
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
        </svg>
      </div>
    )
  }

  return (
    <div style={mobileStyles}>
      {isMobile && isExpanded && (
        <div
          onClick={() => setIsExpanded(false)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#E0E0E0">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </div>
      )}

      <style>{sliderThumbStyle}</style>

      <div style={panelStyles}>
        <h2
          style={{
            fontSize: isMobile ? '24px' : '18px',
            fontWeight: 600,
            marginBottom: '16px',
            color: '#E0E0E0',
            letterSpacing: '0.5px'
          }}
        >
          {MODE_NAMES[render.mode]}
        </h2>

        <div
          style={{
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: '1fr'
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                marginBottom: '8px',
                color: '#A0A0A0'
              }}
            >
              生长速度: {params.growthSpeed.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={params.growthSpeed}
              onChange={handleSpeedChange}
              className="speed-slider"
              style={sliderTrackStyle}
            />
          </div>

          <div
            style={{
              fontSize: '12px',
              color: '#888',
              lineHeight: '1.5'
            }}
          >
            <div>当前深度: {render.currentDepth} / {params.maxDepth}</div>
            <div>分支数量: {render.branchesGenerated}</div>
          </div>

          <button
            onClick={handleReset}
            disabled={render.isTransitioning}
            style={{
              width: '100%',
              padding: '8px 16px',
              background: '#00FFAA',
              color: '#0A0E27',
              border: 'none',
              borderRadius: '8px',
              fontFamily: "'Exo 2', sans-serif",
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              opacity: render.isTransitioning ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!render.isTransitioning) {
                e.currentTarget.style.transform = 'scale(1.05)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            重新生成
          </button>

          <div
            style={{
              fontSize: '11px',
              color: '#666',
              textAlign: 'center',
              marginTop: '8px'
            }}
          >
            按 空格键 切换模式
          </div>
        </div>
      </div>
    </div>
  )
}
