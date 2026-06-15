import { useState, useEffect, useRef } from 'react'
import PlantCanvas from './PlantCanvas'
import { type PlantStage, type PlantParams, type PlantVariety, stageNames, classifyPlant } from './utils/plantGenetics'

interface VarietyCardProps {
  variety: PlantVariety
  index: number
}

function VarietyCard({ variety, index }: VarietyCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const prevIdRef = useRef(variety.id)

  useEffect(() => {
    if (prevIdRef.current !== variety.id) {
      setIsFlipping(true)
      setTimeout(() => {
        prevIdRef.current = variety.id
        drawPlant()
        setTimeout(() => setIsFlipping(false), 50)
      }, 200)
    } else {
      drawPlant()
    }
  }, [variety])

  const drawPlant = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, 100, 120)
    
    ctx.fillStyle = '#3D2817'
    ctx.beginPath()
    ctx.roundRect(10, 100, 80, 15, 5)
    ctx.fill()
    
    const stemHeight = 60
    ctx.beginPath()
    ctx.moveTo(50, 100)
    ctx.lineTo(50, 40)
    ctx.strokeStyle = '#90EE90'
    ctx.lineWidth = 2
    ctx.stroke()
    
    ctx.beginPath()
    ctx.ellipse(35, 65, 10, 15, -Math.PI / 4, 0, Math.PI * 2)
    ctx.fillStyle = '#228B22'
    ctx.fill()
    
    ctx.beginPath()
    ctx.ellipse(65, 65, 10, 15, Math.PI / 4, 0, Math.PI * 2)
    ctx.fillStyle = '#228B22'
    ctx.fill()
    
    const petalCount = 5
    ctx.save()
    ctx.translate(50, 35)
    
    for (let i = 0; i < petalCount; i++) {
      ctx.save()
      ctx.rotate((i * 360 / petalCount) * Math.PI / 180)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.bezierCurveTo(5, -3, 10, -6, 8, -12)
      ctx.bezierCurveTo(6, -6, 3, -3, 0, 0)
      ctx.fillStyle = variety.flowerColor
      ctx.fill()
      ctx.restore()
    }
    
    ctx.beginPath()
    ctx.arc(0, 0, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#FFD700'
    ctx.fill()
    ctx.restore()
  }

  return (
    <div
      className={`variety-card ${isFlipping ? 'flipping' : ''}`}
      style={{
        animationDelay: `${index * 50}ms`
      }}
    >
      <canvas
        ref={canvasRef}
        width={100}
        height={120}
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: '8px 8px 0 0'
        }}
      />
      <div className="card-info">
        <div className="card-name">{variety.name}</div>
        <div className="card-params">
          光{variety.params.light}水{variety.params.water}肥{variety.params.soil}
        </div>
      </div>
    </div>
  )
}

interface SliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  color: string
}

function Slider({ label, value, onChange, color }: SliderProps) {
  const saturation = value / 100
  
  return (
    <div className="slider-container">
      <div className="slider-label">
        <span>{label}</span>
        <span className="slider-value">{value}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider"
        style={{
          background: `linear-gradient(to right, ${color} ${value}%, #3a3a50 ${value}%)`,
          '--thumb-color': color
        } as React.CSSProperties}
      />
      <div className="slider-track" style={{ '--color': color, '--saturation': saturation }} />
    </div>
  )
}

interface ProgressRingProps {
  stage: PlantStage
  stageProgress: number
}

function ProgressRing({ stage, stageProgress }: ProgressRingProps) {
  const stages: PlantStage[] = ['seed', 'germination', 'cotyledon', 'trueLeaf', 'stem', 'flower']
  const currentIndex = stages.indexOf(stage)
  const totalProgress = (currentIndex + stageProgress) / (stages.length - 1)
  const circumference = 2 * Math.PI * 30
  const strokeDashoffset = circumference * (1 - totalProgress)
  
  const colors = ['#D2B48C', '#7CFC00', '#90EE90', '#228B22', '#8A2BE2', '#FF4500']
  const currentColor = colors[Math.min(currentIndex, colors.length - 1)]

  return (
    <div className="progress-ring-container">
      <svg width="70" height="70" className="progress-ring">
        <circle
          className="progress-ring-bg"
          cx="35"
          cy="35"
          r="30"
          fill="none"
          stroke="#333"
          strokeWidth="6"
        />
        <circle
          className="progress-ring-progress"
          cx="35"
          cy="35"
          r="30"
          fill="none"
          stroke={currentColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 35 35)"
        />
      </svg>
      <div className="progress-ring-center">
        <div className="stage-name">{stageNames[stage]}</div>
        <div className="stage-percent">{Math.round(stageProgress * 100)}%</div>
      </div>
    </div>
  )
}

export default function App() {
  const [params, setParams] = useState<PlantParams>({ light: 70, water: 60, soil: 50 })
  const [isPlanted, setIsPlanted] = useState(false)
  const [currentStage, setCurrentStage] = useState<PlantStage>('seed')
  const [stageProgress, setStageProgress] = useState(0)
  const [varieties, setVarieties] = useState<PlantVariety[]>([])
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlanted && currentStage !== 'flower') {
        setStageProgress(prev => Math.min(prev + 0.01, 1))
      }
    }, 50)
    return () => clearInterval(interval)
  }, [isPlanted, currentStage])

  const handlePlant = () => {
    if (isPlanted || isAnimating) return
    setIsAnimating(true)
    setTimeout(() => {
      setIsPlanted(true)
      setIsAnimating(false)
    }, 300)
  }

  const handleReset = () => {
    setIsPlanted(false)
    setCurrentStage('seed')
    setStageProgress(0)
  }

  const handleStageChange = (stage: PlantStage) => {
    setCurrentStage(stage)
    setStageProgress(0)
  }

  const handlePlantComplete = () => {
    const newVariety = classifyPlant(params)
    setVarieties(prev => {
      const updated = [...prev, newVariety]
      if (updated.length > 12) {
        return updated.slice(-12)
      }
      return updated
    })
  }

  const handleParamChange = (key: keyof PlantParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="app-container">
      <style>{`
        .app-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          overflow: hidden;
        }

        .main-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          max-width: 1400px;
          width: 100%;
          flex-wrap: wrap;
        }

        .left-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          min-width: 150px;
        }

        .plant-title {
          color: #fff;
          font-size: 24px;
          font-weight: bold;
          text-align: center;
        }

        .progress-ring-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .progress-ring {
          transform: rotate(-90deg);
        }

        .progress-ring-progress {
          transition: stroke-dashoffset 0.3s ease;
        }

        .progress-ring-center {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .stage-name {
          color: #fff;
          font-size: 12px;
          text-align: center;
        }

        .stage-percent {
          color: #90EE90;
          font-size: 14px;
          font-weight: bold;
        }

        .canvas-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .control-panel {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 200px;
        }

        .slider-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .slider-label {
          display: flex;
          justify-content: space-between;
          color: #fff;
          font-size: 14px;
        }

        .slider-value {
          color: #90EE90;
          font-weight: bold;
        }

        .slider {
          width: 100%;
          height: 8px;
          -webkit-appearance: none;
          appearance: none;
          background: #3a3a50;
          border-radius: 4px;
          outline: none;
          cursor: pointer;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--thumb-color);
          cursor: pointer;
          transition: transform 0.2s;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .slider-track {
          height: 8px;
          border-radius: 4px;
          background: var(--color);
          opacity: calc(0.3 + var(--saturation) * 0.7);
          margin-top: -8px;
          pointer-events: none;
        }

        .plant-button {
          padding: 12px 32px;
          font-size: 16px;
          font-weight: bold;
          color: #fff;
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          border: none;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .plant-button:hover {
          background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(0, 0, 0, 0.4);
        }

        .plant-button:active {
          transform: translateY(1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .plant-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .reset-button {
          padding: 8px 20px;
          font-size: 14px;
          color: #fff;
          background: transparent;
          border: 2px solid #666;
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .reset-button:hover {
          border-color: #fff;
        }

        .buttons-container {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .collection-panel {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: rgba(30, 30, 50, 0.9);
          border-radius: 15px;
          padding: 20px;
          max-height: 400px;
          overflow-y: auto;
          backdrop-filter: blur(10px);
        }

        .collection-header {
          color: #fff;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .collection-icon {
          width: 24px;
          height: 24px;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2390EE90'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E") no-repeat center;
        }

        .variety-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          max-width: 400px;
        }

        .variety-card {
          width: 120px;
          background: #fff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s, box-shadow 0.2s;
          animation: fadeIn 0.4s ease forwards;
          opacity: 0;
        }

        .variety-card:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        }

        .variety-card.flipping {
          animation: flip 0.4s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes flip {
          0% {
            transform: rotateY(0deg);
          }
          50% {
            transform: rotateY(90deg);
          }
          100% {
            transform: rotateY(0deg);
          }
        }

        .card-info {
          padding: 10px;
          text-align: center;
        }

        .card-name {
          font-size: 14px;
          font-weight: bold;
          color: #333;
          margin-bottom: 4px;
        }

        .card-params {
          font-size: 10px;
          color: #666;
        }

        .empty-collection {
          color: #666;
          font-size: 14px;
          text-align: center;
          padding: 20px;
        }

        @media (max-width: 768px) {
          .main-content {
            flex-direction: column;
            gap: 20px;
          }

          .control-panel {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
            max-width: 500px;
            gap: 16px;
          }

          .slider-container {
            width: calc(33.33% - 12px);
            min-width: 120px;
          }

          .collection-panel {
            position: static;
            margin-top: 20px;
            max-height: 300px;
            width: 100%;
            max-width: 400px;
          }
        }
      `}</style>

      <div className="main-content">
        <div className="left-panel">
          <div className="plant-title">
            <div>植物生长模拟器</div>
          </div>
          <ProgressRing stage={currentStage} stageProgress={stageProgress} />
        </div>

        <div className="canvas-container">
          <PlantCanvas
            params={params}
            isPlanted={isPlanted}
            onStageChange={handleStageChange}
            onPlantComplete={handlePlantComplete}
          />
          <div className="buttons-container">
            <button
              className="plant-button"
              onClick={handlePlant}
              disabled={isPlanted || isAnimating}
            >
              {isPlanted ? '生长中...' : '🌱 种植'}
            </button>
            {isPlanted && (
              <button className="reset-button" onClick={handleReset}>
                重置
              </button>
            )}
          </div>
        </div>

        <div className="control-panel">
          <Slider
            label="☀️ 光照"
            value={params.light}
            onChange={(v) => handleParamChange('light', v)}
            color="#FFD700"
          />
          <Slider
            label="💧 水分"
            value={params.water}
            onChange={(v) => handleParamChange('water', v)}
            color="#00BFFF"
          />
          <Slider
            label="🌿 肥力"
            value={params.soil}
            onChange={(v) => handleParamChange('soil', v)}
            color="#8B4513"
          />
        </div>
      </div>

      <div className="collection-panel">
        <div className="collection-header">
          <div className="collection-icon" />
          <span>植物图鉴</span>
        </div>
        {varieties.length === 0 ? (
          <div className="empty-collection">点击种植开始培养你的植物吧！</div>
        ) : (
          <div className="variety-grid">
            {varieties.map((variety, index) => (
              <VarietyCard key={variety.id} variety={variety} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}