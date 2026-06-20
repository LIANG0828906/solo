import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useConnectionStore } from '@/connection/store/connectionStore'
import { useBubbleStore } from '@/bubble/store/bubbleStore'
import { useCanvasStore } from '@/canvas/store/canvasStore'
import { getBubbleEdgePoint, getBezierPath, getPointOnBezier, getBezierAngle } from '@/utils/geometryUtils'
import { mixColors } from '@/utils/colorUtils'
import type { Point } from '@/types'

interface ConnectionLineProps {
  connectionId: string
}

export const ConnectionLine: React.FC<ConnectionLineProps> = React.memo(({ connectionId }) => {
  const connection = useConnectionStore(s => s.connections.find(c => c.id === connectionId))
  const updateConnection = useConnectionStore(s => s.updateConnection)
  const removeConnection = useConnectionStore(s => s.removeConnection)
  const getBubbleById = useBubbleStore(s => s.getBubbleById)
  const scale = useCanvasStore(s => s.scale)

  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [pathLength, setPathLength] = useState(0)
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength())
    }
  }, [connection?.fromBubbleId, connection?.toBubbleId])

  useEffect(() => {
    if (isEditingLabel && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingLabel])

  const handleLabelDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditingLabel(true)
  }

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConnection(connectionId, { label: e.target.value })
  }

  const handleLabelBlur = () => {
    setIsEditingLabel(false)
  }

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    removeConnection(connectionId)
  }, [connectionId, removeConnection])

  if (!connection) return null

  const fromBubble = getBubbleById(connection.fromBubbleId)
  const toBubble = getBubbleById(connection.toBubbleId)
  if (!fromBubble || !toBubble) return null

  const startPoint: Point = getBubbleEdgePoint(fromBubble, toBubble.x, toBubble.y)
  const endPoint: Point = getBubbleEdgePoint(toBubble, fromBubble.x, fromBubble.y)
  const midPoint = getPointOnBezier(startPoint, endPoint, 0.5)
  const pathD = getBezierPath(startPoint, endPoint)
  const lineColor = mixColors(fromBubble.color, toBubble.color)
  const arrowRotation = getBezierAngle(startPoint, endPoint, 0.98) * 180 / Math.PI

  const strokeWidth = Math.max(1, 2 / scale)
  const labelFontSize = Math.max(8, 12 / scale)
  const deleteBtnSize = Math.max(12, 16 / scale)
  const labelPadding = Math.max(2, 6 / scale)
  const labelRadius = Math.max(2, 6 / scale)

  return (
    <g data-connection data-connection-id={connectionId}>
      <motion.path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke={lineColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={{ strokeDasharray: pathLength || 9999, strokeDashoffset: pathLength || 9999 }}
        animate={{ strokeDasharray: 'none', strokeDashoffset: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ pointerEvents: 'none' }}
      />

      <g transform={`translate(${endPoint.x}, ${endPoint.y}) rotate(${arrowRotation})`}>
        <motion.polygon
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.2 }}
          points={`${-8 / scale},${-5 / scale} 0,0 ${-8 / scale},${5 / scale}`}
          fill={lineColor}
          style={{ pointerEvents: 'none' }}
        />
      </g>

      <g
        transform={`translate(${midPoint.x}, ${midPoint.y})`}
        onDoubleClick={handleLabelDoubleClick}
        style={{ cursor: 'pointer' }}
      >
        <foreignObject
          x={-80 / scale}
          y={-labelFontSize * 1.5 - labelPadding * 2 - deleteBtnSize}
          width={160 / scale}
          height={labelFontSize * 3 + labelPadding * 2 + deleteBtnSize}
          style={{ overflow: 'visible' }}
        >
          <div
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
              borderRadius: labelRadius,
              padding: `${labelPadding}px ${labelPadding * 2 + deleteBtnSize / 2}px`,
              paddingRight: `${labelPadding * 2 + deleteBtnSize}px`,
              boxShadow: `0 ${1 / scale}px ${3 / scale}px rgba(0,0,0,0.15)`,
              minHeight: labelFontSize * 1.5 + labelPadding * 2,
              whiteSpace: 'nowrap'
            }}
          >
            {isEditingLabel ? (
              <input
                ref={inputRef}
                value={connection.label}
                onChange={handleLabelChange}
                onBlur={handleLabelBlur}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  border: 'none',
                  outline: `1px solid ${lineColor}`,
                  outlineOffset: 1,
                  background: 'transparent',
                  fontSize: labelFontSize,
                  color: '#333',
                  width: '100%',
                  textAlign: 'center',
                  padding: 0,
                  fontFamily: 'inherit'
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: labelFontSize,
                  color: '#333',
                  userSelect: 'none'
                }}
              >
                {connection.label || <span style={{ opacity: 0.4 }}>关系</span>}
              </span>
            )}

            <button
              onClick={handleDeleteClick}
              onMouseDown={(e) => e.stopPropagation()}
              title="删除连接"
              style={{
                position: 'absolute',
                right: labelPadding / 2,
                top: '50%',
                transform: 'translateY(-50%)',
                width: deleteBtnSize,
                height: deleteBtnSize,
                borderRadius: '50%',
                border: 'none',
                background: '#e0e0e0',
                color: '#666',
                cursor: 'pointer',
                fontSize: deleteBtnSize * 0.7,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                opacity: 0.7,
                transition: 'opacity 0.15s, background 0.15s'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.opacity = '1'
                ;(e.target as HTMLButtonElement).style.background = '#ff6b6b'
                ;(e.target as HTMLButtonElement).style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.opacity = '0.7'
                ;(e.target as HTMLButtonElement).style.background = '#e0e0e0'
                ;(e.target as HTMLButtonElement).style.color = '#666'
              }}
            >
              ×
            </button>
          </div>
        </foreignObject>
      </g>
    </g>
  )
})

ConnectionLine.displayName = 'ConnectionLine'
