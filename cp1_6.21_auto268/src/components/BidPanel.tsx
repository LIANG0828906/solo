import { useState } from 'react'
import { getSocket } from '../utils/socket'
import './BidPanel.css'

interface BidPanelProps {
  auctionId: string
  currentPrice: number
  disabled?: boolean
}

export default function BidPanel({ auctionId, currentPrice, disabled }: BidPanelProps) {
  const [bidAmount, setBidAmount] = useState<number>(currentPrice + 1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [error, setError] = useState<string>('')

  const minBid = currentPrice + 1

  const handleBid = () => {
    if (disabled) return
    if (bidAmount < minBid) {
      setError(`出价必须至少为 ${minBid} 元`)
      return
    }
    if (!Number.isInteger(bidAmount)) {
      setError('出价必须为整数')
      return
    }

    setError('')
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 150)

    const socket = getSocket()
    const username = localStorage.getItem('auction_username') || '匿名用户'
    
    socket.emit('bid:place', {
      auctionId,
      bidder: username,
      amount: bidAmount
    })

    setBidAmount(bidAmount + 1)
  }

  const handleQuickBid = (increment: number) => {
    const newAmount = Math.max(minBid, bidAmount + increment)
    setBidAmount(newAmount)
    setError('')
  }

  return (
    <div className="bid-panel">
      <div className="bid-panel-header">
        <span>立即出价</span>
        <span className="min-bid-hint">最低出价: ¥{minBid}</span>
      </div>
      
      <div className="bid-input-row">
        <div className="bid-input-wrapper">
          <span className="currency-symbol">¥</span>
          <input
            type="number"
            min={minBid}
            step="1"
            value={bidAmount}
            onChange={(e) => {
              setBidAmount(parseInt(e.target.value) || 0)
              setError('')
            }}
            disabled={disabled}
            className="bid-input"
          />
        </div>
        <button
          className={`bid-button ${isAnimating ? 'bid-pulse' : ''}`}
          onClick={handleBid}
          disabled={disabled}
        >
          立即出价
        </button>
      </div>

      {error && <div className="bid-error">{error}</div>}

      <div className="quick-bid-row">
        <button className="quick-bid-btn" onClick={() => handleQuickBid(1)} disabled={disabled}>+1</button>
        <button className="quick-bid-btn" onClick={() => handleQuickBid(5)} disabled={disabled}>+5</button>
        <button className="quick-bid-btn" onClick={() => handleQuickBid(10)} disabled={disabled}>+10</button>
        <button className="quick-bid-btn" onClick={() => handleQuickBid(50)} disabled={disabled}>+50</button>
        <button className="quick-bid-btn" onClick={() => handleQuickBid(100)} disabled={disabled}>+100</button>
      </div>
    </div>
  )
}
