import { useState } from 'react'
import './CoinButton.css'

interface CoinButtonProps {
  onClick: () => void
}

export function CoinButton({ onClick }: CoinButtonProps) {
  const [pressed, setPressed] = useState(false)

  const handleClick = () => {
    setPressed(true)
    onClick()
    setTimeout(() => setPressed(false), 200)
  }

  return (
    <button
      className={`coin-button ${pressed ? 'pressed' : ''}`}
      onClick={handleClick}
      aria-label="投放许愿币"
    >
      <div className="coin-inner">
        <span className="coin-text">许</span>
      </div>
    </button>
  )
}
