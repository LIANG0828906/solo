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

  const checkReminders = async () => {
    try {
      const plants = await getAllPlants()
      const overduePlants = calculateOverduePlants(plants)
      const count = overduePlants.length
      setOverdueCount(count)
      updateTitleBlink(count)
    } catch (error) {
      console.error('检查植物提醒失败:', error)
    }
  }

  const updateTitleBlink = (count: number) => {
    if (blinkTimerRef.current) {
      clearInterval(blinkTimerRef.current)
      blinkTimerRef.current = null
    }

    if (count <= 0) {
      document.title = ORIGINAL_TITLE
      isShowingReminderRef.current = false
      return
    }

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

  const startChecking = () => {
    checkReminders()
    checkTimerRef.current = window.setInterval(checkReminders, CHECK_INTERVAL)
  }

  const stopChecking = () => {
    if (checkTimerRef.current) {
      clearInterval(checkTimerRef.current)
      checkTimerRef.current = null
    }
    if (blinkTimerRef.current) {
      clearInterval(blinkTimerRef.current)
      blinkTimerRef.current = null
    }
    document.title = ORIGINAL_TITLE
  }

  useEffect(() => {
    return () => {
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
