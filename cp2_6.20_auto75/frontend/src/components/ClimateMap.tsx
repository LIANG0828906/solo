import { useRef, useEffect, useState, useCallback } from 'react'
import { useClimateStore } from '../store/climateStore'
import type { SensorData, MapPoint } from '../types'

const MAP_WIDTH = 800
const MAP_HEIGHT = 600
const GRID_SIZE = 20
const KDE_BANDWIDTH = 80
const HEATMAP_SCALE = 4

const gaussianKernel = (dx: number, dy: number, sigma: number): number => {
  const d2 = dx * dx + dy * dy
  const sigma2 = sigma * sigma
  return Math.exp(-d2 / (2 * sigma2)) / (2 * Math.PI * sigma2)
}

const ClimateMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const heatmapCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const timeRef = useRef(0)

  const sensorList = useClimateStore(state => state.sensorList)
  const mapState = useClimateStore(state => state.mapState)
  const setMapState = useClimateStore(state => state.setMapState)
  const addVirtualSensor = useClimateStore(state => state.addVirtualSensor)
  const isPlanningRoute = useClimateStore(state => state.isPlanningRoute)
  const routeStart = useClimateStore(state => state.routeStart)
  const routeEnd = useClimateStore(state => state.routeEnd)
  const setRouteStart = useClimateStore(state => state.setRouteStart)
  const setRouteEnd = useClimateStore(state => state.setRouteEnd)
  const calculateRoutes = useClimateStore(state => state.calculateRoutes)
  const routes = useClimateStore(state => state.routes)
  const selectedRouteId = useClimateStore(state => state.selectedRouteId)
  const setSelectedRoute = useClimateStore(state => state.setSelectedRoute)
  const setIsPlanningRoute = useClimateStore(state => state.setIsPlanningRoute)
  const setSelectedSensor = useClimateStore(state => state.setSelectedSensor)

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showAddSensor, setShowAddSensor] = useState(false)
  const [virtualRange, setVirtualRange] = useState<[number, number]>([20, 25])
  const [pendingSensorPos, setPendingSensorPos] = useState<MapPoint | null>(null)
  const [popupInfo, setPopupInfo] = useState<{ x: number; y: number; data: any } | null>(null)
  const [dragDistance, setDragDistance] = useState(0)
  const [, forceRender] = useState(0)

  useEffect(() => {
    const offscreen = document.createElement('canvas')
    offscreen.width = MAP_WIDTH / HEATMAP_SCALE
    offscreen.height = MAP_HEIGHT / HEATMAP_SCALE
    heatmapCanvasRef.current = offscreen
  }, [])

  useEffect(() => {
    const onResize = () => forceRender(n => n + 1)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const computeHeatmapKDE = useCallback((sensors: SensorData[]): Float32Array => {
    const width = Math.floor(MAP_WIDTH / HEATMAP_SCALE)
    const height = Math.floor(MAP_HEIGHT / HEATMAP_SCALE)
    const heatmap = new Float32Array(width * height)
    let minVal = Infinity
    let maxVal = -Infinity

    const temperatureSensors = sensors.filter(s => s.type === 'temperature')
    if (temperatureSensors.length === 0) {
      heatmap.fill(25)
      return heatmap
    }

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const worldX = px * HEATMAP_SCALE + HEATMAP_SCALE / 2
        const worldY = py * HEATMAP_SCALE + HEATMAP_SCALE / 2

        let totalWeight = 0
        let weightedSum = 0

        for (const sensor of temperatureSensors) {
          const dx = worldX - sensor.x
          const dy = worldY - sensor.y
          const weight = gaussianKernel(dx, dy, KDE_BANDWIDTH)
          weightedSum += sensor.value * weight
          totalWeight += weight
        }

        let value = totalWeight > 0 ? weightedSum / totalWeight : 25
        const idx = py * width + px
        heatmap[idx] = value
        if (value < minVal) minVal = value
        if (value > maxVal) maxVal = value
      }
    }

    const range = maxVal - minVal
    if (range > 0) {
      for (let i = 0; i < heatmap.length; i++) {
        heatmap[i] = 15 + ((heatmap[i] - minVal) / range) * 20
      }
    }

    return heatmap
  }, [])

  const bilinearSample = useCallback((heatmap: Float32Array, x: number, y: number): number => {
    const width = Math.floor(MAP_WIDTH / HEATMAP_SCALE)
    const height = Math.floor(MAP_HEIGHT / HEATMAP_SCALE)
    const fx = (x / HEATMAP_SCALE) - 0.5
    const fy = (y / HEATMAP_SCALE) - 0.5

    const x0 = Math.max(0, Math.min(width - 2, Math.floor(fx)))
    const y0 = Math.max(0, Math.min(height - 2, Math.floor(fy)))
    const x1 = x0 + 1
    const y1 = y0 + 1

    const tx = fx - x0
    const ty = fy - y0

    const v00 = heatmap[y0 * width + x0]
    const v10 = heatmap[y0 * width + x1]
    const v01 = heatmap[y1 * width + x0]
    const v11 = heatmap[y1 * width + x1]

    const a = v00 * (1 - tx) + v10 * tx
    const b = v01 * (1 - tx) + v11 * tx
    return a * (1 - ty) + b * ty
  }, [])

  const interpolateTemperature = useCallback((x: number, y: number): number => {
    if (!heatmapCanvasRef.current) {
      let totalWeight = 0
      let totalValue = 0
      sensorList.forEach(sensor => {
        if (sensor.type !== 'temperature') return
        const dx = x - sensor.x
        const dy = y - sensor.y
        const weight = gaussianKernel(dx, dy, KDE_BANDWIDTH)
        totalValue += sensor.value * weight
        totalWeight += weight
      })
      return totalWeight > 0 ? totalValue / totalWeight : 25
    }
    return 25
  }, [sensorList])

  const getTemperatureColor = (temp: number, alpha: number = 0.6): [number, number, number, number] => {
    const minTemp = 15
    const maxTemp = 35
    const t = Math.max(0, Math.min(1, (temp - minTemp) / (maxTemp - minTemp)))

    let r: number, g: number, b: number
    if (t < 0.25) {
      const p = t / 0.25
      r = Math.floor(30 + p * 40)
      g = Math.floor(144 + p * 40)
      b = Math.floor(255)
    } else if (t < 0.5) {
      const p = (t - 0.25) / 0.25
      r = Math.floor(70 + p * 100)
      g = Math.floor(184 - p * 34)
      b = Math.floor(255 - p * 80)
    } else if (t < 0.75) {
      const p = (t - 0.5) / 0.25
      r = Math.floor(170 + p * 55)
      g = Math.floor(150 - p * 60)
      b = Math.floor(175 - p * 100)
    } else {
      const p = (t - 0.75) / 0.25
      r = Math.floor(225 + p * 30)
      g = Math.floor(90 - p * 60)
      b = Math.floor(75 - p * 50)
    }

    return [r, g, b, Math.floor(alpha * 255)]
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const displayWidth = rect.width
    const displayHeight = rect.height

    ctx.clearRect(0, 0, displayWidth, displayHeight)

    ctx.save()
    ctx.translate(mapState.offsetX, mapState.offsetY)
    ctx.scale(mapState.zoom, mapState.zoom)

    const gradient = ctx.createLinearGradient(0, 0, MAP_WIDTH, MAP_HEIGHT)
    gradient.addColorStop(0, '#0a1929')
    gradient.addColorStop(1, '#0f3460')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT)

    const heatmap = computeHeatmapKDE(sensorList)
    const heatWidth = Math.floor(MAP_WIDTH / HEATMAP_SCALE)

    const imgData = ctx.createImageData(MAP_WIDTH, MAP_HEIGHT)
    for (let py = 0; py < MAP_HEIGHT; py++) {
      for (let px = 0; px < MAP_WIDTH; px++) {
        const worldX = px
        const worldY = py
        const temp = bilinearSample(heatmap, worldX, worldY)
        const [r, g, b, a] = getTemperatureColor(temp, 0.55)
        const pixelIdx = (py * MAP_WIDTH + px) * 4
        imgData.data[pixelIdx] = r
        imgData.data[pixelIdx + 1] = g
        imgData.data[pixelIdx + 2] = b
        imgData.data[pixelIdx + 3] = a
      }
    }

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = MAP_WIDTH
    tempCanvas.height = MAP_HEIGHT
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.putImageData(imgData, 0, 0)
    ctx.drawImage(tempCanvas, 0, 0)

    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1 / mapState.zoom
    for (let x = 0; x <= MAP_WIDTH; x += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, MAP_HEIGHT)
      ctx.stroke()
    }
    for (let y = 0; y <= MAP_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(MAP_WIDTH, y)
      ctx.stroke()
    }

    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)'
    ctx.beginPath()
    ctx.arc(100, 80, 35, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = `${10 / mapState.zoom}px Inter`
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fillText('办公楼', 70, 85)

    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)'
    ctx.fillRect(550, 80, 100, 80)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fillText('住宅区', 575, 125)

    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)'
    ctx.fillRect(280, 440, 120, 100)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fillText('中央花园', 305, 495)

    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)'
    ctx.beginPath()
    ctx.arc(700, 530, 40, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fillText('健身区', 675, 535)

    routes.forEach(route => {
      const isSelected = route.id === selectedRouteId
      ctx.strokeStyle = route.color
      ctx.lineWidth = isSelected ? (4 / mapState.zoom) : (3 / mapState.zoom)
      ctx.setLineDash(isSelected ? [] : [10 / mapState.zoom, 5 / mapState.zoom])

      ctx.shadowColor = route.color
      ctx.shadowBlur = isSelected ? 15 : 5

      ctx.beginPath()
      route.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      })
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.setLineDash([])

      if (isSelected) {
        route.points.forEach((point, index) => {
          const pulseSize = (5 + Math.sin(timeRef.current / 200 + index) * 2.5) / mapState.zoom
          const pulseRadius = pulseSize * 2

          const glow = ctx.createRadialGradient(
            point.x, point.y, 0,
            point.x, point.y, pulseRadius * 2
          )
          glow.addColorStop(0, route.color + '80')
          glow.addColorStop(1, route.color + '00')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(point.x, point.y, pulseRadius * 2, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = route.color
          ctx.beginPath()
          ctx.arc(point.x, point.y, pulseSize, 0, Math.PI * 2)
          ctx.fill()

          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2 / mapState.zoom
          ctx.stroke()
        })
      }
    })

    if (routeStart) {
      const pulseSize = (8 + Math.sin(timeRef.current / 300) * 2) / mapState.zoom
      ctx.fillStyle = '#2ed573'
      ctx.beginPath()
      ctx.arc(routeStart.x, routeStart.y, pulseSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2 / mapState.zoom
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.fillText('起点', routeStart.x - 12, routeStart.y - pulseSize - 5)
    }

    if (routeEnd) {
      const pulseSize = (8 + Math.sin(timeRef.current / 300) * 2) / mapState.zoom
      ctx.fillStyle = '#e94560'
      ctx.beginPath()
      ctx.arc(routeEnd.x, routeEnd.y, pulseSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2 / mapState.zoom
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.fillText('终点', routeEnd.x - 12, routeEnd.y - pulseSize - 5)
    }

    sensorList.forEach(sensor => {
      const pulseSize = (10 + Math.sin(timeRef.current / 400) * 2) / mapState.zoom
      const glowRadius = pulseSize * 2.5

      const sensorColor = sensor.isVirtual ? '#ffd700' : '#00d9ff'

      const glow = ctx.createRadialGradient(
        sensor.x, sensor.y, 0,
        sensor.x, sensor.y, glowRadius
      )
      glow.addColorStop(0, sensorColor + '60')
      glow.addColorStop(1, sensorColor + '00')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(sensor.x, sensor.y, glowRadius, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = sensorColor
      ctx.beginPath()
      ctx.arc(sensor.x, sensor.y, pulseSize, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowColor = sensorColor
      ctx.shadowBlur = 10
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2 / mapState.zoom
      ctx.stroke()
      ctx.shadowBlur = 0
    })

    ctx.restore()
  }, [sensorList, mapState, routes, selectedRouteId, routeStart, routeEnd, computeHeatmapKDE, bilinearSample])

  useEffect(() => {
    const animate = () => {
      timeRef.current += 16
      draw()
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [draw])

  const screenToMap = (screenX: number, screenY: number): MapPoint => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (screenX - rect.left - mapState.offsetX) / mapState.zoom,
      y: (screenY - rect.top - mapState.offsetY) / mapState.zoom,
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      if (isPlanningRoute) {
        const point = screenToMap(e.clientX, e.clientY)
        if (point.x >= 0 && point.x <= MAP_WIDTH && point.y >= 0 && point.y <= MAP_HEIGHT) {
          if (!routeStart) {
            setRouteStart(point)
          } else if (!routeEnd) {
            setRouteEnd(point)
            calculateRoutes(routeStart, point)
          }
        }
      } else if (showAddSensor) {
        const point = screenToMap(e.clientX, e.clientY)
        if (point.x >= 0 && point.x <= MAP_WIDTH && point.y >= 0 && point.y <= MAP_HEIGHT) {
          setPendingSensorPos(point)
        }
      } else {
        setIsDragging(true)
        setDragDistance(0)
        setDragStart({ x: e.clientX - mapState.offsetX, y: e.clientY - mapState.offsetY })
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      const dist = Math.abs(newX - mapState.offsetX) + Math.abs(newY - mapState.offsetY)
      setDragDistance(d => d + dist)
      setMapState({
        offsetX: newX,
        offsetY: newY,
      })
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      setIsDragging(false)
      if (dragDistance < 5) {
        handleClick(e)
      }
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isPlanningRoute || showAddSensor) return

    const point = screenToMap(e.clientX, e.clientY)

    let nearestSensor: SensorData | null = null
    let minDist = Infinity
    for (const sensor of sensorList) {
      const dist = Math.sqrt((sensor.x - point.x) ** 2 + (sensor.y - point.y) ** 2)
      if (dist < 25 && dist < minDist) {
        nearestSensor = sensor
        minDist = dist
      }
    }

    if (nearestSensor) {
      setSelectedSensor(nearestSensor.id)
      setPopupInfo({
        x: e.clientX,
        y: e.clientY,
        data: nearestSensor,
      })
    } else {
      if (point.x >= 0 && point.x <= MAP_WIDTH && point.y >= 0 && point.y <= MAP_HEIGHT) {
        const temp = interpolateTemperature(point.x, point.y)
        setPopupInfo({
          x: e.clientX,
          y: e.clientY,
          data: {
            name: '当前位置',
            temperature: temp.toFixed(1),
            humidity: (55 + Math.random() * 15).toFixed(0),
          },
        })
        setSelectedSensor(null)
      } else {
        setPopupInfo(null)
      }
    }

    setMapState({ selectedPoint: point, showPopup: true })
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.5, Math.min(3, mapState.zoom * delta))

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const newOffsetX = mouseX - (mouseX - mapState.offsetX) * (newZoom / mapState.zoom)
    const newOffsetY = mouseY - (mouseY - mapState.offsetY) * (newZoom / mapState.zoom)

    setMapState({ zoom: newZoom, offsetX: newOffsetX, offsetY: newOffsetY })
  }

  const handleAddVirtualSensor = () => {
    if (pendingSensorPos) {
      addVirtualSensor(pendingSensorPos.x, pendingSensorPos.y, virtualRange)
      setPendingSensorPos(null)
      setShowAddSensor(false)
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#16213e',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)',
        minHeight: 0,
      }}
      className="climate-map"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: isDragging ? 'grabbing' : isPlanningRoute ? 'crosshair' : showAddSensor ? 'copy' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setIsDragging(false); setPopupInfo(null) }}
        onWheel={handleWheel}
      />

      <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, zIndex: 10 }}>
        <button
          onClick={() => {
            setShowAddSensor(!showAddSensor)
            setIsPlanningRoute(false)
            setPendingSensorPos(null)
          }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: showAddSensor ? '#00d9ff' : '#0f3460',
            color: showAddSensor ? '#0f3460' : '#fff',
            fontSize: 20,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: showAddSensor ? 'none' : '1px solid rgba(255,255,255,0.1)',
          }}
          title="添加虚拟传感器"
        >
          +
        </button>
        <button
          onClick={() => {
            setIsPlanningRoute(!isPlanningRoute)
            setShowAddSensor(false)
            setPendingSensorPos(null)
          }}
          style={{
            height: 36,
            padding: '0 16px',
            borderRadius: 8,
            background: isPlanningRoute ? '#e94560' : '#0f3460',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: isPlanningRoute ? 'none' : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {isPlanningRoute ? '✕ 取消规划' : '🗺️ 规划路线'}
        </button>
      </div>

      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        zIndex: 10,
      }}>
        <button
          onClick={() => setMapState({ zoom: Math.min(3, mapState.zoom * 1.2) })}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: '#0f3460',
            color: '#fff',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          +
        </button>
        <button
          onClick={() => setMapState({ zoom: Math.max(0.5, mapState.zoom * 0.8) })}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: '#0f3460',
            color: '#fff',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          −
        </button>
      </div>

      {isPlanningRoute && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 52, 96, 0.95)',
          padding: '10px 20px',
          borderRadius: 8,
          fontSize: 13,
          color: '#fff',
          border: '1px solid rgba(0, 217, 255, 0.3)',
          zIndex: 10,
        }}>
          {!routeStart && '📍 点击地图设置起点'}
          {routeStart && !routeEnd && '📍 点击地图设置终点'}
          {routeStart && routeEnd && '✅ 已规划完成，可在右侧面板查看路线详情'}
        </div>
      )}

      {showAddSensor && !pendingSensorPos && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 217, 255, 0.15)',
          padding: '10px 20px',
          borderRadius: 8,
          fontSize: 13,
          color: '#00d9ff',
          border: '1px solid rgba(0, 217, 255, 0.3)',
          zIndex: 10,
        }}>
          📍 点击地图任意位置添加虚拟传感器
        </div>
      )}

      {showAddSensor && pendingSensorPos && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(22, 33, 62, 0.98)',
          padding: 16,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minWidth: 260,
          border: '1px solid rgba(0, 217, 255, 0.3)',
          zIndex: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>
            ⚙️ 配置虚拟传感器 - 温度范围 (°C)
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number"
              value={virtualRange[0]}
              onChange={e => setVirtualRange([parseFloat(e.target.value) || 0, virtualRange[1]])}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.2)',
                background: '#1a1a2e',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
              placeholder="最低温度"
            />
            <span style={{ color: '#a0aec0' }}>~</span>
            <input
              type="number"
              value={virtualRange[1]}
              onChange={e => setVirtualRange([virtualRange[0], parseFloat(e.target.value) || 0])}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.2)',
                background: '#1a1a2e',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
              placeholder="最高温度"
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleAddVirtualSensor}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 6,
                background: '#00d9ff',
                color: '#0f3460',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ✅ 确认添加
            </button>
            <button
              onClick={() => { setShowAddSensor(false); setPendingSensorPos(null) }}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: 13,
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {routes.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 60,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: 200,
          zIndex: 10,
        }}>
          {routes.map(route => (
            <div
              key={route.id}
              onClick={() => setSelectedRoute(route.id)}
              style={{
                background: selectedRouteId === route.id ? `${route.color}30` : 'rgba(15, 52, 96, 0.95)',
                padding: 12,
                borderRadius: 8,
                cursor: 'pointer',
                border: `1px solid ${selectedRouteId === route.id ? route.color : 'rgba(255,255,255,0.1)'}`,
                transition: 'all 0.2s ease',
                boxShadow: selectedRouteId === route.id ? `0 0 20px ${route.color}40` : '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 16, height: 3, background: route.color, borderRadius: 2 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{route.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a0aec0' }}>
                <span>⏱️ {route.duration} 分钟</span>
                <span style={{ color: '#2ed573', fontWeight: 500 }}>💚 舒适度 {route.comfortIndex}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {popupInfo && containerRef.current && (
        <div
          style={{
            position: 'absolute',
            left: popupInfo.x - containerRef.current.getBoundingClientRect().left + 14,
            top: popupInfo.y - containerRef.current.getBoundingClientRect().top + 14,
            background: 'rgba(22, 33, 62, 0.98)',
            padding: 14,
            borderRadius: 8,
            border: '1px solid rgba(0, 217, 255, 0.4)',
            minWidth: 180,
            pointerEvents: 'none',
            zIndex: 30,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
          className="fade-in"
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: popupInfo.data.status === 'online' ? '#2ed573' : '#ffa502',
            }} />
            {popupInfo.data.name}
          </div>
          {popupInfo.data.temperature !== undefined && (
            <div style={{ fontSize: 12, color: '#a0aec0', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>🌡️ 温度</span>
              <span style={{ color: '#e94560', fontWeight: 600 }}>{popupInfo.data.temperature}°C</span>
            </div>
          )}
          {popupInfo.data.humidity !== undefined && (
            <div style={{ fontSize: 12, color: '#a0aec0', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>💧 湿度</span>
              <span style={{ color: '#00d9ff', fontWeight: 600 }}>{popupInfo.data.humidity}%</span>
            </div>
          )}
          {popupInfo.data.value !== undefined && popupInfo.data.unit !== undefined && (
            <div style={{ fontSize: 12, color: '#a0aec0', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>📊 读数</span>
              <span style={{ color: '#00d9ff', fontWeight: 600 }}>{popupInfo.data.value.toFixed(1)} {popupInfo.data.unit}</span>
            </div>
          )}
          {popupInfo.data.type && (
            <div style={{ fontSize: 12, color: '#a0aec0', display: 'flex', justifyContent: 'space-between' }}>
              <span>🏷️ 类型</span>
              <span style={{ color: '#a0aec0' }}>{popupInfo.data.type}</span>
            </div>
          )}
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 11,
        color: '#a0aec0',
        background: 'rgba(15, 52, 96, 0.85)',
        padding: '8px 14px',
        borderRadius: 6,
        border: '1px solid rgba(255,255,255,0.08)',
        zIndex: 10,
      }}>
        <span>🌡️ KDE温度热力图</span>
        <div style={{
          width: 100,
          height: 8,
          background: 'linear-gradient(to right, #1e90ff, #7ac9ff, #ffeaa7, #ff7f50, #ff4757)',
          borderRadius: 4,
        }} />
        <span>15°C → 35°C</span>
      </div>
    </div>
  )
}

export default ClimateMap
