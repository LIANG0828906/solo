import { useRef, useEffect, useState, useMemo } from 'react'
import { MOOD_MAP } from '../types'
import type { MoodRecord } from '../types'
import './MosaicGenerator.css'

interface MosaicGeneratorProps {
  records: MoodRecord[]
  size?: number
}

function MosaicGenerator({ records, size = 512 }: MosaicGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isGenerating, setIsGenerating] = useState(true)
  const [keyword, setKeyword] = useState('')

  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    records.forEach(record => {
      counts[record.moodType] = (counts[record.moodType] || 0) + 1
    })
    return counts
  }, [records])

  const sortedMoods = useMemo(() => {
    return Object.entries(moodCounts).sort((a, b) => b[1] - a[1])
  }, [moodCounts])

  const totalRecords = records.length

  useEffect(() => {
    if (sortedMoods.length > 0) {
      const topMood = sortedMoods[0][0]
      const topCount = sortedMoods[0][1]
      const ratio = totalRecords > 0 ? topCount / totalRecords : 0
      
      if (ratio > 0.6) {
        setKeyword(`${MOOD_MAP[topMood as keyof typeof MOOD_MAP]?.label || ''}居多`)
      } else if (ratio > 0.3) {
        setKeyword(`以${MOOD_MAP[topMood as keyof typeof MOOD_MAP]?.label || ''}为主`)
      } else {
        setKeyword('情绪多变')
      }
    } else {
      setKeyword('暂无记录')
    }
  }, [sortedMoods, totalRecords])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const startTime = performance.now()
    setIsGenerating(true)

    requestAnimationFrame(() => {
      ctx.clearRect(0, 0, size, size)

      if (records.length === 0) {
        const gradient = ctx.createLinearGradient(0, 0, size, size)
        gradient.addColorStop(0, '#f0f0f0')
        gradient.addColorStop(1, '#e0e0e0')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, size, size)
        
        ctx.fillStyle = '#999'
        ctx.font = '16px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('暂无记录', size / 2, size / 2)
        
        setIsGenerating(false)
        return
      }

      const cellSize = 32
      const cols = Math.ceil(size / cellSize)
      const rows = Math.ceil(size / cellSize)
      const totalCells = cols * rows

      const colorPool: string[] = []
      records.forEach(record => {
        const color = MOOD_MAP[record.moodType]?.color || '#ccc'
        const weight = Math.ceil((totalCells / records.length) * 1.5)
        for (let i = 0; i < weight; i++) {
          colorPool.push(color)
        }
      })

      const shuffled = colorPool.slice()
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }

      let colorIndex = 0
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * cellSize
          const y = row * cellSize
          const color = shuffled[colorIndex % shuffled.length]
          
          ctx.fillStyle = color
          ctx.fillRect(x, y, cellSize, cellSize)
          
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
          ctx.lineWidth = 1
          ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1)
          
          colorIndex++
        }
      }

      const elapsed = performance.now() - startTime
      console.log(`Mosaic generated in ${elapsed.toFixed(2)}ms`)
      setIsGenerating(false)
    })
  }, [records, size])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `mood-mosaic-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="mosaic-generator">
      <div className="mosaic-wrapper">
        <canvas 
          ref={canvasRef} 
          width={size} 
          height={size}
          className="mosaic-canvas"
        />
        {isGenerating && (
          <div className="mosaic-loading">
            <span>生成中...</span>
          </div>
        )}
      </div>
      
      <div className="mosaic-info">
        <div className="mosaic-keyword">{keyword}</div>
        <div className="mosaic-stats">
          共 {totalRecords} 条记录
        </div>
        
        <div className="mosaic-legend">
          {sortedMoods.map(([moodType, count]) => {
            const config = MOOD_MAP[moodType as keyof typeof MOOD_MAP]
            const percentage = totalRecords > 0 ? Math.round((count / totalRecords) * 100) : 0
            return (
              <div key={moodType} className="legend-item">
                <span 
                  className="legend-color" 
                  style={{ backgroundColor: config?.color }}
                />
                <span className="legend-label">{config?.label}</span>
                <span className="legend-percent">{percentage}%</span>
              </div>
            )
          })}
        </div>

        <button 
          className="download-btn"
          onClick={handleDownload}
          disabled={totalRecords === 0}
        >
          下载拼图 PNG
        </button>
      </div>
    </div>
  )
}

export default MosaicGenerator
