export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineNumber: number
}

export function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  
  const result: DiffLine[] = []
  
  const maxLen = Math.max(oldLines.length, newLines.length)
  
  for (let i = 0; i < maxLen; i++) {
    if (i >= oldLines.length) {
      result.push({
        type: 'added',
        content: newLines[i],
        lineNumber: i + 1
      })
    } else if (i >= newLines.length) {
      result.push({
        type: 'removed',
        content: oldLines[i],
        lineNumber: i + 1
      })
    } else if (oldLines[i] === newLines[i]) {
      result.push({
        type: 'unchanged',
        content: oldLines[i],
        lineNumber: i + 1
      })
    } else {
      result.push({
        type: 'removed',
        content: oldLines[i],
        lineNumber: i + 1
      })
      result.push({
        type: 'added',
        content: newLines[i],
        lineNumber: i + 1
      })
    }
  }
  
  return result
}
