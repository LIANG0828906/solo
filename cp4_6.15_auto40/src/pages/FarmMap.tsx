import React, { useState } from 'react'
import { PlotCell } from '@/components/PlotCell'
import { PlotCell as PlotCellType, PlotStatus, AnimationState } from '@/types'

interface FarmMapProps {
  plots: PlotCellType[]
  selectedPlotId: string | null
  onPlotClick: (plotId: string) => void
  onClaim: (plotId: string, nickname: string, plantGoal: string) => void
  gridConfig: { rows: number; cols: number; cellSize: number; gap: number }
  animationState: AnimationState
}

export const FarmMap: React.FC<FarmMapProps> = ({
  plots,
  selectedPlotId,
  onPlotClick,
  onClaim,
  gridConfig,
  animationState
}) => {
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claimingPlotId, setClaimingPlotId] = useState<string | null>(null)
  const [nickname, setNickname] = useState('')
  const [plantGoal, setPlantGoal] = useState('')

  const { rows, cols, cellSize, gap } = gridConfig
  const svgWidth = cols * (cellSize + gap)
  const svgHeight = rows * (cellSize + gap)

  const handlePlotClick = (plot: PlotCellType) => {
    if (plot.status === PlotStatus.AVAILABLE) {
      setClaimingPlotId(plot.id)
      setShowClaimModal(true)
    } else {
      onPlotClick(plot.id)
    }
  }

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (claimingPlotId && nickname.trim() && plantGoal.trim()) {
      onClaim(claimingPlotId, nickname.trim(), plantGoal.trim())
      setShowClaimModal(false)
      setClaimingPlotId(null)
      setNickname('')
      setPlantGoal('')
      onPlotClick(claimingPlotId)
    }
  }

  const handleCloseModal = () => {
    setShowClaimModal(false)
    setClaimingPlotId(null)
    setNickname('')
    setPlantGoal('')
  }

  return (
    <div className="farm-map-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h2 style={{ color: '#5D4037', marginBottom: '16px', fontFamily: 'Quicksand, sans-serif', fontWeight: 600 }}>
        🌿 社区共享菜园平面图
      </h2>
      
      <div className="legend" style={{ display: 'flex', gap: '24px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: '#C8E6C9', border: '1px solid #A5D6A7' }}></div>
          <span style={{ color: '#5D4037', fontSize: '14px', fontFamily: 'Quicksand, sans-serif' }}>空闲</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: '#FFCCBC', border: '1px solid #FFAB91' }}></div>
          <span style={{ color: '#5D4037', fontSize: '14px', fontFamily: 'Quicksand, sans-serif' }}>已认领</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: '#2E7D32', border: '1px solid #1B5E20' }}></div>
          <span style={{ color: '#5D4037', fontSize: '14px', fontFamily: 'Quicksand, sans-serif' }}>收获中</span>
        </div>
      </div>

      <div style={{ 
        background: '#FAF3E0', 
        padding: '20px', 
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(139, 69, 19, 0.15)',
        overflow: 'auto',
        maxWidth: '100%'
      }}>
        <svg
          width={svgWidth}
          height={svgHeight}
          style={{ display: 'block' }}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="soilPattern" patternUnits="userSpaceOnUse" width="8" height="8">
              <rect width="8" height="8" fill="#D7CCC8" />
              <circle cx="2" cy="2" r="0.5" fill="#BCAAA4" />
              <circle cx="6" cy="5" r="0.5" fill="#BCAAA4" />
            </pattern>
          </defs>
          
          <rect width={svgWidth} height={svgHeight} fill="url(#soilPattern)" rx="12" />
          
          {plots.map(plot => (
            <PlotCell
              key={plot.id}
              plot={plot}
              cellSize={cellSize}
              gap={gap}
              isSelected={selectedPlotId === plot.id}
              onClick={() => handlePlotClick(plot)}
              showAnimation={animationState.show && animationState.plotId === plot.id}
              animationType={animationState.type}
            />
          ))}
        </svg>
      </div>

      <p style={{ color: '#8D6E63', fontSize: '13px', marginTop: '16px', textAlign: 'center', fontFamily: 'Quicksand, sans-serif' }}>
        点击空闲地块即可认领，点击已认领地块查看详情
      </p>

      {showClaimModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease'
          }}
          onClick={handleCloseModal}
        >
          <div
            className="modal-content"
            style={{
              background: '#FFFEF7',
              padding: '32px',
              borderRadius: '20px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              animation: 'scaleIn 0.3s ease'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ color: '#5D4037', marginBottom: '24px', textAlign: 'center', fontFamily: 'Quicksand, sans-serif', fontWeight: 600 }}>
              🌱 认领地块
            </h3>
            
            <form onSubmit={handleClaimSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#6D4C41', marginBottom: '8px', fontSize: '14px', fontFamily: 'Quicksand, sans-serif' }}>
                  您的昵称
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="请输入昵称"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #D7CCC8',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontFamily: 'Quicksand, sans-serif',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#8BC34A'
                    e.target.style.boxShadow = '0 0 0 3px rgba(139, 195, 74, 0.2)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#D7CCC8'
                    e.target.style.boxShadow = 'none'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: '#6D4C41', marginBottom: '8px', fontSize: '14px', fontFamily: 'Quicksand, sans-serif' }}>
                  种植目标
                </label>
                <input
                  type="text"
                  value={plantGoal}
                  onChange={e => setPlantGoal(e.target.value)}
                  placeholder="例如：种西红柿、种黄瓜..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #D7CCC8',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontFamily: 'Quicksand, sans-serif',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#8BC34A'
                    e.target.style.boxShadow = '0 0 0 3px rgba(139, 195, 74, 0.2)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#D7CCC8'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontFamily: 'Quicksand, sans-serif',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: '#EFEBE9',
                    color: '#5D4037',
                    transition: 'background 0.2s ease, transform 0.1s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#D7CCC8'}
                  onMouseLeave={e => e.currentTarget.style.background = '#EFEBE9'}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!nickname.trim() || !plantGoal.trim()}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontFamily: 'Quicksand, sans-serif',
                    fontWeight: 600,
                    cursor: nickname.trim() && plantGoal.trim() ? 'pointer' : 'not-allowed',
                    background: nickname.trim() && plantGoal.trim() ? '#8BC34A' : '#C5E1A5',
                    color: 'white',
                    transition: 'background 0.2s ease, transform 0.1s ease'
                  }}
                  onMouseEnter={e => {
                    if (nickname.trim() && plantGoal.trim()) {
                      e.currentTarget.style.background = '#7CB342'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = nickname.trim() && plantGoal.trim() ? '#8BC34A' : '#C5E1A5'
                  }}
                  onMouseDown={e => {
                    if (nickname.trim() && plantGoal.trim()) {
                      e.currentTarget.style.transform = 'scale(0.98)'
                    }
                  }}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  确认认领
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
