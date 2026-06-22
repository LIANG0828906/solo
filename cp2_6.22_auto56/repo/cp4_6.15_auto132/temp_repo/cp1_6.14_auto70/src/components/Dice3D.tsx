import React, { useState, useEffect, useRef } from 'react'

interface Dice3DProps {
  value: number
  isRolling: boolean
  animationFrames?: number[]
  onAnimationEnd?: () => void
}

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
}

const Dice3D: React.FC<Dice3DProps> = ({ value, isRolling, animationFrames = [], onAnimationEnd }) => {
  const [displayValue, setDisplayValue] = useState(value || 1)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const frameRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRolling && animationFrames.length > 0) {
      frameRef.current = 0
      const interval = 70
      const animate = () => {
        if (frameRef.current < animationFrames.length) {
          setDisplayValue(animationFrames[frameRef.current])
          setRotation({
            x: Math.random() * 720 - 360,
            y: Math.random() * 720 - 360,
          })
          frameRef.current++
          timerRef.current = setTimeout(animate, interval)
        } else {
          setDisplayValue(value)
          setRotation({ x: 360, y: 360 })
          timerRef.current = setTimeout(() => {
            onAnimationEnd?.()
          }, 200)
        }
      }
      animate()
    } else {
      setDisplayValue(value)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isRolling, animationFrames, value, onAnimationEnd])

  const dots = DOT_POSITIONS[displayValue] || DOT_POSITIONS[1]

  return (
    <div className="dice-wrapper">
      <div
        className={`dice-3d ${isRolling ? 'rolling' : ''}`}
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: isRolling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        <div className="dice-face front">
          {dots.map((pos, i) => (
            <span
              key={i}
              className="dice-dot"
              style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}
            />
          ))}
        </div>
        <div className="dice-face back">
          {DOT_POSITIONS[7 - displayValue].map((pos, i) => (
            <span
              key={i}
              className="dice-dot"
              style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}
            />
          ))}
        </div>
        <div className="dice-face right">
          {DOT_POSITIONS[displayValue % 6 + 1].map((pos, i) => (
            <span
              key={i}
              className="dice-dot"
              style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}
            />
          ))}
        </div>
        <div className="dice-face left">
          {DOT_POSITIONS[((displayValue + 2) % 6) + 1].map((pos, i) => (
            <span
              key={i}
              className="dice-dot"
              style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}
            />
          ))}
        </div>
        <div className="dice-face top">
          {DOT_POSITIONS[((displayValue + 3) % 6) + 1].map((pos, i) => (
            <span
              key={i}
              className="dice-dot"
              style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}
            />
          ))}
        </div>
        <div className="dice-face bottom">
          {DOT_POSITIONS[((displayValue + 1) % 6) + 1].map((pos, i) => (
            <span
              key={i}
              className="dice-dot"
              style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dice3D
