import { useRef, useEffect, useMemo } from 'react'
import { useTerrainStore } from '../store/terrainStore'
import { getProfile } from '../utils/erosionModel'
import './TerrainProfile.css'

export default function TerrainProfile() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { 
    profilePoints, 
    heightMap, 
    gridSize, 
    snapshots,
    terrainType
  } = useTerrainStore()

  const profileData = useMemo(() => {
    if (profilePoints.length < 2) return null
    
    return getProfile(
      heightMap,
      gridSize,
      profilePoints[0].x,
      profilePoints[0].y,
      profilePoints[1].x,
      profilePoints[1].y
    )
  }, [profilePoints, heightMap, gridSize])

  const snapshotProfiles = useMemo(() => {
    if (profilePoints.length < 2 || snapshots.length === 0) return []
    
    return snapshots.map((snapshot) => {
      const profile = getProfile(
        snapshot.heightMap,
        gridSize,
        profilePoints[0].x,
        profilePoints[0].y,
        profilePoints[1].x,
        profilePoints[1].y
      )
      return {
        name: snapshot.name,
        ...profile
      }
    })
  }, [profilePoints, snapshots, gridSize])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height
    const padding = { top: 20, right: 20, bottom: 30, left: 50 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    ctx.clearRect(0, 0, width, height)

    ctx.fillStyle = 'rgba(26, 26, 46, 0.9)'
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)'
    ctx.lineWidth = 1

    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }

    if (!profileData && snapshotProfiles.length === 0) {
      ctx.fillStyle = '#888'
      ctx.font = '13px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('点击地形上两点查看剖面图', width / 2, height / 2)
      return
    }

    let allMax = -Infinity
    let allMin = Infinity

    if (profileData) {
      allMax = Math.max(allMax, profileData.maxHeight)
      allMin = Math.min(allMin, profileData.minHeight)
    }

    for (const sp of snapshotProfiles) {
      allMax = Math.max(allMax, sp.maxHeight)
      allMin = Math.min(allMin, sp.minHeight)
    }

    const range = allMax - allMin || 1
    const yScale = chartHeight / (range * 1.2)
    const yOffset = allMin - range * 0.1

    ctx.fillStyle = '#888'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'

    for (let i = 0; i <= 5; i++) {
      const value = allMin + (range * 1.2) * (i / 5)
      const y = padding.top + chartHeight - (chartHeight * i) / 5
      ctx.fillText(value.toFixed(2), padding.left - 8, y)
    }

    const colors = ['#4444ff', '#ff4444', '#44ff44', '#ffff44', '#ff44ff']

    snapshotProfiles.forEach((sp, index) => {
      const color = colors[(index + 1) % colors.length]
      drawProfileLine(ctx, sp.heights, padding, chartWidth, chartHeight, yScale, yOffset, color, 2, false)
    })

    if (profileData) {
      drawProfileLine(ctx, profileData.heights, padding, chartWidth, chartHeight, yScale, yOffset, '#4444ff', 2.5, true)
    }

    if (profileData) {
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      
      const infoY = 5
      const lineHeight = 14
      
      ctx.fillStyle = '#00d4ff'
      ctx.fillText(`当前剖面`, padding.left, infoY)
      
      ctx.fillStyle = '#aaa'
      ctx.font = '10px sans-serif'
      ctx.fillText(
        `最高: ${profileData.maxHeight.toFixed(3)}  最低: ${profileData.minHeight.toFixed(3)}  平均: ${profileData.avgHeight.toFixed(3)}`,
        padding.left,
        infoY + lineHeight
      )
    }

    if (snapshotProfiles.length > 0) {
      const legendY = height - 15
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      
      let legendX = padding.left
      
      snapshotProfiles.forEach((sp, index) => {
        const color = colors[(index + 1) % colors.length]
        
        ctx.fillStyle = color
        ctx.fillRect(legendX, legendY - 4, 12, 2)
        
        ctx.fillStyle = '#aaa'
        ctx.fillText(sp.name, legendX + 16, legendY)
        
        legendX += ctx.measureText(sp.name).width + 30
      })
    }
  }, [profileData, snapshotProfiles])

  const drawProfileLine = (
    ctx: CanvasRenderingContext2D,
    heights: number[],
    padding: { top: number; right: number; bottom: number; left: number },
    chartWidth: number,
    chartHeight: number,
    yScale: number,
    yOffset: number,
    color: string,
    lineWidth: number,
    fill: boolean
  ) => {
    if (heights.length < 2) return

    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (let i = 0; i < heights.length; i++) {
      const x = padding.left + (chartWidth * i) / (heights.length - 1)
      const y = padding.top + chartHeight - (heights[i] - yOffset) * yScale

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    ctx.stroke()

    if (fill) {
      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
      ctx.lineTo(padding.left, padding.top + chartHeight)
      ctx.closePath()
      
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
      gradient.addColorStop(0, color + '40')
      gradient.addColorStop(1, color + '05')
      
      ctx.fillStyle = gradient
      ctx.fill()
    }
  }

  return (
    <div className="terrain-profile">
      <div className="profile-header">
        <span className="profile-title">地形剖面图</span>
        {profilePoints.length === 1 && (
          <span className="profile-hint">点击第二点完成剖面</span>
        )}
      </div>
      <canvas ref={canvasRef} className="profile-canvas" />
    </div>
  )
}
