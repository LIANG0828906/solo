import { v4 as uuidv4 } from 'uuid'
import { saveAs } from 'file-saver'

export type MaterialType = 'gaoliang' | 'xiaomi' | 'nuomi'

export const materialNames: Record<MaterialType, string> = {
  gaoliang: '高粱',
  xiaomi: '小米',
  nuomi: '糯米',
}

export interface FermentationVat {
  id: string
  material: MaterialType
  progress: number
  lastStirTime: number
  startTime: number
  stirHistory: number[]
}

export interface FinishedJar {
  id: string
  jarNumber: string
  material: MaterialType
  initialAcidity: number
  agingDays: number
  openDate: string
  completedAt: number
}

export interface BrewingLog {
  id: string
  material: MaterialType
  startTime: number
  stirTimes: number[]
  finalAcidity: number
  completedAt: number
  jarNumber: string
}

const VATS_KEY = 'brewing_vats'
const JARS_KEY = 'brewing_jars'
const LOGS_KEY = 'brewing_logs'
const JAR_COUNTER_KEY = 'jar_counter'

export const loadVats = (): FermentationVat[] => {
  try {
    const data = localStorage.getItem(VATS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const saveVats = (vats: FermentationVat[]) => {
  localStorage.setItem(VATS_KEY, JSON.stringify(vats))
}

export const loadJars = (): FinishedJar[] => {
  try {
    const data = localStorage.getItem(JARS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const saveJars = (jars: FinishedJar[]) => {
  localStorage.setItem(JARS_KEY, JSON.stringify(jars))
}

export const loadLogs = (): BrewingLog[] => {
  try {
    const data = localStorage.getItem(LOGS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const saveLogs = (logs: BrewingLog[]) => {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
}

const getNextJarNumber = (): string => {
  const counter = parseInt(localStorage.getItem(JAR_COUNTER_KEY) || '0', 10) + 1
  localStorage.setItem(JAR_COUNTER_KEY, counter.toString())
  return `醋坛第${counter.toString().padStart(3, '0')}号`
}

export const createVat = (material: MaterialType): FermentationVat => {
  const now = Date.now()
  return {
    id: uuidv4(),
    material,
    progress: 0,
    lastStirTime: now,
    startTime: now,
    stirHistory: [],
  }
}

export const calculateStirProgress = (): number => {
  return Math.floor(Math.random() * 3) + 3
}

export const stirVat = (vat: FermentationVat): FermentationVat => {
  const now = Date.now()
  const increase = calculateStirProgress()
  const newProgress = Math.min(100, vat.progress + increase)
  return {
    ...vat,
    progress: newProgress,
    lastStirTime: now,
    stirHistory: [...vat.stirHistory, now],
  }
}

export const calculateDecay = (vat: FermentationVat): number => {
  const now = Date.now()
  const hoursSinceStir = (now - vat.lastStirTime) / (1000 * 60 * 60)
  if (hoursSinceStir > 12) {
    const daysOverdue = (hoursSinceStir - 12) / 24
    return Math.floor(daysOverdue) * 10
  }
  return 0
}

export const updateVatProgress = (vat: FermentationVat): FermentationVat => {
  const decay = calculateDecay(vat)
  const newProgress = Math.max(0, vat.progress - decay)
  return {
    ...vat,
    progress: newProgress,
  }
}

export const isVatComplete = (vat: FermentationVat): boolean => {
  return vat.progress >= 100
}

export const convertToJar = (vat: FermentationVat): { jar: FinishedJar; log: BrewingLog } => {
  const now = Date.now()
  const jarNumber = getNextJarNumber()
  const finalAcidity = 3.5 + Math.random() * 2.5
  const agingDays = Math.floor(Math.random() * 30) + 15
  const openDate = new Date(now + agingDays * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')

  const jar: FinishedJar = {
    id: uuidv4(),
    jarNumber,
    material: vat.material,
    initialAcidity: parseFloat(finalAcidity.toFixed(1)),
    agingDays,
    openDate,
    completedAt: now,
  }

  const log: BrewingLog = {
    id: uuidv4(),
    material: vat.material,
    startTime: vat.startTime,
    stirTimes: vat.stirHistory,
    finalAcidity: parseFloat(finalAcidity.toFixed(1)),
    completedAt: now,
    jarNumber,
  }

  return { jar, log }
}

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export const generateVinegarSticker = async (jar: FinishedJar): Promise<Blob> => {
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 600
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  ctx.fillStyle = '#faf0e0'
  ctx.fillRect(0, 0, 400, 600)

  for (let i = 0; i < 1000; i++) {
    const x = Math.random() * 400
    const y = Math.random() * 600
    const alpha = Math.random() * 0.08
    ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`
    ctx.fillRect(x, y, 1, 1)
  }

  const borderWidth = 15
  const innerWidth = 400 - borderWidth * 2
  const innerHeight = 600 - borderWidth * 2

  ctx.strokeStyle = '#8b4513'
  ctx.lineWidth = 3
  ctx.strokeRect(borderWidth, borderWidth, innerWidth, innerHeight)

  ctx.lineWidth = 1
  ctx.strokeRect(borderWidth + 5, borderWidth + 5, innerWidth - 10, innerHeight - 10)

  ctx.strokeStyle = '#8b4513'
  ctx.lineWidth = 2

  const drawCloud = (x: number, y: number, size: number) => {
    ctx.beginPath()
    ctx.arc(x, y, size * 0.3, 0, Math.PI * 2)
    ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.25, 0, Math.PI * 2)
    ctx.arc(x + size * 0.5, y, size * 0.3, 0, Math.PI * 2)
    ctx.arc(x + size * 0.25, y + size * 0.1, size * 0.2, 0, Math.PI * 2)
    ctx.stroke()
  }

  drawCloud(borderWidth + 10, borderWidth + 10, 25)
  drawCloud(400 - borderWidth - 35, borderWidth + 10, 25)
  drawCloud(borderWidth + 10, 600 - borderWidth - 35, 25)
  drawCloud(400 - borderWidth - 35, 600 - borderWidth - 35, 25)

  ctx.fillStyle = '#5d4037'
  ctx.font = '42px "Liu Jian Mao Cao", cursive'
  ctx.textAlign = 'center'
  ctx.fillText('古 法 酿 醋', 200, 100)

  ctx.font = '36px "Liu Jian Mao Cao", cursive'
  ctx.fillStyle = '#8b4513'
  ctx.fillText(jar.jarNumber, 200, 180)

  ctx.fillStyle = '#5d4037'
  ctx.font = '24px "SimSun", serif'
  ctx.fillText(`原 料：${materialNames[jar.material]}`, 200, 260)
  ctx.fillText(`酸 度：${jar.initialAcidity.toFixed(1)}°`, 200, 310)
  ctx.fillText(`陈 酿：${jar.agingDays} 天`, 200, 360)

  ctx.font = '20px "SimSun", serif'
  ctx.fillStyle = '#8b4513'
  ctx.fillText('开 坛 日 期', 200, 440)
  ctx.font = '26px "Liu Jian Mao Cao", cursive'
  ctx.fillText(jar.openDate, 200, 485)

  ctx.fillStyle = '#5d4037'
  ctx.font = '18px "SimSun", serif'
  ctx.fillText('北魏太和年间酿', 200, 555)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
    }, 'image/png')
  })
}

export const downloadSticker = async (jar: FinishedJar) => {
  const blob = await generateVinegarSticker(jar)
  saveAs(blob, `${jar.jarNumber}.png`)
}
