import React from 'react'
import type { Atom } from '../../types'

interface TooltipProps {
  atom: Atom | null
  position: { x: number; y: number } | null
}

const Tooltip: React.FC<TooltipProps> = ({ atom, position }) => {
  if (!atom || !position) return null

  return (
    <div
      className="tooltip"
      style={{
        left: position.x,
        top: position.y
      }}
    >
      <div>
        <strong>{atom.name}</strong> ({atom.element})
      </div>
      <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
        链 {atom.chainId} · 残基 {atom.residueId}
      </div>
    </div>
  )
}

export default Tooltip
