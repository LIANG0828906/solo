import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { diffLines } from 'diff'
import { cn } from '@/lib/utils'

interface DiffBlock {
  id: number
  oldLines: string[]
  newLines: string[]
  type: 'added' | 'removed' | 'modified' | 'unchanged'
  isCollapsed: boolean
}

interface DiffViewerProps {
  oldContent: string
  newContent: string
  className?: string
  showLineNumbers?: boolean
}

export default function DiffViewer({
  oldContent,
  newContent,
  className,
  showLineNumbers = true,
}: DiffViewerProps) {
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<number>>(new Set())

  const diffBlocks = useMemo(() => {
    const differences = diffLines(oldContent, newContent)
    const blocks: DiffBlock[] = []
    let blockId = 0

    let currentBlock: DiffBlock = {
      id: blockId,
      oldLines: [],
      newLines: [],
      type: 'unchanged',
      isCollapsed: false,
    }

    for (const part of differences) {
      const lines = part.value.split('\n')
      if (lines[lines.length - 1] === '') {
        lines.pop()
      }

      const partType = part.added ? 'added' : part.removed ? 'removed' : 'unchanged'

      if (currentBlock.type !== 'unchanged' && partType === 'unchanged') {
        if (currentBlock.oldLines.length > 0 || currentBlock.newLines.length > 0) {
          blocks.push(currentBlock)
          blockId++
        }
        currentBlock = {
          id: blockId,
          oldLines: [],
          newLines: [],
          type: 'unchanged',
          isCollapsed: false,
        }
      }

      if (partType === 'removed') {
        if (currentBlock.type === 'added') {
          currentBlock.type = 'modified'
        } else if (currentBlock.type === 'unchanged') {
          currentBlock.type = 'removed'
        }
        currentBlock.oldLines.push(...lines)
      } else if (partType === 'added') {
        if (currentBlock.type === 'removed') {
          currentBlock.type = 'modified'
        } else if (currentBlock.type === 'unchanged') {
          currentBlock.type = 'added'
        }
        currentBlock.newLines.push(...lines)
      } else {
        currentBlock.oldLines.push(...lines)
        currentBlock.newLines.push(...lines)
      }
    }

    if (currentBlock.oldLines.length > 0 || currentBlock.newLines.length > 0) {
      blocks.push(currentBlock)
    }

    return blocks
  }, [oldContent, newContent])

  const toggleCollapse = (blockId: number) => {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev)
      if (next.has(blockId)) {
        next.delete(blockId)
      } else {
        next.add(blockId)
      }
      return next
    })
  }

  const maxLines = Math.max(
    ...diffBlocks.map((b) => Math.max(b.oldLines.length, b.newLines.length))
  )
  const lineNumberWidth = Math.max(3, maxLines.toString().length) * 0.6 + 'rem'

  const renderLine = (
    content: string,
    type: 'added' | 'removed' | 'unchanged',
    lineNumber?: number
  ) => {
    const bgColor =
      type === 'removed' ? '#ffeef0' : type === 'added' ? '#e6ffed' : 'transparent'
    const textStyle =
      type === 'removed'
        ? 'line-through opacity-70'
        : type === 'added'
        ? 'underline underline-offset-2'
        : ''

    return (
      <div
        className={cn(
          'flex items-stretch font-mono text-sm transition-colors duration-300'
        )}
        style={{ backgroundColor: bgColor }}
      >
        {showLineNumbers && (
          <span
            className={cn(
              'select-none px-2 text-right text-dark-muted border-r border-dark-muted/20',
              'flex-shrink-0'
            )}
            style={{ width: lineNumberWidth }}
          >
            {lineNumber || ''}
          </span>
        )}
        <pre
          className={cn(
            'flex-1 px-4 py-0.5 whitespace-pre-wrap break-words',
            textStyle,
            type === 'removed' ? 'text-red-700' : type === 'added' ? 'text-green-700' : 'text-dark-text'
          )}
        >
          {content || ' '}
        </pre>
      </div>
    )
  }

  return (
    <div className={cn('border border-dark-muted/20 rounded-lg overflow-hidden bg-dark-surface', className)}>
      <div className="grid grid-cols-2 border-b border-dark-muted/20 bg-dark-base">
        <div className="px-4 py-2 text-sm font-medium text-dark-muted border-r border-dark-muted/20">
          旧版本
        </div>
        <div className="px-4 py-2 text-sm font-medium text-dark-muted">
          新版本
        </div>
      </div>
      <div className="grid grid-cols-2">
        <div className="border-r border-dark-muted/20">
          {diffBlocks.map((block, blockIndex) => {
            const isCollapsed = collapsedBlocks.has(block.id)
            const isChanged = block.type !== 'unchanged'
            const showConnector = isChanged && blockIndex < diffBlocks.length - 1

            return (
              <div key={block.id} className="relative">
                {isChanged && (
                  <button
                    onClick={() => toggleCollapse(block.id)}
                    className={cn(
                      'absolute left-0 top-0 z-10 flex items-center gap-1 px-2 py-1',
                      'text-xs text-dark-muted hover:text-dark-text',
                      'bg-dark-surface/90 backdrop-blur-sm rounded-br-md',
                      'transition-colors'
                    )}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                    {block.type === 'added'
                      ? `+${block.newLines.length}`
                      : block.type === 'removed'
                      ? `-${block.oldLines.length}`
                      : `~${block.oldLines.length}`}
                  </button>
                )}
                {isCollapsed ? (
                  <div className="py-2 text-center text-dark-muted text-sm">
                    ...
                  </div>
                ) : (
                  block.oldLines.map((line, idx) =>
                    renderLine(
                      line,
                      block.type === 'unchanged' ? 'unchanged' : 'removed',
                      idx + 1
                    )
                  )
                )}
                {showConnector && (
                  <div className="absolute right-0 top-full w-0.5 h-4 bg-dark-muted/30 border-dashed border-r border-dark-muted/30" />
                )}
              </div>
            )
          })}
        </div>
        <div>
          {diffBlocks.map((block, blockIndex) => {
            const isCollapsed = collapsedBlocks.has(block.id)
            const isChanged = block.type !== 'unchanged'
            const showConnector = isChanged && blockIndex < diffBlocks.length - 1

            return (
              <div key={block.id} className="relative">
                {isCollapsed ? (
                  <div className="py-2 text-center text-dark-muted text-sm">
                    ...
                  </div>
                ) : (
                  block.newLines.map((line, idx) =>
                    renderLine(
                      line,
                      block.type === 'unchanged' ? 'unchanged' : 'added',
                      idx + 1
                    )
                  )
                )}
                {showConnector && (
                  <div className="absolute left-0 top-full w-0.5 h-4 bg-dark-muted/30 border-dashed border-l border-dark-muted/30" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
