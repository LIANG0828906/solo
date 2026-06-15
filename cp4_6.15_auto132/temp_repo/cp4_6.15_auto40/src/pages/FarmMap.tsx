import React, { useState, useMemo } from 'react'
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

  const svgDimensions = useMemo(() => {
    const width = cols * (cellSize + gap)
    const height = rows * (cellSize + gap)
    return { width, height }
  }, [rows, cols, cellSize, gap])

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
      setTimeout(() => {
        onPlotClick(claimingPlotId)
      }, 100)
    }
  }

  const handleCloseModal = () => {
    setShowClaimModal(false)
    setClaimingPlotId(null)
    setNickname('')
    setPlantGoal('')
  }

  const legendItems = [
    { color: '#C8E6C9', border: '#A5D6A7', label: '空闲' },
    { color: '#FFCCBC', border: '#FFAB91', label: '已认领' },
    { color: '#2E7D32', border: '#1B5E20', label: '收获中' }
  ]

  return (
    <div className="farm-map-container">
      <h2 className="farm-title">
        🌿 社区共享菜园平面图
      </h2>
      
      <div className="legend">
        {legendItems.map((item, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color" 
              style={{ background: item.color, borderColor: item.border }}
            ></div>
            <span className="legend-label">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="svg-wrapper">
        <svg
          className="farm-svg"
          viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="soilPattern" patternUnits="userSpaceOnUse" width="8" height="8">
              <rect width="8" height="8" fill="#D7CCC8" />
              <circle cx="2" cy="2" r="0.5" fill="#BCAAA4" />
              <circle cx="6" cy="5" r="0.5" fill="#BCAAA4" />
            </pattern>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
            </filter>
          </defs>
          
          <rect 
            width={svgDimensions.width} 
            height={svgDimensions.height} 
            fill="url(#soilPattern)" 
            rx="12" 
            filter="url(#softShadow)"
          />
          
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

      <p className="hint-text">
        点击空闲地块即可认领，点击已认领地块查看详情
      </p>

      {showClaimModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">🌱 认领地块</h3>
            
            <form onSubmit={handleClaimSubmit}>
              <div className="form-group">
                <label className="form-label">您的昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="请输入昵称"
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">种植目标</label>
                <input
                  type="text"
                  value={plantGoal}
                  onChange={e => setPlantGoal(e.target.value)}
                  placeholder="例如：种西红柿、种黄瓜..."
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!nickname.trim() || !plantGoal.trim()}
                  className="btn btn-primary"
                >
                  确认认领
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .farm-map-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          width: 100%;
          box-sizing: border-box;
          min-width: 0;
        }

        .farm-title {
          color: #5D4037;
          margin-bottom: 16px;
          font-family: 'Quicksand', sans-serif;
          font-weight: 600;
          font-size: clamp(1.25rem, 2.5vw, 1.5rem);
          text-align: center;
        }

        .legend {
          display: flex;
          gap: 24px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .legend-color {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 1px solid;
        }

        .legend-label {
          color: #5D4037;
          font-size: 14px;
          font-family: 'Quicksand', sans-serif;
        }

        .svg-wrapper {
          background: #FAF3E0;
          padding: clamp(12px, 3vw, 20px);
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(139, 69, 19, 0.15);
          width: 100%;
          max-width: min(100%, 600px);
          box-sizing: border-box;
          overflow: hidden;
        }

        .farm-svg {
          width: 100%;
          height: auto;
          display: block;
          max-height: 65vh;
        }

        .hint-text {
          color: #8D6E63;
          font-size: 13px;
          margin-top: 16px;
          text-align: center;
          font-family: 'Quicksand', sans-serif;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
          padding: 20px;
          box-sizing: border-box;
        }

        .modal-content {
          background: #FFFEF7;
          padding: clamp(20px, 5vw, 32px);
          border-radius: 20px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          animation: scaleIn 0.3s ease;
          box-sizing: border-box;
        }

        .modal-title {
          color: #5D4037;
          margin-bottom: 24px;
          text-align: center;
          font-family: 'Quicksand', sans-serif;
          font-weight: 600;
          font-size: clamp(1.1rem, 2vw, 1.25rem);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          color: #6D4C41;
          margin-bottom: 8px;
          font-size: 14px;
          font-family: 'Quicksand', sans-serif;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #D7CCC8;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Quicksand', sans-serif;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
          background: white;
        }

        .form-input:focus {
          border-color: #8BC34A;
          box-shadow: 0 0 0 3px rgba(139, 195, 74, 0.2);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn {
          flex: 1;
          min-width: 120px;
          padding: 12px 20px;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Quicksand', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.1s ease;
        }

        .btn:active {
          transform: scale(0.98);
        }

        .btn-secondary {
          background: #EFEBE9;
          color: #5D4037;
        }

        .btn-secondary:hover {
          background: #D7CCC8;
        }

        .btn-primary {
          background: #8BC34A;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #7CB342;
        }

        .btn-primary:disabled {
          background: #C5E1A5;
          cursor: not-allowed;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .farm-map-container {
            padding: 12px;
          }

          .legend {
            gap: 12px;
          }

          .svg-wrapper {
            padding: 12px;
          }

          .farm-svg {
            max-height: 50vh;
          }
        }

        @media (max-width: 480px) {
          .legend {
            gap: 8px;
          }

          .legend-label {
            font-size: 12px;
          }

          .legend-color {
            width: 16px;
            height: 16px;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
