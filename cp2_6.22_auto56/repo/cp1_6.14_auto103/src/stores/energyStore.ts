import { defineStore } from 'pinia'
import type { FloorEnergyData, BarClickPayload, FloorTrendData, Direction } from '@/types'
import { DIRECTION_ORDER } from '@/types'

interface EnergyState {
  floorData: FloorEnergyData[][]
  currentDateIndex: number
  selectedFloor: number
  clickedBar: BarClickPayload | null
  floorHeights: number[]
  floorBaseY: number[]
  dates: string[]
}

function generateDates(): string[] {
  const dates: string[] = []
  const today = new Date('2026-06-14')
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function generateFloorConfig(): { heights: number[]; baseY: number[] } {
  const heights: number[] = []
  const baseY: number[] = []
  let currentY = 0

  for (let i = 0; i < 8; i++) {
    let h: number
    if (i === 0) h = 5
    else if (i === 7) h = 4
    else h = 3.5

    heights.push(h)
    baseY.push(currentY)
    currentY += h
  }

  return { heights, baseY }
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export const useEnergyStore = defineStore('energy', {
  state: (): EnergyState => {
    const { heights, baseY } = generateFloorConfig()
    return {
      floorData: [],
      currentDateIndex: 6,
      selectedFloor: 0,
      clickedBar: null,
      floorHeights: heights,
      floorBaseY: baseY,
      dates: generateDates()
    }
  },

  getters: {
    getCurrentFloorData: (state): FloorEnergyData[] => {
      if (state.floorData.length === 0) return []
      return state.floorData[state.currentDateIndex] || []
    },

    getSelectedFloorTrend: (state): FloorTrendData | null => {
      if (state.selectedFloor === 0 || state.floorData.length === 0) {
        return {
          floor: 0,
          data: state.floorData.map((dayData, idx) => {
            const total = dayData.reduce((sum, floor) => {
              return sum + floor.directions.reduce((s, d) => s + d.value, 0)
            }, 0)
            return {
              date: state.dates[idx] || '',
              value: Math.round(total)
            }
          })
        }
      }

      const floorIdx = state.selectedFloor - 1
      return {
        floor: state.selectedFloor,
        data: state.floorData.map((dayData, idx) => {
          const floor = dayData[floorIdx]
          const total = floor?.directions.reduce((s, d) => s + d.value, 0) || 0
          return {
            date: state.dates[idx] || '',
            value: Math.round(total)
          }
        })
      }
    },

    maxEnergyValue(): number {
      let max = 0
      for (const day of this.floorData) {
        for (const floor of day) {
          for (const d of floor.directions) {
            if (d.value > max) max = d.value
          }
        }
      }
      return max || 800
    }
  },

  actions: {
    generateMockData() {
      const allData: FloorEnergyData[][] = []
      const baseValues: Record<Direction, number> = {
        north: 350,
        south: 550,
        east: 420,
        west: 480
      }

      for (let day = 0; day < 7; day++) {
        const random = seededRandom(day * 1000 + 42)
        const dayData: FloorEnergyData[] = []

        for (let f = 0; f < 8; f++) {
          const directions = DIRECTION_ORDER.map((dir) => {
            const base = baseValues[dir]
            const floorFactor = 1 + f * 0.04
            const dayFactor = 0.8 + random() * 0.4
            const dirFactor = 0.9 + random() * 0.2
            const value = Math.round(base * floorFactor * dayFactor * dirFactor)
            const changePercent = Math.round((random() - 0.45) * 300) / 10
            return {
              direction: dir,
              value,
              changePercent
            }
          })

          dayData.push({
            floor: f + 1,
            name: `${f + 1}层`,
            height: this.floorHeights[f],
            baseY: this.floorBaseY[f],
            directions
          })
        }

        allData.push(dayData)
      }

      this.floorData = allData
    },

    setCurrentDateIndex(index: number) {
      this.currentDateIndex = Math.max(0, Math.min(6, index))
    },

    setSelectedFloor(floor: number) {
      this.selectedFloor = floor
    },

    setClickedBar(data: BarClickPayload | null) {
      this.clickedBar = data
    }
  }
})
