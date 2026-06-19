import { useMemo } from 'react'
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
import type { CareLog } from '@/plantManager/core/plantModel'

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
    const counts: Record<'low' | 'medium' | 'high', number> = {
      low: 0,
      medium: 0,
      high: 0,
    }

    let total = 0

    for (const log of logs) {
      if (!log.lightLevel) continue
      if (log.lightLevel === 'low' || log.lightLevel === 'medium' || log.lightLevel === 'high') {
        counts[log.lightLevel]++
        total++
      }
    }

    if (total === 0) {
      return [
        { name: LIGHT_NAMES.low, value: 0, color: LIGHT_COLORS.low },
        { name: LIGHT_NAMES.medium, value: 0, color: LIGHT_COLORS.medium },
        { name: LIGHT_NAMES.high, value: 0, color: LIGHT_COLORS.high },
      ]
    }

    return [
      { name: LIGHT_NAMES.low, value: Math.round((counts.low / total) * 100), color: LIGHT_COLORS.low },
      { name: LIGHT_NAMES.medium, value: Math.round((counts.medium / total) * 100), color: LIGHT_COLORS.medium },
      { name: LIGHT_NAMES.high, value: Math.round((counts.high / total) * 100), color: LIGHT_COLORS.high },
    ]
  }, [logs])

  return {
    wateringFrequency,
    fertilizingTrend,
    lightDistribution,
    isLoading: false,
  }
}
