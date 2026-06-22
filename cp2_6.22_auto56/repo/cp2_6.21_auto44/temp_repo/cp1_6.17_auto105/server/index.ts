import express, { Request, Response } from 'express'
import cors from 'cors'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import * as Diff from 'diff'

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json({ limit: '10mb' }))

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.txt', '.js', '.ts', '.py', '.html', '.css']
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase()
    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件格式'))
    }
  }
})

interface ParseResponse {
  fileId: string
  fileName: string
  content: string
  lineCount: number
}

interface DiffLine {
  type: 'added' | 'removed' | 'modified' | 'unchanged' | 'context'
  oldLineNumber: number | null
  newLineNumber: number | null
  content: string
  oldContent?: string
  newContent?: string
}

interface DiffResponse {
  diffLines: DiffLine[]
  oldLineCount: number
  newLineCount: number
}

interface StatsResponse {
  totalLines: { old: number; new: number }
  addedLines: number
  removedLines: number
  modifiedLines: number
  unchangedLines: number
}

app.post('/api/parse', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未上传文件' })
    }

    const content = req.file.buffer.toString('utf-8')
    const response: ParseResponse = {
      fileId: uuidv4(),
      fileName: req.file.originalname,
      content,
      lineCount: content.split('\n').length
    }

    res.json(response)
  } catch (error) {
    res.status(500).json({ error: '文件解析失败' })
  }
})

function processContextLines(
  lines: DiffLine[],
  contextLines: number | 'all'
): DiffLine[] {
  if (contextLines === 'all') {
    return lines
  }

  const result: DiffLine[] = []
  const changeIndices: number[] = []

  lines.forEach((line, index) => {
    if (line.type !== 'unchanged') {
      changeIndices.push(index)
    }
  })

  if (changeIndices.length === 0) {
    return lines
  }

  const includeSet = new Set<number>()

  changeIndices.forEach(changeIdx => {
    for (let i = changeIdx - contextLines; i <= changeIdx + contextLines; i++) {
      if (i >= 0 && i < lines.length) {
        includeSet.add(i)
      }
    }
  })

  let lastIncluded = -1
  const sortedIndices = Array.from(includeSet).sort((a, b) => a - b)

  sortedIndices.forEach(idx => {
    if (idx > lastIncluded + 1) {
      result.push({
        type: 'context',
        oldLineNumber: null,
        newLineNumber: null,
        content: '...'
      })
    }
    result.push(lines[idx])
    lastIncluded = idx
  })

  return result
}

app.post('/api/diff', (req: Request, res: Response) => {
  try {
    const { oldContent, newContent, ignoreWhitespace, contextLines } = req.body as {
      oldContent: string
      newContent: string
      ignoreWhitespace: boolean
      contextLines: number | 'all'
    }

    let oldLines = oldContent.split('\n')
    let newLines = newContent.split('\n')

    const diffResult = Diff.diffLines(oldContent, newContent, {
      ignoreWhitespace,
      ignoreCase: false,
      newlineIsToken: false
    })

    const lines: DiffLine[] = []
    let oldLineNum = 1
    let newLineNum = 1

    for (const part of diffResult) {
      const partLines = part.value.split('\n')
      if (partLines[partLines.length - 1] === '') {
        partLines.pop()
      }

      for (const line of partLines) {
        if (part.added) {
          lines.push({
            type: 'added',
            oldLineNumber: null,
            newLineNumber: newLineNum,
            content: line
          })
          newLineNum++
        } else if (part.removed) {
          lines.push({
            type: 'removed',
            oldLineNumber: oldLineNum,
            newLineNumber: null,
            content: line
          })
          oldLineNum++
        } else {
          lines.push({
            type: 'unchanged',
            oldLineNumber: oldLineNum,
            newLineNumber: newLineNum,
            content: line
          })
          oldLineNum++
          newLineNum++
        }
      }
    }

    const processedLines = processContextLines(lines, contextLines)

    const response: DiffResponse = {
      diffLines: processedLines,
      oldLineCount: oldLines.length,
      newLineCount: newLines.length
    }

    res.json(response)
  } catch (error) {
    res.status(500).json({ error: '差异计算失败' })
  }
})

app.post('/api/stats', (req: Request, res: Response) => {
  try {
    const { oldContent, newContent, ignoreWhitespace } = req.body as {
      oldContent: string
      newContent: string
      ignoreWhitespace: boolean
    }

    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')

    const diffResult = Diff.diffLines(oldContent, newContent, {
      ignoreWhitespace
    })

    let addedLines = 0
    let removedLines = 0
    let unchangedLines = 0
    const addedContents: string[] = []
    const removedContents: string[] = []

    for (const part of diffResult) {
      const partLines = part.value.split('\n').filter(l => l !== '' || part.value.endsWith('\n'))
      const count = part.value.split('\n').length - (part.value.endsWith('\n') ? 1 : 0)

      if (part.added) {
        addedLines += count
        addedContents.push(...partLines.filter(l => l !== ''))
      } else if (part.removed) {
        removedLines += count
        removedContents.push(...partLines.filter(l => l !== ''))
      } else {
        unchangedLines += count
      }
    }

    let modifiedLines = 0
    const modifiedMap = new Map<string, number>()
    removedContents.forEach(line => {
      if (ignoreWhitespace) {
        line = line.trim()
      }
      modifiedMap.set(line, (modifiedMap.get(line) || 0) + 1)
    })
    addedContents.forEach(line => {
      if (ignoreWhitespace) {
        line = line.trim()
      }
      if (modifiedMap.has(line) && modifiedMap.get(line)! > 0) {
        modifiedLines++
        modifiedMap.set(line, modifiedMap.get(line)! - 1)
      }
    })

    const response: StatsResponse = {
      totalLines: { old: oldLines.length, new: newLines.length },
      addedLines,
      removedLines,
      modifiedLines,
      unchangedLines
    }

    res.json(response)
  } catch (error) {
    res.status(500).json({ error: '统计计算失败' })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
