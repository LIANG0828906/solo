export interface ParsedFile {
  fileId: string
  fileName: string
  content: string
  lineCount: number
}

export type DiffLineType = 'added' | 'removed' | 'modified' | 'unchanged' | 'context'

export interface DiffLine {
  type: DiffLineType
  oldLineNumber: number | null
  newLineNumber: number | null
  content: string
  oldContent?: string
  newContent?: string
}

export interface DiffResponse {
  diffLines: DiffLine[]
  oldLineCount: number
  newLineCount: number
}

export interface StatsResponse {
  totalLines: { old: number; new: number }
  addedLines: number
  removedLines: number
  modifiedLines: number
  unchangedLines: number
}

export type ContextLinesOption = 3 | 5 | 'all'
