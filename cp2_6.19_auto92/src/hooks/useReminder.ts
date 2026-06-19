import { useEffect, useRef, useState } from 'react'
import { getAllPlants } from '@/plantManager/core/careLogService'
import type { Plant } from '@/plantManager/core/plantModel'

const ORIGINAL_TITLE = document.title
const BLINK_INTERVAL = 2000
const CHECK_INTERVAL = 60 * 60 * 1000

export function calculateOverduePlants(plants: Plant[]): Plant[] {
  const now = new Date()
  return plants.filter((plant) => {
    const wateringOverdue = isOverdue(
      plant.lastWateringDate,
      plant.wateringCycle,
      now
    )
    const fertilizingOverdue = isOverdue(
      plant.lastFertilizingDate,
      plant.fertilizingCycle,
      now
    )
    return wateringOverdue || fertilizingOverdue
  })
}

function isOverdue(
  lastDateStr: string | undefined,
  cycleDays: number,
  now: Date
): boolean {
  if (!lastDateStr || cycleDays <= 0) return false
  const lastDate = new Date(lastDateStr)
  const nextDate = new Date(lastDate.getTime() + cycleDays * 24 * 60 * 60 * 1000)
  return now > nextDate
}

export function useReminder() {
  const [overdueCount, setOverdueCount] = useState(0)
  const blinkTimerRef = useRef<number | null>(null)
  const checkTimerRef = useRef<number | null>(null)
  const isShowingReminderRef = useRef(false)
  const lastOverdueCountRef = useRef(0)

  const stopBlinking = () => {
    if (blinkTimerRef.current) {
      clearInterval(blinkTimerRef.current)
      blinkTimerRef.current = null
    }
    document.title = ORIGINAL_TITLE
    isShowingReminderRef.current = false
  }

  const startBlinking = (count: number) => {
    stopBlinking()
    if (count <= 0) return

    const reminderText = `${count}盆植物需要照料`
    isShowingReminderRef.current = true

    blinkTimerRef.current = window.setInterval(() => {
      if (isShowingReminderRef.current) {
        document.title = ORIGINAL_TITLE
      } else {
        document.title = reminderText
      }
      isShowingReminderRef.current = !isShowingReminderRef.current
    }, BLINK_INTERVAL)
  }

  const checkReminders = async () => {
    try {
      const plants = await getAllPlants()
      const overduePlants = calculateOverduePlants(plants)
      const count = overduePlants.length
      setOverdueCount(count)
      lastOverdueCountRef.current = count
      updateTitleBlink(count)
    } catch (error) {
      console.error('检查植物提醒失败:', error)
    }
  }

  const updateTitleBlink = (count: number) => {
    if (count <= 0) {
      stopBlinking()
      return
    }

    const reminderText = `${count}盆植物需要照料`

    if (document.hidden) {
      startBlinking(count)
    } else {
      stopBlinking()
      document.title = reminderText
    }
  }

  const handleVisibilityChange = () => {
    if (document.hidden) {
      if (lastOverdueCountRef.current > 0) {
        startBlinking(lastOverdueCountRef.current)
      }
    } else {
      stopBlinking()
      if (lastOverdueCountRef.current > 0) {
        const reminderText = `${lastOverdueCountRef.current}盆植物需要照料`
        document.title = reminderText
      }
    }
  }

  const handleWindowBlur = () => {
    if (lastOverdueCountRef.current > 0) {
      startBlinking(lastOverdueCountRef.current)
    }
  }

  const handleWindowFocus = () => {
    stopBlinking()
    if (lastOverdueCountRef.current > 0) {
      const reminderText = `${lastOverdueCountRef.current}盆植物需要照料`
      document.title = reminderText
    }
  }

  const startChecking = () => {
    checkReminders()
    checkTimerRef.current = window.setInterval(checkReminders, CHECK_INTERVAL)
  }

  const stopChecking = () => {
    if (checkTimerRef.current) {
      clearInterval(checkTimerRef.current)
      checkTimerRef.current = null
    }
    stopBlinking()
  }

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
      stopChecking()
    }
  }, [])

  return {
    overdueCount,
    checkReminders,
    startChecking,
    stopChecking,
  }
}
