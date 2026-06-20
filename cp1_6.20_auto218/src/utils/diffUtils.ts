import { diffLines } from 'diff'
import type { DiffResult, DiffChange } from '../types'

export function computeDiff(oldContent: string, newContent: string): DiffResult {
  const differences = diffLines(oldContent, newContent)

  const changes: DiffChange[] = []
  let added = 0
  let removed = 0
  let currentLine = 1

  for (const part of differences) {
    const lines = part.value.split('\n')

    if (lines[lines.length - 1] === '') {
      lines.pop()
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (part.added) {
        added++
        changes.push({
          type: 'added',
          value: line,
          lineNumber: currentLine,
        })
        currentLine++
      } else if (part.removed) {
        removed++
        changes.push({
          type: 'removed',
          value: line,
          lineNumber: currentLine,
        })
      } else {
        changes.push({
          type: 'unchanged',
          value: line,
          lineNumber: currentLine,
        })
        currentLine++
      }
    }
  }

  const modified = Math.min(added, removed)

  return {
    added,
    removed,
    modified,
    changes,
  }
}

export function formatLineNumber(line: number, totalLines: number): string {
  const maxDigits = totalLines.toString().length
  return line.toString().padStart(maxDigits, ' ')
}

export function getRandomAvatarColor(): string {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) {
    return '刚刚'
  } else if (diffMin < 60) {
    return `${diffMin}分钟前`
  } else if (diffHour < 24) {
    return `${diffHour}小时前`
  } else if (diffDay < 7) {
    return `${diffDay}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
}
