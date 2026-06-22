import React, { useState } from 'react'
import { useStore } from '../../store/useStore'
import { CONSTELLATION_TEMPLATES } from '../constellations/templates'
import { SceneManager } from '../scene/SceneManager'
import { DynamicMode } from '../particle/types'

interface UILayerProps {
  sceneManager: SceneManager | null
}

const glassStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.125)',
  borderRadius: '12px',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  color: '#fff',
}

const buttonBase: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '10px',
  color: '#fff',
  cursor: 'pointer',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  outline: 'none',
  fontFamily: 'inherit',
}

const UILayer: React.FC<UILayerProps> = ({ sceneManager }) => {
  const { dynamicMode, selectedParticle, activeConstellation, setSelectedParticle } = useStore()
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)

  const handleConstellationClick = (id: string) => {
    sceneManager?.loadConstellation(id)
  }

  const handleModeChange = (mode: DynamicMode) => {
    sceneManager?.setDynamicMode(mode)
  }

  const getButtonStyle = (id: string, isActive: boolean): React.CSSProperties => {
    const isHovered = hoveredBtn === id
    return {
      ...buttonBase,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      width: '100%',
      fontSize: '14px',
      fontWeight: isActive ? 600 : 400,
      background: isActive
        ? 'rgba(108, 99, 255, 0.25)'
        : isHovered
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(255, 255, 255, 0.06)',
      borderColor: isActive
        ? 'rgba(108, 99, 255, 0.6)'
        : isHovered
        ? 'rgba(108, 99, 255, 0.4)'
        : 'rgba(255, 255, 255, 0.15)',
      transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
      boxShadow: isHovered
        ? '0 8px 24px rgba(108, 99, 255, 0.25)'
        : 'none',
    }
  }

  const getModeButtonStyle = (mode: DynamicMode, isActive: boolean): React.CSSProperties => {
    const id = `mode-${mode}`
    const isHovered = hoveredBtn === id
    return {
      ...buttonBase,
      padding: '10px 18px',
      flex: 1,
      fontSize: '13px',
      fontWeight: isActive ? 600 : 400,
      background: isActive
        ? 'linear-gradient(135deg, rgba(108, 99, 255, 0.35), rgba(155, 89, 182, 0.35))'
        : isHovered
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(255, 255, 255, 0.06)',
      borderColor: isActive
        ? 'rgba(155, 89, 182, 0.6)'
        : isHovered
        ? 'rgba(108, 99, 255, 0.4)'
        : 'rgba(255, 255, 255, 0.15)',
      transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
      boxShadow: isHovered
        ? '0 6px 16px rgba(108, 99, 255, 0.2)'
        : 'none',
    }
  }

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          width: '240px',
          padding: '20px',
          ...glassStyle,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1.5px',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '14px',
            textTransform: 'uppercase',
          }}
        >
          星座模板
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {CONSTELLATION_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleConstellationClick(t.id)}
              onMouseEnter={() => setHoveredBtn(t.id)}
              onMouseLeave={() => setHoveredBtn(null)}
              style={getButtonStyle(t.id, activeConstellation === t.id)}
            >
              <span style={{ fontSize: '20px' }}>{t.icon}</span>
              <span>{t.name}</span>
              {activeConstellation === t.id && (
                <span
                  style={{
                    marginLeft: 'auto',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#6C63FF',
                    boxShadow: '0 0 8px #6C63FF',
                  }}
                />
              )}
            </button>
          ))}
        </div>

        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1.5px',
            color: 'rgba(255,255,255,0.5)',
            marginTop: '24px',
            marginBottom: '14px',
            textTransform: 'uppercase',
          }}
        >
          动态模式
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleModeChange('free')}
            onMouseEnter={() => setHoveredBtn('mode-free')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={getModeButtonStyle('free', dynamicMode === 'free')}
          >
            自由演化
          </button>
          <button
            onClick={() => handleModeChange('gravity')}
            onMouseEnter={() => setHoveredBtn('mode-gravity')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={getModeButtonStyle('gravity', dynamicMode === 'gravity')}
          >
            牵引模式
          </button>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          width: '240px',
          padding: '20px',
          ...glassStyle,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1.5px',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '14px',
            textTransform: 'uppercase',
          }}
        >
          粒子信息
        </div>

        {selectedParticle ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                paddingBottom: '12px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#FFD700',
                  boxShadow: '0 0 12px #FFD700',
                }}
              />
              <span style={{ fontSize: '15px', fontWeight: 500 }}>
                粒子 #{selectedParticle.id}
              </span>
            </div>

            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '6px',
                }}
              >
                空间坐标
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                }}
              >
                {(['x', 'y', 'z'] as const).map((axis) => (
                  <div
                    key={axis}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      padding: '8px 6px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.4)',
                        marginBottom: '2px',
                      }}
                    >
                      {axis.toUpperCase()}
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        color: '#6C63FF',
                      }}
                    >
                      {selectedParticle.position[axis].toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '6px',
                }}
              >
                动能值
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: '#9B59B6',
                  }}
                >
                  {selectedParticle.kineticEnergy.toFixed(2)}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  J
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (sceneManager) {
                  sceneManager.getEngine().selectParticle(null)
                  setSelectedParticle(null)
                }
              }}
              onMouseEnter={() => setHoveredBtn('deselect')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                ...buttonBase,
                padding: '8px 12px',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.7)',
                marginTop: '4px',
                background: hoveredBtn === 'deselect'
                  ? 'rgba(255, 100, 100, 0.15)'
                  : 'rgba(255,255,255,0.04)',
                borderColor: hoveredBtn === 'deselect'
                  ? 'rgba(255, 100, 100, 0.4)'
                  : 'rgba(255,255,255,0.1)',
              }}
            >
              取消选中
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: '30px 0',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.35)',
              fontSize: '13px',
              lineHeight: 1.6,
            }}
          >
            <div
              style={{
                fontSize: '28px',
                marginBottom: '10px',
                opacity: 0.5,
              }}
            >
              ✨
            </div>
            点击粒子以查看其坐标与动能信息
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          ...glassStyle,
          zIndex: 10,
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        <span>🖱️ 拖拽旋转视角</span>
        <span style={{ opacity: 0.3 }}>|</span>
        <span>🔍 滚轮缩放</span>
        <span style={{ opacity: 0.3 }}>|</span>
        <span>✨ 点击选中 / 拖拽粒子</span>
      </div>
    </>
  )
}

export default UILayer
