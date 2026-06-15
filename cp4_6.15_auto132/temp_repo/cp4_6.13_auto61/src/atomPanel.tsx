import React from 'react'
import { useMoleculeStore, ELEMENTS, getElementColor, getAtom3DRadius } from './moleculeStore'

const AtomIcon: React.FC<{ symbol: string; en: number; radius: number; size?: number }> = ({ symbol, en, radius, size = 40 }) => {
  const color = getElementColor(en)
  const r = size * 0.4
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id={`grad-${symbol}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </radialGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill={`url(#grad-${symbol})`} />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill="white" fontSize={size * 0.28} fontWeight="bold" fontFamily="system-ui">
        {symbol}
      </text>
    </svg>
  )
}

export const AtomPanel: React.FC = () => {
  const setDragState = useMoleculeStore(s => s.setDragState)

  const handleDragStart = (e: React.DragEvent, symbol: string) => {
    e.dataTransfer.setData('text/plain', symbol)
    e.dataTransfer.effectAllowed = 'copy'
    setDragState({ element: symbol, isDragging: true, screenX: e.clientX, screenY: e.clientY })
  }

  const handleDragEnd = () => {
    setDragState({ element: null, isDragging: false })
  }

  return (
    <div className="atom-panel">
      <h3 className="panel-title">元素周期表</h3>
      <div className="element-grid">
        {ELEMENTS.map(el => (
          <div
            key={el.symbol}
            className="element-cell"
            draggable
            onDragStart={e => handleDragStart(e, el.symbol)}
            onDragEnd={handleDragEnd}
            title={`${el.name} (${el.symbol}) - 电负性: ${el.electronegativity}`}
          >
            <AtomIcon symbol={el.symbol} en={el.electronegativity} radius={el.radius} />
            <span className="element-name">{el.name}</span>
          </div>
        ))}
      </div>
      <div className="en-legend">
        <span className="en-low">低电负性</span>
        <div className="en-gradient" />
        <span className="en-high">高电负性</span>
      </div>
    </div>
  )
}
