import { useCountdown } from '../utils/useCountdown'

interface CountdownProps {
  targetDate: string
  size?: 'sm' | 'md' | 'lg'
}

function Countdown({ targetDate, size = 'md' }: CountdownProps) {
  const { days, hours, minutes, seconds, timeLevel } = useCountdown(targetDate)

  const colorClass = timeLevel === 'far' ? 'countdown-cyan' : timeLevel === 'medium' ? 'countdown-gold' : 'countdown-red'
  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : ''

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className={`countdown ${colorClass} ${sizeClass}`}>
      <span className="countdown-item">
        <span className="countdown-number">{pad(days)}</span>
        <span className="countdown-label">天</span>
      </span>
      <span className="countdown-item">
        <span className="countdown-number">{pad(hours)}</span>
        <span className="countdown-label">时</span>
      </span>
      <span className="countdown-item">
        <span className="countdown-number">{pad(minutes)}</span>
        <span className="countdown-label">分</span>
      </span>
      <span className="countdown-item">
        <span className="countdown-number">{pad(seconds)}</span>
        <span className="countdown-label">秒</span>
      </span>
    </div>
  )
}

export default Countdown
