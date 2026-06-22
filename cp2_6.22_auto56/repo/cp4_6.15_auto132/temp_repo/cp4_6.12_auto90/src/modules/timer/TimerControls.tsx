import React from 'react'
import type { TimerStatus } from '../../store/usePomodoroStore'

interface TimerControlsProps {
  status: TimerStatus
  onStart: () => void
  onPause: () => void
  onReset: () => void
}

const createRipple = (
  event: React.MouseEvent<HTMLButtonElement>,
  callback: (ripple: { x: number; y: number; size: number }) => void
) => {
  const button = event.currentTarget
  const rect = button.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2
  callback({ x, y, size })
}

const RippleButton: React.FC<{
  className: string
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  children: React.ReactNode
}> = ({ className, onClick, children }) => {
  const [ripples, setRipples] = React.useState<
    { id: number; x: number; y: number; size: number }[]
  >([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e, (ripple) => {
      const id = Date.now()
      setRipples((prev) => [...prev, { id, ...ripple }])
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id))
      }, 600)
    })
    onClick(e)
  }

  return (
    <button className={className} onClick={handleClick}>
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
    </button>
  )
}

const TimerControls: React.FC<TimerControlsProps> = ({
  status,
  onStart,
  onPause,
  onReset,
}) => {
  const isIdle = status === 'idle' || status === 'paused' || status === 'break'

  return (
    <div className="timer-controls">
      {isIdle ? (
        <RippleButton
          className="btn btn-primary"
          onClick={onStart}
        >
          {status === 'paused' ? '继续' : '开始'}
        </RippleButton>
      ) : (
        <RippleButton
          className="btn btn-primary"
          onClick={onPause}
        >
          暂停
        </RippleButton>
      )}
      <RippleButton
        className="btn btn-secondary"
        onClick={onReset}
      >
        重置
      </RippleButton>
    </div>
  )
}

export default TimerControls
