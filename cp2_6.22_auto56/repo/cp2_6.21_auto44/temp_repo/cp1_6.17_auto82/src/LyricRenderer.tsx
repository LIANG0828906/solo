import { useEffect, useRef } from 'react'
import type { LyricLine } from './LyricParser'

interface LyricRendererProps {
  lines: LyricLine[]
  currentTime: number
}

const CURRENT_FONT_SIZE = 32
const OTHER_FONT_SIZE = 24
const LINE_HEIGHT = 56
const HIGHLIGHT_COLOR = '#FFB347'
const CURRENT_COLOR = '#FFFFFF'
const OTHER_COLOR = '#FFFFFF60'

function findCurrentLineIndex(lines: LyricLine[], time: number): number {
  if (lines.length === 0) return -1
  let lo = 0
  let hi = lines.length - 1
  let result = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (lines[mid].time <= time) {
      result = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return result
}

function measureText(ctx: CanvasRenderingContext2D, chars: string[], fontSize: number): number[] {
  ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`
  const widths: number[] = []
  for (const ch of chars) widths.push(ctx.measureText(ch).width)
  return widths
}

export default function LyricRenderer({ lines, currentTime }: LyricRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollOffsetRef = useRef(0)
  const targetScrollRef = useRef(0)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef(performance.now())
  const linesRef = useRef(lines)
  const currentTimeRef = useRef(currentTime)

  useEffect(() => {
    linesRef.current = lines
    currentTimeRef.current = currentTime
  }, [lines, currentTime])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const canvasEl: HTMLCanvasElement = canvas
    const context: CanvasRenderingContext2D = ctx

    function resize() {
      const rect = canvasEl.getBoundingClientRect()
      canvasEl.width = rect.width * dpr
      canvasEl.height = rect.height * dpr
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvasEl)

    function render() {
      const now = performance.now()
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000)
      lastTimeRef.current = now

      const rect = canvasEl.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      const currentLines = linesRef.current
      const time = currentTimeRef.current

      context.clearRect(0, 0, w, h)

      if (currentLines.length === 0) {
        context.fillStyle = OTHER_COLOR
        context.font = `${OTHER_FONT_SIZE}px sans-serif`
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText('暂无歌词，请在左侧输入', w / 2, h / 2)
        rafRef.current = requestAnimationFrame(render)
        return
      }

      const curIdx = findCurrentLineIndex(currentLines, time)
      const centerY = h * 0.5

      const lineStartTime = curIdx >= 0 ? currentLines[curIdx].time : 0
      const lineEndTime = curIdx >= 0 && curIdx < currentLines.length - 1 ? currentLines[curIdx + 1].time : lineStartTime + 5
      const lineDuration = Math.max(0.1, lineEndTime - lineStartTime)
      const lineProgress = curIdx >= 0 ? Math.max(0, Math.min(1, (time - lineStartTime) / lineDuration)) : 0

      targetScrollRef.current = curIdx * LINE_HEIGHT
      scrollOffsetRef.current += (targetScrollRef.current - scrollOffsetRef.current) * Math.min(1, dt * 8)

      const startIdx = Math.max(0, curIdx - 8)
      const endIdx = Math.min(currentLines.length, curIdx + 9)

      for (let i = startIdx; i < endIdx; i++) {
        const line = currentLines[i]
        const isCurrent = i === curIdx
        const fontSize = isCurrent ? CURRENT_FONT_SIZE : OTHER_FONT_SIZE
        const color = isCurrent ? CURRENT_COLOR : OTHER_COLOR
        const y = centerY + (i * LINE_HEIGHT - scrollOffsetRef.current)

        if (y < -60 || y > h + 60) continue

        const chars = Array.from(line.text || ' ')
        const widths = measureText(context, chars, fontSize)
        const totalWidth = widths.reduce((a, b) => a + b, 0) + (chars.length - 1) * 2
        let x = w / 2 - totalWidth / 2

        context.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`
        context.textBaseline = 'middle'

        let highlightedChars = 0
        if (isCurrent && chars.length > 0) {
          highlightedChars = Math.min(chars.length, Math.floor(lineProgress * chars.length) + 1)
        }

        for (let j = 0; j < chars.length; j++) {
          const ch = chars[j]
          const chWidth = widths[j]

          context.fillStyle = color
          context.fillText(ch, x, y)

          if (isCurrent && j < highlightedChars) {
            let charProgress: number
            if (chars.length === 1) {
              charProgress = lineProgress
            } else {
              const perChar = 1 / chars.length
              const charStart = j * perChar
              charProgress = Math.max(0, Math.min(1, (lineProgress - charStart) / perChar))
            }

            const clipTop = y + fontSize / 2 - fontSize * charProgress
            context.save()
            context.beginPath()
            context.rect(x - 2, clipTop, chWidth + 4, fontSize * charProgress + 2)
            context.clip()
            context.fillStyle = HIGHLIGHT_COLOR
            context.fillText(ch, x, y)
            context.restore()
          }

          x += chWidth + 2
        }
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
}
