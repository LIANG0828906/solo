import React from 'react'
import Slider from './Slider'
import { useBehaviorTreeStore } from '@/stores/behaviorTreeStore'
import { Play, Pause, SkipForward, RotateCcw, Shield } from 'lucide-react'

export default function ControlBar() {
  const { start, pause, step, reset, updateEnvironment, runState, environment } = useBehaviorTreeStore()

  const handleTogglePlay = () => {
    if (runState.isRunning) {
      pause()
    } else {
      start()
    }
  }

  const handlePlayerDistanceChange = (value: number) => {
    updateEnvironment({ playerDistance: value })
  }

  const handleHealthChange = (value: number) => {
    updateEnvironment({ health: value })
  }

  const handleCoverToggle = () => {
    updateEnvironment({ hasCover: !environment.hasCover })
  }

  return (
    <div data-controlbar-container style={containerStyle}>
      <div data-controlbar-inner style={innerContainerStyle}>
        <div data-controlbar-buttons style={buttonGroupStyle}>
          <button
            onClick={handleTogglePlay}
            style={{
              ...buttonStyle,
              ...(runState.isRunning ? pauseButtonStyle : playButtonStyle),
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {runState.isRunning ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            onClick={step}
            style={{ ...buttonStyle, ...stepButtonStyle }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <SkipForward size={20} />
            <span style={stepBadgeStyle}>1</span>
          </button>
          <button
            onClick={reset}
            style={{ ...buttonStyle, ...resetButtonStyle }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <RotateCcw size={20} />
          </button>
        </div>

        <div data-controlbar-divider style={dividerStyle} />

        <div data-controlbar-params style={paramsGroupStyle}>
          <div data-controlbar-slider style={sliderWrapperStyle}>
            <Slider
              label="玩家距离"
              min={1}
              max={100}
              value={environment.playerDistance}
              onChange={handlePlayerDistanceChange}
            />
          </div>
          <div data-controlbar-slider style={sliderWrapperStyle}>
            <Slider
              label="生命值"
              min={0}
              max={100}
              value={environment.health}
              onChange={handleHealthChange}
            />
          </div>
          <button
            onClick={handleCoverToggle}
            style={{
              ...coverButtonStyle,
              ...(environment.hasCover ? coverActiveStyle : {}),
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <Shield
              size={20}
              style={{
                color: environment.hasCover ? '#44ff44' : '#8892b0',
              }}
            />
            <span style={coverLabelStyle}>掩体</span>
          </button>
        </div>
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  height: '60px',
  backgroundColor: '#16213e',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  zIndex: 100,
}

const innerContainerStyle: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  gap: '24px',
}

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}

const buttonStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '44px',
  height: '44px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  color: '#fff',
  transition: 'all 0.1s ease',
}

const playButtonStyle: React.CSSProperties = {
  backgroundColor: '#22c55e',
}

const pauseButtonStyle: React.CSSProperties = {
  backgroundColor: '#f59e0b',
}

const stepButtonStyle: React.CSSProperties = {
  backgroundColor: '#3b82f6',
}

const resetButtonStyle: React.CSSProperties = {
  backgroundColor: '#6b7280',
}

const stepBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '2px',
  right: '2px',
  fontSize: '10px',
  fontWeight: 'bold',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  padding: '1px 4px',
  borderRadius: '4px',
}

const dividerStyle: React.CSSProperties = {
  width: '1px',
  height: '32px',
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  flexShrink: 0,
}

const paramsGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  flex: 1,
  maxWidth: '600px',
}

const sliderWrapperStyle: React.CSSProperties = {
  flex: 1,
  minWidth: '180px',
}

const coverButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'all 0.1s ease',
}

const coverActiveStyle: React.CSSProperties = {
  backgroundColor: 'rgba(68, 255, 68, 0.15)',
  boxShadow: '0 0 12px rgba(68, 255, 68, 0.3)',
}

const coverLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#8892b0',
}

const styleElement = document.createElement('style')
styleElement.textContent = `
  @media (min-width: 768px) and (max-width: 1280px) {
    [data-controlbar-container] {
      height: 80px !important;
    }
    [data-controlbar-inner] {
      padding: 0 32px !important;
      gap: 32px !important;
    }
    [data-controlbar-buttons] {
      gap: 16px !important;
    }
    [data-controlbar-buttons] button {
      width: 52px !important;
      height: 52px !important;
    }
    [data-controlbar-divider] {
      height: 40px !important;
    }
    [data-controlbar-params] {
      gap: 24px !important;
      max-width: 700px !important;
    }
    [data-controlbar-params] button {
      padding: 10px 20px !important;
    }
  }
  @media (max-width: 767px) {
    [data-controlbar-container] {
      height: auto !important;
      padding: 12px 0 !important;
    }
    [data-controlbar-inner] {
      flex-direction: column !important;
      height: auto !important;
      gap: 16px !important;
      padding: 0 16px !important;
    }
    [data-controlbar-buttons] {
      gap: 12px !important;
      width: 100% !important;
      justify-content: center !important;
    }
    [data-controlbar-divider] {
      width: 100% !important;
      height: 1px !important;
    }
    [data-controlbar-params] {
      flex-direction: column !important;
      width: 100% !important;
      gap: 12px !important;
      max-width: none !important;
    }
    [data-controlbar-slider] {
      width: 100% !important;
      min-width: auto !important;
    }
  }
`
document.head.appendChild(styleElement)
