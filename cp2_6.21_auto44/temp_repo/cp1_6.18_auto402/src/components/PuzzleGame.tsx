import { useEffect, useRef, useState, useCallback } from 'react'
import type { PuzzleDifficulty } from '../types'
import Button from './Button'

interface Props {
  onComplete: (difficulty: number, timeSpent: number) => void
  onClose: () => void
}

const DIFFICULTIES: PuzzleDifficulty[] = [
  { size: 4, name: '简单', description: '4x4 格' },
  { size: 6, name: '中等', description: '6x6 格' },
  { size: 9, name: '困难', description: '9x9 格' },
]

const IMAGE_IDS = [1015, 1025, 1035, 1045, 1055, 1065]

interface Tile {
  index: number
  currentPos: number
}

const PuzzleGame = ({ onComplete, onClose }: Props) => {
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty | null>(null)
  const [tiles, setTiles] = useState<Tile[]>([])
  const [imageId] = useState(() => IMAGE_IDS[Math.floor(Math.random() * IMAGE_IDS.length)])
  const [selectedTile, setSelectedTile] = useState<number | null>(null)
  const [startTime, setStartTime] = useState<number>(0)
  const [elapsed, setElapsed] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [stars, setStars] = useState<{ dx: number; dy: number; delay: number }[]>([])
  const animFrameRef = useRef<number>()
  const startTimeRef = useRef<number>(0)
  const tileSize = 320

  const startGame = useCallback((diff: PuzzleDifficulty) => {
    setDifficulty(diff)
    const total = diff.size * diff.size
    const arr: Tile[] = []
    for (let i = 0; i < total; i++) arr.push({ index: i, currentPos: i })
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i].currentPos, arr[j].currentPos] = [arr[j].currentPos, arr[i].currentPos]
    }
    let inversions = 0
    for (let i = 0; i < total; i++) {
      for (let j = i + 1; j < total; j++) {
        const pi = arr.find((t) => t.currentPos === i)!.index
        const pj = arr.find((t) => t.currentPos === j)!.index
        if (pi > pj) inversions++
      }
    }
    if (inversions % 2 !== 0) {
      const t0 = arr.find((t) => t.currentPos === 0)!
      const t1 = arr.find((t) => t.currentPos === 1)!
      ;[t0.currentPos, t1.currentPos] = [t1.currentPos, t0.currentPos]
    }
    setTiles(arr)
    setSelectedTile(null)
    setCompleted(false)
    const now = performance.now()
    setStartTime(now)
    startTimeRef.current = now
  }, [])

  useEffect(() => {
    if (!difficulty || completed) return
    const tick = () => {
      setElapsed(performance.now() - startTimeRef.current)
      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [difficulty, completed])

  const isAdjacent = (a: number, b: number) => {
    if (!difficulty) return false
    const n = difficulty.size
    const ax = a % n
    const ay = Math.floor(a / n)
    const bx = b % n
    const by = Math.floor(b / n)
    return (ax === bx && Math.abs(ay - by) === 1) || (ay === by && Math.abs(ax - bx) === 1)
  }

  const checkComplete = (t: Tile[]) => t.every((tile) => tile.index === tile.currentPos)

  const handleTileClick = (pos: number) => {
    if (completed || !difficulty) return
    if (selectedTile === null) {
      setSelectedTile(pos)
      return
    }
    if (selectedTile === pos) {
      setSelectedTile(null)
      return
    }
    if (isAdjacent(selectedTile, pos)) {
      const newTiles = tiles.map((t) => {
        if (t.currentPos === selectedTile) return { ...t, currentPos: pos }
        if (t.currentPos === pos) return { ...t, currentPos: selectedTile }
        return t
      })
      setTiles(newTiles)
      setSelectedTile(null)
      if (checkComplete(newTiles)) {
        setCompleted(true)
        const timeSpent = (performance.now() - startTimeRef.current) / 1000
        const newStars: { dx: number; dy: number; delay: number }[] = []
        for (let i = 0; i < 30; i++) {
          const angle = (i / 30) * Math.PI * 2
          const dist = 100 + Math.random() * 120
          newStars.push({
            dx: Math.cos(angle) * dist,
            dy: Math.sin(angle) * dist,
            delay: Math.random() * 0.2,
          })
        }
        setStars(newStars)
        setTimeout(() => onComplete(difficulty.size, timeSpent), 1500)
      }
    } else {
      setSelectedTile(pos)
    }
  }

  const renderPuzzle = () => {
    if (!difficulty) return null
    const n = difficulty.size
    const s = tileSize / n
    return (
      <div
        style={{
          position: 'relative',
          width: tileSize,
          height: tileSize,
          background: '#000',
          borderRadius: 8,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {tiles.map((tile) => {
          const row = Math.floor(tile.index / n)
          const col = tile.index % n
          const curRow = Math.floor(tile.currentPos / n)
          const curCol = tile.currentPos % n
          const isSelected = selectedTile === tile.currentPos
          return (
            <div
              key={tile.index}
              onClick={() => handleTileClick(tile.currentPos)}
              style={{
                position: 'absolute',
                left: curCol * s,
                top: curRow * s,
                width: s,
                height: s,
                backgroundImage: `url(https://picsum.photos/id/${imageId}/320/320)`,
                backgroundSize: `${tileSize}px ${tileSize}px`,
                backgroundPosition: `-${col * s}px -${row * s}px`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: isSelected ? '3px solid #00D4AA' : '1px solid rgba(0,0,0,0.3)',
                boxShadow: isSelected ? '0 0 12px #00D4AA' : 'none',
                boxSizing: 'border-box',
              }}
            />
          )
        })}
        {completed && (
          <div
            style={{
              position: 'absolute',
              left: tileSize / 2,
              top: tileSize / 2,
              pointerEvents: 'none',
            }}
          >
            {stars.map((s, i) => (
              <span
                key={i}
                className="star-particle"
                style={
                  {
                    '--dx': `${s.dx}px`,
                    '--dy': `${s.dy}px`,
                    animationDelay: `${s.delay}s`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${m}:${(s % 60).toString().padStart(2, '0')}`
  }

  return (
    <div style={{ minWidth: 300 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>🧩 拼图挑战</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {difficulty && !completed && (
            <span style={{ color: '#00D4AA', fontWeight: 600, fontFamily: 'monospace', fontSize: 18 }}>
              ⏱ {formatTime(elapsed)}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
      </div>

      {!difficulty ? (
        <div>
          <p style={{ marginBottom: 20, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
            选择难度开始拼图。完成速度越快，获得的碎片稀有度越高！
          </p>
          <div style={{ display: 'grid', gap: 12 }}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d.size}
                onClick={() => startGame(d)}
                style={{
                  padding: '16px 20px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  color: '#fff',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 212, 170, 0.1)'
                  e.currentTarget.style.borderColor = '#00D4AA50'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{d.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{d.description}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
              目标原图
            </div>
            <img
              src={`https://picsum.photos/id/${imageId}/200/200`}
              alt="target"
              style={{ width: 160, height: 160, borderRadius: 8, objectFit: 'cover' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
              拼图区域（点击相邻图块交换位置）
            </div>
            {renderPuzzle()}
            {completed && (
              <div
                style={{
                  marginTop: 16,
                  textAlign: 'center',
                  color: '#00D4AA',
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                🎉 完成！正在生成奖励...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PuzzleGame
