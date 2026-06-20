import { create } from 'zustand'
import { Caravan, Horse, Traveler, LogEntry, BeaconState, HourlyStats, Cargo } from '../types'

interface StationState {
  caravans: Caravan[]
  horses: Horse[]
  travelers: Traveler[]
  logs: LogEntry[]
  score: number
  caravanCount: number
  horseChangeCount: number
  beaconState: BeaconState
  hourlyStats: HourlyStats[]
  selectedHorseId: string | null
  selectedTravelerId: string | null
  activeDocumentCaravanId: string | null
  showDispatchPanel: boolean
  setShowDispatchPanel: (show: boolean) => void
  setActiveDocumentCaravanId: (id: string | null) => void
  setSelectedHorseId: (id: string | null) => void
  setSelectedTravelerId: (id: string | null) => void
  addCaravan: (caravan: Caravan) => void
  updateCaravan: (id: string, updates: Partial<Caravan>) => void
  removeCaravan: (id: string) => void
  addLog: (log: Omit<LogEntry, 'id' | 'time'>) => void
  setHorses: (horses: Horse[]) => void
  updateHorse: (id: string, updates: Partial<Horse>) => void
  setTravelers: (travelers: Traveler[]) => void
  addTraveler: (traveler: Traveler) => void
  updateTraveler: (id: string, updates: Partial<Traveler>) => void
  removeTraveler: (id: string) => void
  deductScore: (points: number) => void
  incrementCaravanCount: () => void
  incrementHorseChangeCount: () => void
  setBeaconState: (state: Partial<BeaconState>) => void
  addHourlyStat: (hour: number) => void
  markCargoError: (caravanId: string, cargoName: string) => void
  unmarkCargoError: (caravanId: string, cargoName: string) => void
  verifyCaravan: (caravanId: string) => { success: boolean; missedErrors: string[] }
}

export const useStationStore = create<StationState>((set, get) => ({
  caravans: [],
  horses: [],
  travelers: [],
  logs: [],
  score: 100,
  caravanCount: 0,
  horseChangeCount: 0,
  beaconState: { level: 0, startTime: null, reason: '' },
  hourlyStats: [],
  selectedHorseId: null,
  selectedTravelerId: null,
  activeDocumentCaravanId: null,
  showDispatchPanel: false,

  setShowDispatchPanel: (show) => set({ showDispatchPanel: show }),
  setActiveDocumentCaravanId: (id) => set({ activeDocumentCaravanId: id }),
  setSelectedHorseId: (id) => set({ selectedHorseId: id }),
  setSelectedTravelerId: (id) => set({ selectedTravelerId: id }),

  addCaravan: (caravan) => set((state) => ({ caravans: [...state.caravans, caravan] })),
  updateCaravan: (id, updates) => set((state) => ({
    caravans: state.caravans.map((c) => (c.id === id ? { ...c, ...updates } : c))
  })),
  removeCaravan: (id) => set((state) => ({
    caravans: state.caravans.filter((c) => c.id !== id)
  })),

  addLog: (log) => set((state) => ({
    logs: [{ ...log, id: Date.now().toString(), time: new Date().toISOString() }, ...state.logs].slice(0, 100)
  })),

  setHorses: (horses) => set({ horses }),
  updateHorse: (id, updates) => set((state) => ({
    horses: state.horses.map((h) => (h.id === id ? { ...h, ...updates } : h))
  })),

  setTravelers: (travelers) => set({ travelers }),
  addTraveler: (traveler) => set((state) => ({ travelers: [...state.travelers, traveler] })),
  updateTraveler: (id, updates) => set((state) => ({
    travelers: state.travelers.map((t) => (t.id === id ? { ...t, ...updates } : t))
  })),
  removeTraveler: (id) => set((state) => ({
    travelers: state.travelers.filter((t) => t.id !== id)
  })),

  deductScore: (points) => set((state) => ({ score: Math.max(0, state.score - points) })),
  incrementCaravanCount: () => set((state) => ({ caravanCount: state.caravanCount + 1 })),
  incrementHorseChangeCount: () => set((state) => ({ horseChangeCount: state.horseChangeCount + 1 })),

  setBeaconState: (state) => set((prev) => ({ beaconState: { ...prev.beaconState, ...state } })),

  addHourlyStat: (hour) => set((state) => {
    const existing = state.hourlyStats.find((s) => s.hour === hour)
    if (existing) {
      return {
        hourlyStats: state.hourlyStats.map((s) =>
          s.hour === hour ? { ...s, count: s.count + 1 } : s
        )
      }
    }
    const newStats = [...state.hourlyStats, { hour, count: 1 }]
    const now = new Date()
    const currentHour = now.getHours()
    const sixHoursAgo = (currentHour - 6 + 24) % 24
    return {
      hourlyStats: newStats.filter((s) => {
        if (currentHour >= 6) {
          return s.hour > sixHoursAgo && s.hour <= currentHour
        } else {
          return s.hour > sixHoursAgo || s.hour <= currentHour
        }
      }).slice(-6)
    }
  }),

  markCargoError: (caravanId, cargoName) => set((state) => ({
    caravans: state.caravans.map((c) =>
      c.id === caravanId
        ? { ...c, markedErrors: [...c.markedErrors, cargoName] }
        : c
    )
  })),

  unmarkCargoError: (caravanId, cargoName) => set((state) => ({
    caravans: state.caravans.map((c) =>
      c.id === caravanId
        ? { ...c, markedErrors: c.markedErrors.filter((e) => e !== cargoName) }
        : c
    )
  })),

  verifyCaravan: (caravanId) => {
    const state = get()
    const caravan = state.caravans.find((c) => c.id === caravanId)
    if (!caravan) return { success: false, missedErrors: [] }

    const actualErrors = caravan.cargo.filter((c) => c.hasError).map((c) => c.name)
    const missedErrors = actualErrors.filter((e) => !caravan.markedErrors.includes(e))
    const falseMarked = caravan.markedErrors.filter((e) => !actualErrors.includes(e))

    if (missedErrors.length > 0 || falseMarked.length > 0) {
      get().deductScore(15)
      get().addLog({
        type: 'error',
        message: `文牒核验失败！${caravan.ownerName}的驼队核验错误，扣15分。漏检: ${missedErrors.join(', ')}，误判: ${falseMarked.join(', ')}`,
        level: 'error'
      })
      return { success: false, missedErrors: [...missedErrors, ...falseMarked] }
    }

    get().addLog({
      type: 'verification',
      message: `文牒核验通过！${caravan.ownerName}的驼队已签押放行。`,
      level: 'info'
    })
    return { success: true, missedErrors: [] }
  }
}))

export const generateCaravan = (): Caravan => {
  const surnames = ['康', '安', '曹', '石', '米', '何', '史', '穆']
  const givenNames = ['萨保', '禄山', '悉诺', '牟尼', '伽蓝', '难陀', '般若', '崛多']
  const origins = ['撒马尔罕', '布哈拉', '塔什干', '大食', '波斯', '天竺', '拂菻', '龟兹']
  const cargoTypes = [
    { name: '安息香', base: 50 },
    { name: '蓝宝石', base: 10 },
    { name: '和田玉', base: 20 },
    { name: '珊瑚', base: 30 },
    { name: '象牙', base: 15 },
    { name: '骆驼毛', base: 100 },
    { name: '琉璃器', base: 25 },
    { name: '丁香', base: 40 },
    { name: '豆蔻', base: 35 },
    { name: '乳香', base: 45 }
  ]

  const surname = surnames[Math.floor(Math.random() * surnames.length)]
  const givenName = givenNames[Math.floor(Math.random() * givenNames.length)]
  const origin = origins[Math.floor(Math.random() * origins.length)]

  const cargoCount = Math.floor(Math.random() * 3) + 4
  const shuffled = [...cargoTypes].sort(() => Math.random() - 0.5)
  const selectedCargo = shuffled.slice(0, cargoCount)

  const cargo: Cargo[] = selectedCargo.map((c) => {
    const declared = Math.floor(Math.random() * c.base) + c.base / 2
    const hasError = Math.random() < 0.3
    const actual = hasError
      ? declared + (Math.random() > 0.5 ? 1 : -1) * Math.ceil(declared * 0.2)
      : declared
    return {
      name: c.name,
      declared: Math.floor(declared),
      actual: Math.floor(actual),
      hasError
    }
  })

  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    ownerName: `${surname}${givenName}`,
    origin,
    cargoCount: Math.floor(Math.random() * 11) + 5,
    passengerCount: Math.floor(Math.random() * 5) + 1,
    horseCount: Math.floor(Math.random() * 3) + 1,
    cargo,
    status: 'approaching',
    position: -20,
    markedErrors: []
  }
}

export const generateTraveler = (existingRoomNumbers: (number | null)[]): Traveler => {
  const names = ['李白', '杜甫', '王维', '岑参', '高适', '王昌龄', '张巡', '郭子仪', '李光弼', '李泌']
  const types: Array<'scholar' | 'soldier' | 'messenger' | 'merchant'> = ['scholar', 'soldier', 'messenger', 'merchant']
  
  const occupiedRooms = new Set(existingRoomNumbers.filter((n): n is number => n !== null))
  let roomNumber = null
  for (let i = 1; i <= 20; i++) {
    if (!occupiedRooms.has(i)) {
      roomNumber = i
      break
    }
  }
  
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: names[Math.floor(Math.random() * names.length)],
    type: types[Math.floor(Math.random() * types.length)],
    roomNumber,
    checkInTime: Date.now()
  }
}
