import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initDB } from '@/plantManager/core/careLogService'
import { getAllPlants } from '@/plantManager/core/careLogService'
import type { Plant } from '@/plantManager/core/plantModel'
import './styles/global.css'

const ORIGINAL_TITLE = document.title
const BLINK_INTERVAL = 2000
const CHECK_INTERVAL = 60 * 60 * 1000

let blinkTimer: number | null = null
let checkTimer: number | null = null
let isShowingReminder = false

function calculateOverduePlants(plants: Plant[]): Plant[] {
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

function updateTitleBlink(count: number) {
  if (blinkTimer) {
    clearInterval(blinkTimer)
    blinkTimer = null
  }

  if (count <= 0) {
    document.title = ORIGINAL_TITLE
    isShowingReminder = false
    return
  }

  const reminderText = `${count}盆植物需要照料`
  isShowingReminder = true

  blinkTimer = window.setInterval(() => {
    if (isShowingReminder) {
      document.title = ORIGINAL_TITLE
    } else {
      document.title = reminderText
    }
    isShowingReminder = !isShowingReminder
  }, BLINK_INTERVAL)
}

async function checkReminders() {
  try {
    const plants = await getAllPlants()
    const overduePlants = calculateOverduePlants(plants)
    updateTitleBlink(overduePlants.length)
  } catch (error) {
    console.error('检查植物提醒失败:', error)
  }
}

function startReminderCheck() {
  checkReminders()
  checkTimer = window.setInterval(checkReminders, CHECK_INTERVAL)
}

function stopReminderCheck() {
  if (checkTimer) {
    clearInterval(checkTimer)
    checkTimer = null
  }
  if (blinkTimer) {
    clearInterval(blinkTimer)
    blinkTimer = null
  }
  document.title = ORIGINAL_TITLE
}

function Root() {
  const [dbReady, setDbReady] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        await initDB()
        setDbReady(true)
        startReminderCheck()
      } catch (error) {
        console.error('数据库初始化失败:', error)
        setDbError(error instanceof Error ? error.message : '未知错误')
      }
    }

    init()

    return () => {
      stopReminderCheck()
    }
  }, [])

  if (dbError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">数据库初始化失败</div>
          <div className="text-gray-500">{dbError}</div>
        </div>
      </div>
    )
  }

  if (!dbReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
