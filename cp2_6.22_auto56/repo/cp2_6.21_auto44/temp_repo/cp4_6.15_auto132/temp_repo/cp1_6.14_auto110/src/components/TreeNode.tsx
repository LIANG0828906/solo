import React, { memo, useCallback, useRef, useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { TreeNodeData, NodeType } from '@/types/behaviorTree'
import { snapToGrid } from '@/utils/geometry'
import { GitBranch, ListOrdered, Filter, Zap, X } from 'lucide-react'

interface TreeNodeProps {
  node: TreeNodeData
  onPositionChange: (id: string, x: number, y: number) => void
  onStartConnection: (nodeId: string, port: 'output') => void
  onEndConnection: (nodeId: string, port: 'input') => void
  onDoubleClick: (id: string) => void
  onRemove: (id: string) => void
  isDraggingConnection?: boolean
}

const nodeColors: Record<NodeType, string> = {
  selector: '#e94560',
  sequence: '#0f3460',
  condition: '#533483',
  action: '#1a936f'
}

const nodeIcons: Record<NodeType, React.ElementType> = {
  selector: GitBranch,
  sequence: ListOrdered,
  condition: Filter,
  action: Zap
}

const NODE_WIDTH = 140
const NODE_HEIGHT = 80

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  onPositionChange,
  onStartConnection,
  onEndConnection,
  onDoubleClick,
  onRemove,
  isDraggingConnection = false
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [showRemove, setShowRemove] = useState(false)
  const [isNew, setIsNew] = useState(true)
  const [isInputHovered, setIsInputHovered] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)
  const nodeRef = useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const timer = setTimeout(() => setIsNew(false), 300)
    return () => clearTimeout(timer)
  }, [])

  const [{ isDragging }, drag] = useDrag({
    type: 'NODE',
    item: { id: node.id, type: 'NODE' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: (item, monitor) => {
      const offset = monitor.getDifferenceFromInitialOffset()
      if (offset) {
        const newX = snapToGrid(node.x + offset.x)
        const newY = snapToGrid(node.y + offset.y)
        onPositionChange(node.id, newX, newY)
      }
    }
  })

  const [{ isOver }, drop] = useDrop({
    accept: 'CONNECTION',
    drop: () => {
      onEndConnection(node.id, 'input')
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  })

  drag(dragRef)
  drop(nodeRef)

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onRemove(node.id)
  }, [node.id, onRemove])

  const handleDoubleClick = useCallback(() => {
    onDoubleClick(node.id)
  }, [node.id, onDoubleClick])

  const handleOutputPortMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onStartConnection(node.id, 'output')
  }, [node.id, onStartConnection])

  const handleRemoveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove(node.id)
  }, [node.id, onRemove])

  const color = nodeColors[node.type]
  const Icon = nodeIcons[node.type]
  const isCondition = node.type === 'condition'

  const getNodeShape = () => {
    if (isCondition) {
      return {
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        width: NODE_HEIGHT,
        height: NODE_HEIGHT,
        marginLeft: (NODE_WIDTH - NODE_HEIGHT) / 2
      }
    }
    if (node.type === 'selector' || node.type === 'sequence') {
      return {
        clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        marginLeft: 0
      }
    }
    return {
      borderRadius: '12px',
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      marginLeft: 0
    }
  }

  const shape = getNodeShape()

  const getBorderColor = () => {
    if (node.isExecuting) return '#ffd700'
    if (node.isActive) return '#00ff88'
    return isOver ? '#ffffff' : 'transparent'
  }

  const getBrightness = () => {
    if (isHovered) return 1.1
    return 1
  }

  return (
    <div
      ref={nodeRef}
      className="absolute"
      style={{
        left: node.x,
        top: node.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.5 : 1,
        transform: isNew ? 'scale(0.5)' : 'scale(1)',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
      onMouseEnter={() => {
        setIsHovered(true)
        setShowRemove(true)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        setShowRemove(false)
      }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {showRemove && (
        <button
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center z-10 hover:bg-red-400 transition-colors"
          onClick={handleRemoveClick}
        >
          <X size={12} className="text-white" />
        </button>
      )}

      <div
        ref={dragRef}
        className="relative cursor-move flex flex-col items-center justify-center"
        style={{
          ...shape,
          backgroundColor: color,
          filter: `brightness(${getBrightness()})`,
          border: `2px solid ${getBorderColor()}`,
          boxShadow: node.isExecuting
            ? '0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.3)'
            : node.isActive
            ? '0 0 15px rgba(0, 255, 136, 0.5)'
            : '0 4px 6px rgba(0, 0, 0, 0.3)',
          transition: 'filter 0.2s, border-color 0.2s, box-shadow 0.2s',
          cursor: 'grab'
        }}
      >
        {node.isExecuting && (
          <div
            className="absolute inset-0 rounded-inherit pointer-events-none"
            style={{
              ...shape,
              borderRadius: shape.borderRadius,
              animation: 'pulse-gold 1.5s ease-in-out infinite'
            }}
          />
        )}

        <div
          className="absolute top-1.5 left-2 w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: color, filter: 'brightness(1.3)' }}
        />

        <Icon size={20} className="text-white mb-1" />
        <span className="text-white text-xs font-medium text-center px-2 leading-tight">
          {node.label}
        </span>

        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 cursor-crosshair"
          style={{
            backgroundColor: '#1a1a2e',
            borderColor: isDraggingConnection && isInputHovered ? '#00ff88' : isOver ? '#00ff88' : '#ffffff',
            boxShadow: isDraggingConnection && isInputHovered
              ? '0 0 12px rgba(0, 255, 136, 0.9), 0 0 24px rgba(0, 255, 136, 0.5)'
              : isOver
              ? '0 0 10px rgba(0, 255, 136, 0.8)'
              : '0 0 8px rgba(255, 255, 255, 0.5)',
            animation: isDraggingConnection && isInputHovered ? 'port-pulse-green 1s ease-in-out infinite' : 'port-pulse 2s ease-in-out infinite',
            transform: isDraggingConnection && isInputHovered ? 'translateX(-50%) scale(1.2)' : 'translateX(-50%) scale(1)',
            transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s'
          }}
          onMouseEnter={() => setIsInputHovered(true)}
          onMouseLeave={() => setIsInputHovered(false)}
          onMouseUp={(e) => {
            e.stopPropagation()
            onEndConnection(node.id, 'input')
          }}
        />

        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 cursor-crosshair"
          style={{
            backgroundColor: '#1a1a2e',
            borderColor: '#ffffff',
            boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
            animation: 'port-pulse 2s ease-in-out infinite'
          }}
          onMouseDown={handleOutputPortMouseDown}
        />
      </div>

      <style>{`
        @keyframes port-pulse {
          0%, 100% {
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
          }
          50% {
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.8), 0 0 25px rgba(255, 255, 255, 0.4);
          }
        }
        
        @keyframes port-pulse-green {
          0%, 100% {
            box-shadow: 0 0 12px rgba(0, 255, 136, 0.9), 0 0 24px rgba(0, 255, 136, 0.5);
          }
          50% {
            box-shadow: 0 0 20px rgba(0, 255, 136, 1), 0 0 40px rgba(0, 255, 136, 0.7);
          }
        }
        
        @keyframes pulse-gold {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.3);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.5);
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  )
}

export default memo(TreeNode)
