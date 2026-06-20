import { create } from 'zustand'
import type { SensorData, SensorHistory, MapState, Route, MapPoint, RealtimeDataItem, RoutePoint } from '../types'
import { v4 as uuidv4 } from 'uuid'

interface ClimateStore {
  sensorList: SensorData[]
  sensorHistoryMap: Record<string, SensorHistory>
  mapState: MapState
  routes: Route[]
  selectedRouteId: string | null
  selectedSensorId: string | null
  realtimeData: RealtimeDataItem[]
  timeRange: '1h' | '6h' | '24h' | '7d'
  aqiValue: number
  isPlanningRoute: boolean
  routeStart: MapPoint | null
  routeEnd: MapPoint | null

  updateSensorData: (sensorId: string, data: Partial<SensorData>) => void
  addVirtualSensor: (x: number, y: number, range: [number, number]) => void
  calculateRoutes: (start: MapPoint, end: MapPoint) => void
  setSelectedSensor: (id: string | null) => void
  setMapState: (state: Partial<MapState>) => void
  setTimeRange: (range: '1h' | '6h' | '24h' | '7d') => void
  setSelectedRoute: (id: string | null) => void
  setIsPlanningRoute: (planning: boolean) => void
  setRouteStart: (point: MapPoint | null) => void
  setRouteEnd: (point: MapPoint | null) => void
  addRealtimeData: (item: RealtimeDataItem) => void
  fetchSensorHistory: (sensorId: string, range: string) => void
  loadInitialData: () => void
}

const generateMockSensors = (): SensorData[] => {
  const types: Array<{ type: SensorData['type']; unit: string; baseValue: number }> = [
    { type: 'temperature', unit: '°C', baseValue: 25 },
    { type: 'humidity', unit: '%', baseValue: 60 },
    { type: 'wind', unit: 'm/s', baseValue: 3 },
    { type: 'light', unit: 'lux', baseValue: 5000 },
    { type: 'pm25', unit: 'μg/m³', baseValue: 35 },
  ]

  const names = ['北门传感器', '中央花园', '东区别墅', '西区公园', '南区广场', '健身区域', '儿童乐园', '停车场入口']
  const positions = [
    { x: 150, y: 120 },
    { x: 400, y: 250 },
    { x: 650, y: 150 },
    { x: 180, y: 400 },
    { x: 500, y: 380 },
    { x: 700, y: 450 },
    { x: 300, y: 500 },
    { x: 550, y: 200 },
  ]

  return names.map((name, i) => {
    const typeInfo = types[i % types.length]
    return {
      id: uuidv4(),
      name,
      type: typeInfo.type,
      value: typeInfo.baseValue + (Math.random() - 0.5) * 10,
      unit: typeInfo.unit,
      status: Math.random() > 0.1 ? 'online' : 'warning',
      x: positions[i].x,
      y: positions[i].y,
      lastUpdate: new Date().toISOString(),
    }
  })
}

const generateMockHistory = (sensorId: string, range: string): SensorHistory => {
  const points = range === '7d' ? 168 : range === '24h' ? 24 : range === '6h' ? 12 : 6
  const data = []
  const now = Date.now()
  const interval = range === '7d' ? 3600000 : range === '24h' ? 3600000 : range === '6h' ? 1800000 : 600000

  for (let i = points; i >= 0; i--) {
    data.push({
      timestamp: new Date(now - i * interval).toISOString(),
      value: 20 + Math.random() * 15 + Math.sin(i / 3) * 3,
    })
  }

  return { sensorId, data }
}

export const useClimateStore = create<ClimateStore>((set, get) => ({
  sensorList: generateMockSensors(),
  sensorHistoryMap: {},
  mapState: {
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    selectedPoint: null,
    showPopup: false,
    popupData: null,
  },
  routes: [],
  selectedRouteId: null,
  selectedSensorId: null,
  realtimeData: [],
  timeRange: '24h',
  aqiValue: 72,
  isPlanningRoute: false,
  routeStart: null,
  routeEnd: null,

  updateSensorData: (sensorId, data) => {
    set(state => ({
      sensorList: state.sensorList.map(s =>
        s.id === sensorId ? { ...s, ...data, lastUpdate: new Date().toISOString() } : s
      ),
    }))
  },

  addVirtualSensor: (x, y, range) => {
    const newSensor: SensorData = {
      id: uuidv4(),
      name: `虚拟传感器_${Math.floor(Math.random() * 1000)}`,
      type: 'temperature',
      value: (range[0] + range[1]) / 2,
      unit: '°C',
      status: 'online',
      x,
      y,
      lastUpdate: new Date().toISOString(),
      isVirtual: true,
      virtualRange: range,
    }
    set(state => ({ sensorList: [...state.sensorList, newSensor] }))

    let value = newSensor.value
    const targetValue = range[0] + Math.random() * (range[1] - range[0])
    const steps = 30
    const stepValue = (targetValue - value) / steps
    let step = 0

    const animate = () => {
      if (step >= steps) return
      value += stepValue
      set(state => ({
        sensorList: state.sensorList.map(s =>
          s.id === newSensor.id ? { ...s, value: parseFloat(value.toFixed(1)), lastUpdate: new Date().toISOString() } : s
        ),
      }))
      step++
      setTimeout(animate, 100)
    }
    setTimeout(animate, 100)
  },

  calculateRoutes: (start, end) => {
    const routes: Route[] = [
      {
        id: uuidv4(),
        type: 'shortest',
        name: '最短路线',
        color: '#3498db',
        points: generateRoutePoints(start, end, 'shortest'),
        duration: 15,
        comfortIndex: 65,
      },
      {
        id: uuidv4(),
        type: 'coolest',
        name: '最凉爽路线',
        color: '#00d9ff',
        points: generateRoutePoints(start, end, 'coolest'),
        duration: 22,
        comfortIndex: 88,
      },
      {
        id: uuidv4(),
        type: 'comfortable',
        name: '最舒适路线',
        color: '#ffd700',
        points: generateRoutePoints(start, end, 'comfortable'),
        duration: 18,
        comfortIndex: 92,
      },
    ]
    set({ routes, selectedRouteId: routes[0].id })
  },

  setSelectedSensor: (id) => set({ selectedSensorId: id }),

  setMapState: (state) => set(prev => ({
    mapState: { ...prev.mapState, ...state },
  })),

  setTimeRange: (range) => {
    set({ timeRange: range })
    const { sensorList, fetchSensorHistory } = get()
    sensorList.forEach(s => fetchSensorHistory(s.id, range))
  },

  setSelectedRoute: (id) => set({ selectedRouteId: id }),

  setIsPlanningRoute: (planning) => {
    if (!planning) {
      set({ isPlanningRoute: false, routeStart: null, routeEnd: null, routes: [] })
    } else {
      set({ isPlanningRoute: true })
    }
  },

  setRouteStart: (point) => set({ routeStart: point }),
  setRouteEnd: (point) => set({ routeEnd: point }),

  addRealtimeData: (item) => {
    set(state => ({
      realtimeData: [item, ...state.realtimeData].slice(0, 50),
    }))
  },

  fetchSensorHistory: (sensorId, range) => {
    const history = generateMockHistory(sensorId, range)
    set(state => ({
      sensorHistoryMap: { ...state.sensorHistoryMap, [sensorId]: history },
    }))
  },

  loadInitialData: () => {
    const { sensorList, fetchSensorHistory, timeRange } = get()
    sensorList.forEach(s => fetchSensorHistory(s.id, timeRange))
  },
}))

function generateRoutePoints(start: MapPoint, end: MapPoint, type: string): RoutePoint[] {
  const points: RoutePoint[] = [{ ...start, index: 0 }]
  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2

  if (type === 'shortest') {
    points.push({ x: midX, y: midY, index: 1 })
  } else if (type === 'coolest') {
    points.push({ x: midX - 50, y: midY + 30, index: 1 })
    points.push({ x: midX + 20, y: midY + 60, index: 2 })
  } else {
    points.push({ x: midX + 30, y: midY - 20, index: 1 })
    points.push({ x: midX + 10, y: midY + 40, index: 2 })
  }

  points.push({ ...end, index: points.length })
  return points
}
