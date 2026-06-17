import React, { useState, useCallback } from 'react'
import { useGameStore } from '../store/useGameStore'

const GamePanel: React.FC = () => {
  const {
    lightAngle,
    lightIntensity,
    currentLevelId,
    levels,
    setLightAngle,
    setLightIntensity,
    setCurrentLevel,
    resetLevel,
  } = useGameStore()

  const [angleDragging, setAngleDragging] = useState(false)
  const [intensityDragging, setIntensityDragging] = useState(false)
  const [resetAnimating, setResetAnimating] = useState(false)

  const handleResetClick = useCallback(() => {
    setResetAnimating(true)
    resetLevel()
    setTimeout(() => setResetAnimating(false), 300)
  }, [resetLevel])

  const angleBackground = `linear-gradient(to right, 
    ${Array.from({ length: 20 }, (_, i) => {
      const hue = (i * 18) % 360
      return `hsl(${hue}, 80%, 55%) ${i * 5}%, hsl(${(hue + 18) % 360}, 80%, 55%) ${(i + 1) * 5}%`
    }).join(', ')})`

  const currentLevel = levels.find((l) => l.id === currentLevelId)

  return (
    <div
      style={{
        width: 280,
        minWidth: 280,
        background: '#0B0C10',
        borderRadius: 12,
        padding: 20,
        color: '#D1D4D8',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        height: 'fit-content',
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: '#66FCF1',
            marginBottom: 4,
            letterSpacing: 0.5,
          }}
        >
          光路解谜
        </h1>
        <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
          调整光源，照亮所有目标点
        </p>
      </div>

      <div>
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(102, 252, 241, 0.08)',
            borderRadius: 8,
            border: '1px solid rgba(102, 252, 241, 0.2)',
          }}
        >
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>当前关卡</div>
          <div style={{ fontSize: 15, color: '#66FCF1', fontWeight: 500 }}>
            {currentLevel?.name ?? '未选择'}
          </div>
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 14,
            marginBottom: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#D1D4D8' }}>光源角度</span>
          <span
            style={{
              color: '#66FCF1',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 500,
            }}
          >
            {lightAngle.toFixed(0)}°
          </span>
        </div>
        <div style={{ position: 'relative', height: 40, cursor: 'pointer' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 40,
              background: angleBackground,
              borderRadius: 20,
              opacity: 0.6,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 0,
              right: 0,
              height: 4,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: `${(lightAngle / 360) * 100}%`,
              width: 16,
              height: 16,
              marginLeft: -8,
              background: '#45A29E',
              borderRadius: '50%',
              boxShadow: `0 0 12px rgba(69, 162, 158, 0.9), 0 0 4px rgba(102, 252, 241, 1)`,
              transform: angleDragging ? 'scale(0.9)' : 'scale(1)',
              transition: 'transform 150ms ease-out',
              cursor: 'grab',
            }}
            onMouseDown={() => setAngleDragging(true)}
          />
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={lightAngle}
            onChange={(e) => setLightAngle(Number(e.target.value))}
            onMouseUp={() => setAngleDragging(false)}
            onMouseLeave={() => setAngleDragging(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 40,
              opacity: 0,
              cursor: 'pointer',
              margin: 0,
            }}
          />
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 14,
            marginBottom: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#D1D4D8' }}>光源强度</span>
          <span
            style={{
              color: '#66FCF1',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 500,
            }}
          >
            {lightIntensity.toFixed(0)}%
          </span>
        </div>
        <div style={{ position: 'relative', height: 40, cursor: 'pointer' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${lightIntensity}%`,
              height: 40,
              background: `linear-gradient(to right, 
                hsla(${lightAngle}, 70%, 35%, 0.3), 
                hsla(${lightAngle}, 80%, 55%, 0.7))`,
              borderRadius: 20,
              transition: 'width 100ms linear',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 0,
              right: 0,
              height: 4,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: `${lightIntensity}%`,
              width: 16,
              height: 16,
              marginLeft: -8,
              background: '#45A29E',
              borderRadius: '50%',
              boxShadow: `0 0 12px rgba(69, 162, 158, 0.9), 0 0 4px rgba(102, 252, 241, 1)`,
              transform: intensityDragging ? 'scale(0.9)' : 'scale(1)',
              transition: 'transform 150ms ease-out',
              cursor: 'grab',
            }}
            onMouseDown={() => setIntensityDragging(true)}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={lightIntensity}
            onChange={(e) => setLightIntensity(Number(e.target.value))}
            onMouseUp={() => setIntensityDragging(false)}
            onMouseLeave={() => setIntensityDragging(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 40,
              opacity: 0,
              cursor: 'pointer',
              margin: 0,
            }}
          />
        </div>
      </div>

      <div>
        <label
          style={{
            fontSize: 14,
            color: '#D1D4D8',
            display: 'block',
            marginBottom: 12,
          }}
        >
          关卡选择
        </label>
        <select
          value={currentLevelId}
          onChange={(e) => setCurrentLevel(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#1F2833',
            color: '#D1D4D8',
            border: '1px solid #45A29E',
            borderRadius: 8,
            fontSize: 14,
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2345A29E' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
          }}
        >
          {levels.map((level) => (
            <option key={level.id} value={level.id}>
              {level.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleResetClick}
        style={{
          width: '100%',
          padding: '14px 20px',
          background: resetAnimating ? '#66FCF1' : '#45A29E',
          color: '#0B0C10',
          border: 'none',
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background-color 300ms ease-out, transform 100ms ease-out',
          letterSpacing: 0.5,
          boxShadow: resetAnimating
            ? '0 0 20px rgba(102, 252, 241, 0.5)'
            : '0 2px 8px rgba(69, 162, 158, 0.3)',
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        重置关卡
      </button>

      <div
        style={{
          marginTop: 'auto',
          paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>
          💡 提示：拖动左侧滑块调整光源角度与强度，
          <br />
          让光线通过镜面反射照亮所有金色目标点。
        </div>
      </div>
    </div>
  )
}

export default GamePanel
