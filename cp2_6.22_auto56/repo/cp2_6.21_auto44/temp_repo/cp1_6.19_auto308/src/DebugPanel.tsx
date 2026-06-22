import { useState, useEffect } from 'react'
import { useGameStore } from './store'
import { STATE_NODES, STATE_TRANSITIONS, getStateLabel, getStateColor } from './BossAI'
import type { BossPhase } from './store'
import './DebugPanel.css'

interface NodePosition {
  x: number
  y: number
  width: number
  height: number
}

const nodePositions: Record<BossPhase, NodePosition> = {
  idle: { x: 80, y: 40, width: 120, height: 50 },
  chase: { x: 80, y: 130, width: 120, height: 50 },
  charge: { x: 10, y: 220, width: 120, height: 50 },
  summon: { x: 150, y: 220, width: 120, height: 50 },
}

export default function DebugPanel() {
  const [pulsePhases, setPulsePhases] = useState<Record<BossPhase, number>>({
    idle: 0,
    chase: 0,
    charge: 0,
    summon: 0,
  })

  const bossPhase = useGameStore((s) => s.bossPhase)
  const phaseDuration = useGameStore((s) => s.phaseDuration)
  const phaseStartTime = useGameStore((s) => s.phaseStartTime)
  const summonCooldown = useGameStore((s) => s.summonCooldown)
  const lastSummonTime = useGameStore((s) => s.lastSummonTime)
  const bulletCount = useGameStore((s) => s.bullets.length)
  const minionCount = useGameStore((s) => s.minions.length)
  const pulseState = useGameStore((s) => s.pulseState)
  const score = useGameStore((s) => s.score)
  const playerLives = useGameStore((s) => s.playerLives)
  const fps = useGameStore((s) => s.fps)

  const [now, setNow] = useState(performance.now())

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(performance.now())
    }, 100)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    setPulsePhases(pulseState)
  }, [pulseState])

  const getPulseScale = (phase: BossPhase): number => {
    const pulseTime = pulsePhases[phase]
    if (!pulseTime) return 1
    const elapsed = now - pulseTime
    const duration = 200
    if (elapsed > duration) return 1
    const t = elapsed / duration
    return 0.9 + 0.1 * (1 - Math.pow(1 - t, 2))
  }

  const svgWidth = 280
  const svgHeight = 300

  const remainingTime = Math.max(0, phaseDuration - (now - phaseStartTime))
  const summonRemaining = Math.max(0, summonCooldown - (now - lastSummonTime))

  return (
    <div className="debug-panel">
      <h2 className="panel-title">Boss AI 状态机</h2>

      <div className="status-section">
        <div className="status-row">
          <span className="status-label">当前状态</span>
          <span
            className="status-value"
            style={{ color: getStateColor(bossPhase) }}
          >
            {getStateLabel(bossPhase)}
          </span>
        </div>
        <div className="status-row">
          <span className="status-label">剩余时间</span>
          <span className="status-value">{(remainingTime / 1000).toFixed(1)}s</span>
        </div>
        <div className="status-row">
          <span className="status-label">召唤冷却</span>
          <span className="status-value">{(summonRemaining / 1000).toFixed(1)}s</span>
        </div>
        <div className="status-row">
          <span className="status-label">子弹数量</span>
          <span className="status-value">{bulletCount}/100</span>
        </div>
        <div className="status-row">
          <span className="status-label">小兵数量</span>
          <span className="status-value">{minionCount}/30</span>
        </div>
      </div>

      <div className="state-tree-container">
        <h3 className="section-title">状态流转图</h3>
        <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#45A29E" />
            </marker>
            <marker
              id="arrowhead-active"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#E74C3C" />
            </marker>
          </defs>

          {STATE_TRANSITIONS.map((trans, idx) => {
            const fromNode = nodePositions[trans.from]
            const toNode = nodePositions[trans.to]

            const fromCenterX = fromNode.x + fromNode.width / 2
            const fromCenterY = fromNode.y + fromNode.height
            const toCenterX = toNode.x + toNode.width / 2
            const toCenterY = toNode.y

            const isActive = trans.from === bossPhase

            let pathD = ''
            const dx = toCenterX - fromCenterX
            const dy = toCenterY - fromCenterY

            if (Math.abs(dx) < 10) {
              pathD = `M ${fromCenterX} ${fromCenterY} L ${toCenterX} ${toCenterY}`
            } else {
              const midY = (fromCenterY + toCenterY) / 2
              pathD = `M ${fromCenterX} ${fromCenterY} Q ${fromCenterX} ${midY} ${fromCenterX + dx * 0.5} ${midY} T ${toCenterX} ${toCenterY}`
            }

            return (
              <g key={idx}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={isActive ? '#E74C3C' : '#45A29E'}
                  strokeWidth={isActive ? 2 : 1.5}
                  markerEnd={`url(#arrowhead${isActive ? '-active' : ''})`}
                  opacity={isActive ? 1 : 0.6}
                />
                <title>{trans.condition}</title>
              </g>
            )
          })}

          {STATE_NODES.map((node) => {
            const pos = nodePositions[node.name]
            const isActive = node.name === bossPhase
            const scale = getPulseScale(node.name)
            const centerX = pos.x + pos.width / 2
            const centerY = pos.y + pos.height / 2

            return (
              <g
                key={node.name}
                transform={`translate(${centerX}, ${centerY}) scale(${scale}) translate(${-centerX}, ${-centerY})`}
              >
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={pos.width}
                  height={pos.height}
                  rx={8}
                  ry={8}
                  fill="#2C3E50"
                  stroke={isActive ? '#E74C3C' : '#45A29E'}
                  strokeWidth={isActive ? 3 : 1.5}
                />
                <text
                  x={pos.x + pos.width / 2}
                  y={pos.y + pos.height / 2 - 6}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="13"
                  fontWeight="bold"
                >
                  {node.label}
                </text>
                <text
                  x={pos.x + pos.width / 2}
                  y={pos.y + pos.height / 2 + 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isActive ? '#E74C3C' : '#95A5A6'}
                  fontSize="10"
                >
                  {isActive ? '● 活跃中' : ''}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="conditions-section">
        <h3 className="section-title">切换条件</h3>
        {STATE_TRANSITIONS.filter((t) => t.from === bossPhase).map((trans, idx) => (
          <div key={idx} className="condition-item">
            <div className="condition-arrow">→</div>
            <div className="condition-content">
              <div className="condition-target" style={{ color: getStateColor(trans.to) }}>
                {getStateLabel(trans.to)}
              </div>
              <div className="condition-text">{trans.condition}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="stats-section">
        <h3 className="section-title">实时统计</h3>
        <div className="stat-grid">
          <div className="stat-item">
            <div className="stat-label">得分</div>
            <div className="stat-value">{score}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">生命</div>
            <div className="stat-value">{playerLives}/3</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">FPS</div>
            <div
              className="stat-value"
              style={{
                color:
                  fps >= 50 ? '#2ECC71' : fps >= 30 ? '#F39C12' : '#E74C3C',
              }}
            >
              {fps}
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">实体总数</div>
            <div className="stat-value">{bulletCount + minionCount}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
