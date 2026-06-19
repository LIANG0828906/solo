import { useState, useEffect, useMemo } from 'react'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  isWithinInterval,
  format,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { CareLog, Plant } from '@/plantManager/core/plantModel'
import { getPlant } from '@/plantManager/core/careLogService'

interface WateringFrequencyItem {
  week: string
  count: number
}

interface FertilizingTrendItem {
  month: string
  count: number
}

interface LightDistributionItem {
  name: string
  value: number
  color: string
}

interface UseAnalyticsReturn {
  wateringFrequency: WateringFrequencyItem[]
  fertilizingTrend: FertilizingTrendItem[]
  lightDistribution: LightDistributionItem[]
  isLoading: boolean
}

const LIGHT_COLORS = {
  low: '#86efac',
  medium: '#22c55e',
  high: '#15803d',
}

const LIGHT_NAMES = {
  low: '低光照',
  medium: '中光照',
  high: '高光照',
}

export function useAnalytics(plantId: string, logs: CareLog[]): UseAnalyticsReturn {
  const [plant, setPlant] = useState<Plant | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchPlant() {
      setIsLoading(true)
      try {
        const result = await getPlant(plantId)
        if (!cancelled) {
          setPlant(result)
        }
      } catch {
        if (!cancelled) {
          setPlant(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchPlant()

    return () => {
      cancelled = true
    }
  }, [plantId])

  const wateringFrequency = useMemo<WateringFrequencyItem[]>(() => {
    const now = new Date()
    const weeks: WateringFrequencyItem[] = []

    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
      const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
      const weekLabel = format(weekStart, 'MM/dd', { locale: zhCN })

      const count = logs.filter((log) => {
        if (log.type !== 'watering') return false
        const logDate = new Date(log.date)
        return isWithinInterval(logDate, { start: weekStart, end: weekEnd })
      }).length

      weeks.push({ week: weekLabel, count })
    }

    return weeks
  }, [logs])

  const fertilizingTrend = useMemo<FertilizingTrendItem[]>(() => {
    const now = new Date()
    const months: FertilizingTrendItem[] = []

    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd = endOfMonth(subMonths(now, i))
      const monthLabel = format(monthStart, 'yyyy/MM', { locale: zhCN })

      const count = logs.filter((log) => {
        if (log.type !== 'fertilizing') return false
        const logDate = new Date(log.date)
        return isWithinInterval(logDate, { start: monthStart, end: monthEnd })
      }).length

      months.push({ month: monthLabel, count })
    }

    return months
  }, [logs])

  const lightDistribution = useMemo<LightDistributionItem[]>(() => {
    if (!plant) {
      return [
        { name: LIGHT_NAMES.low, value: 0, color: LIGHT_COLORS.low },
        { name: LIGHT_NAMES.medium, value: 0, color: LIGHT_COLORS.medium },
        { name: LIGHT_NAMES.high, value: 0, color: LIGHT_COLORS.high },
      ]
    }

    const lightReq = plant.lightRequirement

    if (lightReq === 'low') {
      return [
        { name: LIGHT_NAMES.low, value: 60, color: LIGHT_COLORS.low },
        { name: LIGHT_NAMES.medium, value: 30, color: LIGHT_COLORS.medium },
        { name: LIGHT_NAMES.high, value: 10, color: LIGHT_COLORS.high },
      ]
    } else if (lightReq === 'medium') {
      return [
        { name: LIGHT_NAMES.low, value: 20, color: LIGHT_COLORS.low },
        { name: LIGHT_NAMES.medium, value: 60, color: LIGHT_COLORS.medium },
        { name: LIGHT_NAMES.high, value: 20, color: LIGHT_COLORS.high },
      ]
    } else {
      return [
        { name: LIGHT_NAMES.low, value: 10, color: LIGHT_COLORS.low },
        { name: LIGHT_NAMES.medium, value: 30, color: LIGHT_COLORS.medium },
        { name: LIGHT_NAMES.high, value: 60, color: LIGHT_COLORS.high },
      ]
    }
  }, [plant])

  return {
    wateringFrequency,
    fertilizingTrend,
    lightDistribution,
    isLoading,
  }
}
