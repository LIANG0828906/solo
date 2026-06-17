import React from 'react'
import type { Bottle } from '../api'

interface BottleCardProps {
  bottle: Bottle
  onPick: (id: string) => void
  onThrow: (id: string) => void
}

const BottleCard: React.FC<BottleCardProps> = ({ bottle, onPick, onThrow }) => {
  return (
    <div
      className="bottle-card"
      style={{ height: `${bottle.height}px` }}
    >
      <div className="bottle-card-header">
        <span className="bottle-emoji">{bottle.emoji}</span>
        <span className="bottle-tag">{bottle.tag}</span>
      </div>
      <p className="bottle-comment">{bottle.comment}</p>
      <div className="bottle-card-footer">
        <span className="bottle-pass-count">已传递 {bottle.passCount} 次</span>
        <div className="bottle-actions">
          <button
            className="btn-pick"
            onClick={(e) => {
              e.stopPropagation()
              onPick(bottle.id)
            }}
          >
            捡起
          </button>
          <button
            className="btn-throw"
            onClick={(e) => {
              e.stopPropagation()
              onThrow(bottle.id)
            }}
          >
            扔掉
          </button>
        </div>
      </div>
    </div>
  )
}

export default BottleCard
