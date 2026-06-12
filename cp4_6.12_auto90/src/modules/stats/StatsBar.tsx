import React, { useEffect, useState } from 'react'

interface StatsBarProps {
  height: number
  color: string
  label: string
  index: number
}

const StatsBar: React.FC<StatsBarProps> = ({ height, color, label, index }) => {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimated(true)
    }, index * 50)
    return () => clearTimeout(timer)
  }, [index])

  return (
    <div className="stats-bar-container">
      <div
        className="stats-bar"
        style={{
          height: animated ? `${height}px` : '0px',
          background: color,
          transition: 'height 0.5s ease-out',
        }}
      />
      <span className="stats-bar-label">{label}</span>
    </div>
  )
}

export default React.memo(StatsBar)
