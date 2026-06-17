import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useAppStore } from './store'
import type { DiffLine, ContextLinesOption } from './types'

const getLineBgColor = (type: string, isOld: boolean): string => {
  switch (type) {
    case 'added':
      return isOld ? 'bg-transparent' : 'bg-[#DCFCE7]'
    case 'removed':
      return isOld ? 'bg-[#FEE2E2]' : 'bg-transparent'
    case 'modified':
      return 'bg-[#FEF9C3]'
    case 'context':
      return 'bg-gray-100'
    default:
      return 'bg-transparent'
  }
}

const getDiffIcon = (type: string, isOld: boolean): React.ReactNode => {
  if (type === 'context') return null
  if (isOld && type === 'removed') {
    return <span className="text-[#DC2626] font-bold w-4 inline-block text-center">-</span>
  }
  if (!isOld && type === 'added') {
    return <span className="text-[#16A34A] font-bold w-4 inline-block text-center">+</span>
  }
  return <span className="w-4 inline-block"></span>
}

interface LineProps {
  line: DiffLine
  isOld: boolean
}

const DiffLineComponent: React.FC<LineProps> = ({ line, isOld }) => {
  const lineNumber = isOld ? line.oldLineNumber : line.newLineNumber
  const bgColor = getLineBgColor(line.type, isOld)
  const icon = getDiffIcon(line.type, isOld)

  if (line.type === 'context') {
    return (
      <div className={`flex ${bgColor} py-1`}>
        <div className="w-16 text-center text-[12px] text-gray-400 select-none"></div>
        <div className="w-6 text-center"></div>
        <div className="flex-1 text-gray-400 text-center code-font">...</div>
      </div>
    )
  }

  const shouldShow = isOld
    ? (line.type !== 'added' || line.oldLineNumber !== null)
    : (line.type !== 'removed' || line.newLineNumber !== null)

  if (!shouldShow && lineNumber === null) {
    return (
      <div className={`flex ${bgColor} py-0.5`}>
        <div className="w-16 text-center text-[12px] text-[#9CA3AF] select-none"></div>
        <div className="w-6 text-center"></div>
        <div className="flex-1 code-font text-gray-300"></div>
      </div>
    )
  }

  return (
    <div className={`flex ${bgColor} py-0.5 transition-colors duration-300`}>
      <div className="w-16 text-center text-[12px] text-[#9CA3AF] select-none pr-2">
        {lineNumber || ''}
      </div>
      <div className="w-6 text-center">{icon}</div>
      <pre className="flex-1 code-font whitespace-pre break-all pr-4">
        {line.content || ' '}
      </pre>
    </div>
  )
}

export const DiffViewer: React.FC = () => {
  const {
    diffResult,
    oldFile,
    newFile,
    ignoreWhitespace,
    contextLines,
    setIgnoreWhitespace,
    setContextLines,
    setDiffResult,
    setStatsResult,
    isCalculating,
    setIsCalculating
  } = useAppStore()

  const oldPanelRef = useRef<HTMLDivElement>(null)
  const newPanelRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [leftWidth, setLeftWidth] = useState(50)
  const isSyncing = useRef(false)

  const recalculateDiff = useCallback(async () => {
    if (!oldFile || !newFile) return

    setIsCalculating(true)
    try {
      const [diffRes, statsRes] = await Promise.all([
        fetch('/api/diff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldContent: oldFile.content,
            newContent: newFile.content,
            ignoreWhitespace,
            contextLines
          })
        }),
        fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldContent: oldFile.content,
            newContent: newFile.content,
            ignoreWhitespace
          })
        })
      ])

      if (diffRes.ok && statsRes.ok) {
        const diffData = await diffRes.json()
        const statsData = await statsRes.json()
        setDiffResult(diffData)
        setStatsResult(statsData)
      }
    } finally {
      setIsCalculating(false)
    }
  }, [oldFile, newFile, ignoreWhitespace, contextLines, setDiffResult, setStatsResult, setIsCalculating])

  useEffect(() => {
    if (oldFile && newFile) {
      const timer = setTimeout(() => {
        recalculateDiff()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [ignoreWhitespace, contextLines])

  const handleScroll = useCallback((source: 'old' | 'new') => {
    if (isSyncing.current) return

    isSyncing.current = true
    requestAnimationFrame(() => {
      const sourceRef = source === 'old' ? oldPanelRef.current : newPanelRef.current
      const targetRef = source === 'old' ? newPanelRef.current : oldPanelRef.current

      if (sourceRef && targetRef) {
        const scrollPercentage = sourceRef.scrollTop / (sourceRef.scrollHeight - sourceRef.clientHeight)
        targetRef.scrollTop = scrollPercentage * (targetRef.scrollHeight - targetRef.clientHeight)
      }
      isSyncing.current = false
    })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
      setLeftWidth(Math.min(Math.max(newWidth, 20), 80))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleContextChange = (value: string) => {
    if (value === 'all') {
      setContextLines('all')
    } else {
      setContextLines(parseInt(value, 10) as ContextLinesOption)
    }
  }

  if (!oldFile || !newFile) {
    return (
      <div className="bg-white rounded-xl p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="text-gray-400 text-lg">请上传两个文件以查看差异</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">忽略空白符</span>
            <div
              className={`toggle-switch ${ignoreWhitespace ? 'active' : ''}`}
              onClick={() => setIgnoreWhitespace(!ignoreWhitespace)}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">上下文行数</span>
            <select
              value={contextLines.toString()}
              onChange={(e) => handleContextChange(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#6C63FF] bg-white cursor-pointer"
            >
              <option value="3">3 行</option>
              <option value="5">5 行</option>
              <option value="all">全部</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#DCFCE7] border border-green-200"></div>
            <span className="text-gray-600">新增</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#FEE2E2] border border-red-200"></div>
            <span className="text-gray-600">删除</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#FEF9C3] border border-yellow-200"></div>
            <span className="text-gray-600">修改</span>
          </div>
        </div>
      </div>

      {isCalculating && (
        <div className="bg-white rounded-xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="text-gray-500 animate-pulse">正在计算差异...</div>
        </div>
      )}

      <div
        ref={containerRef}
        className="resizable-container bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden"
        style={{ userSelect: isDragging ? 'none' : 'auto' }}
      >
        <div
          className="resizable-panel flex flex-col bg-[#F9FAFB]"
          style={{ width: `calc(${leftWidth}% - 4px)` }}
        >
          <div className="px-4 py-3 border-b border-gray-200 bg-white">
            <div className="font-medium text-gray-800 truncate">旧版本: {oldFile.fileName}</div>
            <div className="text-xs text-gray-500">{diffResult?.oldLineCount || 0} 行</div>
          </div>
          <div
            ref={oldPanelRef}
            className="flex-1 overflow-auto max-h-[500px]"
            onScroll={() => handleScroll('old')}
          >
            <div className="min-w-max">
              {diffResult?.diffLines.map((line, index) => (
                <DiffLineComponent key={`old-${index}`} line={line} isOld={true} />
              ))}
            </div>
          </div>
        </div>

        <div
          className="drag-handle"
          onMouseDown={handleMouseDown}
        />

        <div
          className="resizable-panel flex flex-col bg-[#F9FAFB]"
          style={{ width: `calc(${100 - leftWidth}% - 4px)` }}
        >
          <div className="px-4 py-3 border-b border-gray-200 bg-white">
            <div className="font-medium text-gray-800 truncate">新版本: {newFile.fileName}</div>
            <div className="text-xs text-gray-500">{diffResult?.newLineCount || 0} 行</div>
          </div>
          <div
            ref={newPanelRef}
            className="flex-1 overflow-auto max-h-[500px]"
            onScroll={() => handleScroll('new')}
          >
            <div className="min-w-max">
              {diffResult?.diffLines.map((line, index) => (
                <DiffLineComponent key={`new-${index}`} line={line} isOld={false} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
