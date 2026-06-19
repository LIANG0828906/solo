import type { EnergyPoint } from '@/utils/store'
import { useAppStore } from '@/utils/store'
import { eventBus } from '@/utils/eventBus'

export interface ChartDataPoint {
  time: number
  energy: number
  isPeak: boolean
}

export function getEnergyColor(energy: number, minEnergy: number, maxEnergy: number): string {
  if (maxEnergy === minEnergy) return '#00B4D8'

  const normalized = Math.max(0, Math.min(1, (energy - minEnergy) / (maxEnergy - minEnergy)))

  const r = Math.round(0 + (255 - 0) * normalized)
  const g = Math.round(180 + (107 - 180) * normalized)
  const b = Math.round(216 + (107 - 216) * normalized)

  return `rgb(${r}, ${g}, ${b})`
}

export function formatTime(seconds: number): string {
  return seconds.toFixed(1) + 's'
}

export function processChartData(points: EnergyPoint[]): ChartDataPoint[] {
  return points.map((p) => ({
    time: Number(p.time.toFixed(2)),
    energy: Number(p.energy.toFixed(2)),
    isPeak: p.isPeak
  }))
}

export function getEnergyRange(points: ChartDataPoint[]): { min: number; max: number } {
  if (points.length === 0) return { min: 0, max: 100 }

  let min = Infinity
  let max = -Infinity

  for (const p of points) {
    if (p.energy < min) min = p.energy
    if (p.energy > max) max = p.energy
  }

  const padding = (max - min) * 0.1 || 10
  return {
    min: Math.floor((min - padding) / 10) * 10,
    max: Math.ceil((max + padding) / 10) * 10
  }
}

export function findPeakPoints(points: ChartDataPoint[]): ChartDataPoint[] {
  const peaks: ChartDataPoint[] = []

  for (let i = 0; i < points.length; i++) {
    if (points[i].isPeak) {
      const existing = peaks.find(
        (p) => Math.abs(p.time - points[i].time) < 0.3
      )
      if (!existing) {
        peaks.push(points[i])
      }
    }
  }

  return peaks
}

export function useEnergyData() {
  return useAppStore((state) => state.energyHistory)
}

export function useChartData(): ChartDataPoint[] {
  const energyHistory = useEnergyData()
  return processChartData(energyHistory)
}

export function initChartEvents(): void {
  eventBus.on('energy:update', () => {})
}

export function getLatestPeakAnimation(points: ChartDataPoint[]) {
  const peaks = findPeakPoints(points)
  if (peaks.length === 0) return null
  return peaks[peaks.length - 1]
}
