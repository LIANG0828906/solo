import { useEffect, useRef } from 'react'
import { useStore, SimulationSpeed } from '../store'
import { BUILDING_TYPE_CONFIG, BuildingType } from '../utils/heatSimulation'

const CHART_WIDTH = 240
const CHART_HEIGHT = 120
const MAX_HISTORY_POINTS = 60

const SPEED_CONFIG: Record<SimulationSpeed, { label: string }> = {
  slow: { label: '慢' },
  normal: { label: '中' },
  fast: { label: '快' },
}

const REGION_ORDER: BuildingType[] = ['commercial', 'industrial', 'residential', 'park']

const REGION_LINE_COLORS: Record<BuildingType, string> = {
  commercial: '#FFAA00',
  industrial: '#E74C3C',
  residential: '#00FFAA',
  park: '#6B8CFF',
}

function drawChart(
  canvas: HTMLCanvasElement,
  history: Array<{ timestep: number; avgHeat: number; regionAvg: Record<BuildingType, number> }>
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const w = CHART_WIDTH
  const h = CHART_HEIGHT

  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)
  }

  ctx.clearRect(0, 0, w, h)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
  ctx.lineWidth = 1
  const gridRows = 4
  for (let i = 0; i <= gridRows; i++) {
    const y = (h / gridRows) * i
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  if (history.length < 2) return

  const padL = 0
  const padR = 0
  const padT = 8
  const padB = 8
  const chartW = w - padL - padR
  const chartH = h - padT - padB

  const minHeat = 0
  const maxHeat = 100

  const dataPoints = Math.min(history.length, MAX_HISTORY_POINTS)
  const startIdx = history.length - dataPoints

  const xStep = dataPoints > 1 ? chartW / (dataPoints - 1) : 0

  for (const region of REGION_ORDER) {
    ctx.beginPath()
    ctx.strokeStyle = REGION_LINE_COLORS[region]
    ctx.lineWidth = 1.5

    for (let i = 0; i < dataPoints; i++) {
      const point = history[startIdx + i]
      const val = point.regionAvg[region]
      const x = padL + i * xStep
      const y = padT + chartH - ((val - minHeat) / (maxHeat - minHeat)) * chartH
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
  }

  ctx.beginPath()
  ctx.strokeStyle = '#E74C3C'
  ctx.lineWidth = 2

  for (let i = 0; i < dataPoints; i++) {
    const point = history[startIdx + i]
    const val = point.avgHeat
    const x = padL + i * xStep
    const y = padT + chartH - ((val - minHeat) / (maxHeat - minHeat)) * chartH
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()
}

export default function ControlPanel() {
  const isRunning = useStore(s => s.isRunning)
  const speed = useStore(s => s.speed)
  const timestep = useStore(s => s.timestep)
  const avgHeat = useStore(s => s.avgHeat)
  const regionAvg = useStore(s => s.regionAvg)
  const history = useStore(s => s.history)
  const actions = useStore(s => s.actions)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      drawChart(canvasRef.current, history)
    }
  }, [history])

  const buildingCount = 100

  return (
    <div className="control-panel">
      <div className="panel-title">城市热力控制中心</div>

      <div className="stats-section">
        <div className="stat-item">
          <span className="stat-label">时间步数</span>
          <span className="stat-value">{timestep}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">建筑数量</span>
          <span className="stat-value">{buildingCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">总热量均值</span>
          <span className="stat-value">{avgHeat.toFixed(2)}</span>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-title">区域平均热量趋势</div>
        <div className="chart-container">
          <canvas ref={canvasRef} style={{ width: CHART_WIDTH, height: CHART_HEIGHT }} />
        </div>
        <div className="region-list">
          {REGION_ORDER.map(region => {
            const config = BUILDING_TYPE_CONFIG[region]
            return (
              <div key={region} className="region-item">
                <div className="region-name">
                  <span
                    className="region-dot"
                    style={{ background: REGION_LINE_COLORS[region] }}
                  />
                  {config.name}
                </div>
                <span className="region-heat">{regionAvg[region].toFixed(1)}</span>
              </div>
            )
          })}
          <div className="region-item">
            <div className="region-name">
              <span className="region-dot" style={{ background: '#E74C3C' }} />
              总体平均
            </div>
            <span className="region-heat" style={{ color: '#E74C3C', fontWeight: 600 }}>
              {avgHeat.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="buttons-section">
        <div className="btn-row">
          <button
            className={`btn ${isRunning ? 'btn-danger' : 'btn-primary'}`}
            onClick={actions.toggle}
          >
            {isRunning ? '⏸ 暂停' : '▶ 开始'}
          </button>
          <button className="btn btn-danger" onClick={actions.reset}>
            ↻ 重置
          </button>
        </div>

        <div className="chart-title" style={{ marginTop: 6 }}>模拟速度</div>
        <div className="btn-row">
          {(['slow', 'normal', 'fast'] as SimulationSpeed[]).map(s => (
            <button
              key={s}
              className={`btn btn-speed ${speed === s ? 'active' : ''}`}
              onClick={() => actions.setSpeed(s)}
            >
              {SPEED_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
