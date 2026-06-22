import { MoveRecord, StoneColor } from '../store/useGameStore'

const BOARD_SIZE = 19
const CELL_SIZE = 30
const PADDING = 30
const BOARD_COLOR = '#f5f0e6'
const LINE_COLOR = '#5a5a5a'
const BLACK_STONE = '#2c2c2c'
const WHITE_STONE = '#f0ebe0'
const WHITE_STROKE = '#8b8b8b'

const coordinatesToLabel = (x: number, y: number): string => {
  const letters = 'ABCDEFGHJKLMNOPQRST'
  return `${letters[x]}${BOARD_SIZE - y}`
}

export const exportToSVG = (
  board: (StoneColor | null)[][],
  moveHistory: MoveRecord[]
): string => {
  const width = CELL_SIZE * (BOARD_SIZE - 1) + PADDING * 2
  const height = CELL_SIZE * (BOARD_SIZE - 1) + PADDING * 2

  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${BOARD_COLOR}"/>
`

  for (let i = 0; i < BOARD_SIZE; i++) {
    svgContent += `  <line x1="${PADDING}" y1="${PADDING + i * CELL_SIZE}" x2="${PADDING + (BOARD_SIZE - 1) * CELL_SIZE}" y2="${PADDING + i * CELL_SIZE}" stroke="${LINE_COLOR}" stroke-width="1"/>
`
    svgContent += `  <line x1="${PADDING + i * CELL_SIZE}" y1="${PADDING}" x2="${PADDING + i * CELL_SIZE}" y2="${PADDING + (BOARD_SIZE - 1) * CELL_SIZE}" stroke="${LINE_COLOR}" stroke-width="1"/>
`
  }

  const starPoints = [
    [3, 3], [9, 3], [15, 3],
    [3, 9], [9, 9], [15, 9],
    [3, 15], [9, 15], [15, 15]
  ]

  starPoints.forEach(([x, y]) => {
    svgContent += `  <circle cx="${PADDING + x * CELL_SIZE}" cy="${PADDING + y * CELL_SIZE}" r="3" fill="${LINE_COLOR}"/>
`
  })

  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        const cx = PADDING + x * CELL_SIZE
        const cy = PADDING + y * CELL_SIZE
        const fill = cell === 'black' ? BLACK_STONE : WHITE_STONE
        const stroke = cell === 'white' ? WHITE_STROKE : 'none'
        const strokeWidth = cell === 'white' ? 1 : 0
        svgContent += `  <circle cx="${cx}" cy="${cy}" r="${CELL_SIZE * 0.45}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>
`
      }
    })
  })

  moveHistory.forEach(move => {
    const cx = PADDING + move.x * CELL_SIZE
    const cy = PADDING + move.y * CELL_SIZE
    const textColor = move.color === 'black' ? '#ffffff' : '#2c2c2c'
    const fontSize = move.moveNumber >= 100 ? 10 : 12
    svgContent += `  <text x="${cx}" y="${cy + fontSize / 3}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${textColor}">${move.moveNumber}</text>
`
  })

  svgContent += '</svg>'
  return svgContent
}

export const downloadSVG = (svgContent: string, filename: string = 'moyqip.svg') => {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const exportToPNG = async (
  board: (StoneColor | null)[][],
  moveHistory: MoveRecord[]
): Promise<string> => {
  const svgContent = exportToSVG(board, moveHistory)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建Canvas上下文')

  const width = CELL_SIZE * (BOARD_SIZE - 1) + PADDING * 2
  const height = CELL_SIZE * (BOARD_SIZE - 1) + PADDING * 2
  const scale = 2
  canvas.width = width * scale
  canvas.height = height * scale
  ctx.scale(scale, scale)

  const img = new Image()
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = url
  })
}

export const downloadPNG = async (
  board: (StoneColor | null)[][],
  moveHistory: MoveRecord[],
  filename: string = 'moyqip.png'
) => {
  const dataUrl = await exportToPNG(board, moveHistory)
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export { coordinatesToLabel }
