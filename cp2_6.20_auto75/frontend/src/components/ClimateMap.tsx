import { useRef, useEffect, useState, useCallback } from 'react'
import { useClimateStore } from '../store/climateStore'
import type { SensorData, MapPoint } from '../types'

const MAP_WIDTH = 800
const MAP_HEIGHT = 600
const GRID_SIZE = 20

const ClimateMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)

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

  const interpolateTemperature = useCallback((x: number, y: number): number => {
    let totalWeight = 0
    let totalValue = 0

    sensorList.forEach(sensor => {
      const dx = x - sensor.x
      const dy = y - sensor.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const radius = 150
      if (distance < radius) {
        const weight = (1 - distance / radius) ** 2
        const sensorValue = sensor.type === 'temperature' ? sensor.value : 25
        totalValue += sensorValue * weight
        totalWeight += weight
      }
    })

    if (totalWeight > 0) {
      return totalValue / totalWeight
    }
    return 25
  }, [sensorList])

  const getTemperatureColor = (temp: number): string => {
    const minTemp = 15
    const maxTemp = 35
    const t = Math.max(0, Math.min(1, (temp - minTemp) / (maxTemp - minTemp)))

    const r = Math.floor(30 + t * 200)
    const g = Math.floor(100 + (1 - t) * 100)
    const b = Math.floor(255 - t * 200)

    return `rgba(${r}, ${g}, ${b}, 0.6)`
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const displayWidth = rect.width
    const displayHeight = rect.height

    ctx.clearRect(0, 0, displayWidth, displayHeight)

    ctx.save()
    ctx.translate(mapState.offsetX, mapState.offsetY)
    ctx.scale(mapState.zoom, mapState.zoom)

    ctx.fillStyle = '#0f3460'
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT)

    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
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

    const heatCols = Math.ceil(MAP_WIDTH / GRID_SIZE)
    const heatRows = Math.ceil(MAP_HEIGHT / GRID_SIZE)

    for (let row = 0; row < heatRows; row++) {
      for (let col = 0; col < heatCols; col++) {
        const x = col * GRID_SIZE
        const y = row * GRID_SIZE
        const temp = interpolateTemperature(x + GRID_SIZE / 2, y + GRID_SIZE / 2)
        ctx.fillStyle = getTemperatureColor(temp)
        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE)
      }
    }

    ctx.fillStyle = 'rgba(26, 26, 46, 0.7)'
    ctx.beginPath()
    ctx.arc(100, 80, 30, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(26, 26, 46, 0.7)'
    ctx.fillRect(550, 100, 80, 60)
    ctx.fillRect(300, 450, 100, 80)

    routes.forEach(route => {
      const isSelected = route.id === selectedRouteId
      ctx.strokeStyle = route.color
      ctx.lineWidth = isSelected ? 4 : 3
      ctx.setLineDash(isSelected ? [] : [10, 5])

      ctx.beginPath()
      route.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      })
      ctx.stroke()
      ctx.setLineDash([])

      if (isSelected) {
        route.points.forEach((point, index) => {
          const pulseSize = 5 + Math.sin(Date.now() / 300 + index) * 2
          ctx.fillStyle = route.color
          ctx.beginPath()
          ctx.arc(point.x, point.y, pulseSize, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 2
          ctx.stroke()
        })
      }
    })

    if (routeStart) {
      ctx.fillStyle = '#2ed573'
      ctx.beginPath()
      ctx.arc(routeStart.x, routeStart.y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    if (routeEnd) {
      ctx.fillStyle = '#e94560'
      ctx.beginPath()
      ctx.arc(routeEnd.x, routeEnd.y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    sensorList.forEach(sensor => {
      const isSelected = mapState.selectedPoint && 
        Math.abs(mapState.selectedPoint.x - sensor.x) < 20 &&
        Math.abs(mapState.selectedPoint.y - sensor.y) < 20

      const pulseSize = isSelected ? 14 : 10
      const gradient = ctx.createRadialGradient(
        sensor.x, sensor.y, 0,
        sensor.x, sensor.y, pulseSize * 2
      )
      gradient.addColorStop(0, 'rgba(0, 217, 255, 0.4)')
      gradient.addColorStop(1, 'rgba(0, 217, 255, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(sensor.x, sensor.y, pulseSize * 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = sensor.isVirtual ? '#ffd700' : '#00d9ff'
      ctx.beginPath()
      ctx.arc(sensor.x, sensor.y, pulseSize, 0, Math.PI * 2)
      ctx.fill()

      if (isSelected) {
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    })

    ctx.restore()
  }, [sensorList, mapState, routes, selectedRouteId, routeStart, routeEnd, interpolateTemperature])

  useEffect(() => {
    const animate = () => {
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
        if (!routeStart) {
          setRouteStart(point)
        } else if (!routeEnd) {
          setRouteEnd(point)
          calculateRoutes(routeStart, point)
        }
      } else if (showAddSensor) {
        const point = screenToMap(e.clientX, e.clientY)
        if (point.x >= 0 && point.x <= MAP_WIDTH && point.y >= 0 && point.y <= MAP_HEIGHT) {
          setPendingSensorPos(point)
        }
      } else {
        setIsDragging(true)
        setDragStart({ x: e.clientX - mapState.offsetX, y: e.clientY - mapState.offsetY })
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setMapState({
        offsetX: e.clientX - dragStart.x,
        offsetY: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return
    if (isPlanningRoute || showAddSensor) return

    const point = screenToMap(e.clientX, e.clientY)

    let nearestSensor: SensorData | null = null
    let minDist = Infinity
    for (const sensor of sensorList) {
      const dist = Math.sqrt((sensor.x - point.x) ** 2 + (sensor.y - point.y) ** 2)
      if (dist < 30 && dist < minDist) {
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
      const temp = interpolateTemperature(point.x, point.y)
      setPopupInfo({
        x: e.clientX,
        y: e.clientY,
        data: {
          name: '当前位置',
          temperature: temp.toFixed(1),
          humidity: '60',
        },
      })
      setSelectedSensor(null)
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
      }}
      className="climate-map"
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setShowAddSensor(!showAddSensor)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: showAddSensor ? '#00d9ff' : '#0f3460',
          color: '#fff',
          fontSize: 20,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
        title="添加虚拟传感器"
      >
        +
      </button>
      <button
        onClick={() => setIsPlanningRoute(!isPlanningRoute)}
        style={{
          height: 36,
          padding: '0 12px',
          borderRadius: 8,
          background: isPlanningRoute ? '#e94560' : '#0f3460',
          color: '#fff',
          fontSize: 13,
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        {isPlanningRoute ? '取消规划' : '规划路线'}
      </button>
    </div>

    <div style={{
      position: 'absolute',
      top: 16,
      right: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
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
        background: 'rgba(15, 52, 96, 0.9)',
        padding: '10px 20px',
        borderRadius: 8,
        fontSize: 13,
        color: '#fff',
      }}>
        {!routeStart && '点击地图设置起点'}
        {routeStart && !routeEnd && '点击地图设置终点'}
        {routeStart && routeEnd && '已规划完成，可在右侧查看路线详情'}
      </div>
    )}

    {showAddSensor && pendingSensorPos && (
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(22, 33, 62, 0.95)',
        padding: 16,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 200,
      }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>设置温度范围 (°C)</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="number"
            value={virtualRange[0]}
            onChange={e => setVirtualRange([parseFloat(e.target.value), virtualRange[1]])}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.2)',
              background: '#1a1a2e',
              color: '#fff',
              fontSize: 13,
            }}
          />
          <span style={{ color: '#a0aec0' }}>~</span>
          <input
            type="number"
            value={virtualRange[1]}
            onChange={e => setVirtualRange([virtualRange[0], parseFloat(e.target.value)])}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.2)',
              background: '#1a1a2e',
              color: '#fff',
              fontSize: 13,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleAddVirtualSensor}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              background: '#00d9ff',
              color: '#0f3460',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            确认添加
          </button>
          <button
            onClick={() => { setShowAddSensor(false); setPendingSensorPos(null) }}
            style={{
              flex: 1,
              padding: '8px 12px',
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
        width: 180,
      }}>
        {routes.map(route => (
          <div
            key={route.id}
            onClick={() => setSelectedRoute(route.id)}
            style={{
              background: selectedRouteId === route.id ? 'rgba(0, 217, 255, 0.2)' : 'rgba(15, 52, 96, 0.9)',
              padding: 10,
              borderRadius: 6,
              cursor: 'pointer',
              border: `1px solid ${selectedRouteId === route.id ? route.color : 'transparent'}`,
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 12, height: 2, background: route.color }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{route.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a0aec0' }}>
              <span>耗时 {route.duration} 分钟</span>
              <span style={{ color: '#2ed573' }}>舒适度 {route.comfortIndex}%</span>
            </div>
          </div>
        ))}
      </div>
    )}

    {popupInfo && (
      <div
        style={{
          position: 'absolute',
          left: popupInfo.x - (containerRef.current?.getBoundingClientRect().left || 0) + 10,
          top: popupInfo.y - (containerRef.current?.getBoundingClientRect().top || 0) + 10,
          background: 'rgba(22, 33, 62, 0.95)',
          padding: 12,
          borderRadius: 8,
          border: '1px solid rgba(0, 217, 255, 0.3)',
          minWidth: 160,
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
          {popupInfo.data.name}
        </div>
        {popupInfo.data.temperature && (
          <div style={{ fontSize: 12, color: '#a0aec0', marginBottom: 4 }}>
            温度: <span style={{ color: '#e94560', fontWeight: 500 }}>{popupInfo.data.temperature}°C</span>
          </div>
        )}
        {popupInfo.data.humidity && (
          <div style={{ fontSize: 12, color: '#a0aec0' }}>
            湿度: <span style={{ color: '#00d9ff', fontWeight: 500 }}>{popupInfo.data.humidity}%</span>
          </div>
        )}
        {popupInfo.data.value && popupInfo.data.unit && (
          <div style={{ fontSize: 12, color: '#a0aec0' }}>
            数值: <span style={{ color: '#00d9ff', fontWeight: 500 }}>{popupInfo.data.value.toFixed(1)} {popupInfo.data.unit}</span>
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
      gap: 8,
      fontSize: 11,
      color: '#a0aec0',
      background: 'rgba(15, 52, 96, 0.8)',
      padding: '6px 10px',
      borderRadius: 6,
    }}>
      <span>温度热力图</span>
      <div style={{
        width: 60,
        height: 8,
        background: 'linear-gradient(to right, #1e90ff, #ff6347)',
        borderRadius: 4,
      }} />
      <span>低→高</span>
    </div>
  </div>
  )
}

export default ClimateMap
