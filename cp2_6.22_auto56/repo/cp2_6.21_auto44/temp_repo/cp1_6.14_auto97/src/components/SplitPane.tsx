import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SplitPaneProps {
  leftPane: React.ReactNode
  rightPane: React.ReactNode
  className?: string
  initialSplit?: number
}

export default function SplitPane({
  leftPane,
  rightPane,
  className,
  initialSplit = 50,
}: SplitPaneProps) {
  const [split, setSplit] = useState(initialSplit)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percentage = ((e.clientX - rect.left) / rect.width) * 100
    setSplit(Math.min(Math.max(percentage, 20), 80))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div
      className={cn(
        'flex h-full w-full overflow-hidden rounded-lg border border-gray-200 bg-white',
        className,
      )}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="h-full overflow-auto"
        style={{ width: `${split}%` }}
      >
        {leftPane}
      </div>
      <div
        className={cn(
          'flex w-1 cursor-col-resize items-center justify-center bg-gray-200 transition-colors',
          isDragging && 'bg-primary',
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="flex h-8 w-1 flex-col gap-1">
          <div className="h-1 w-1 rounded-full bg-gray-400" />
          <div className="h-1 w-1 rounded-full bg-gray-400" />
          <div className="h-1 w-1 rounded-full bg-gray-400" />
        </div>
      </div>
      <div
        className="h-full overflow-auto"
        style={{ width: `${100 - split}%` }}
      >
        {rightPane}
      </div>
    </div>
  )
}
