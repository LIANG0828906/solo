import { v4 as uuidv4 } from 'uuid'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getSimulatedWeather } from './weatherService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '..', 'data')
const LETTERS_FILE = path.join(DATA_DIR, 'letters.json')
const RECYCLE_FILE = path.join(DATA_DIR, 'recycle.json')

export interface Letter {
  id: string;
  toEmail: string;
  subject: string;
  content: string;
  sendDate: string;
  mood: 'happy' | 'calm' | 'sad' | 'miss';
  photo?: string;
  weatherEmoji: string;
  createdAt: string;
  status: 'pending' | 'sent' | 'recalled';
}

export interface RecycledLetter extends Letter {
  recalledAt: string;
  deleteAt: string;
}

export interface CreateLetterData {
  toEmail: string;
  subject: string;
  content: string;
  sendDate: string;
  mood: 'happy' | 'calm' | 'sad' | 'miss';
  photo?: string;
}

async function ensureDataFiles(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(LETTERS_FILE)
  } catch {
    await fs.writeFile(LETTERS_FILE, '[]', 'utf-8')
  }
  try {
    await fs.access(RECYCLE_FILE)
  } catch {
    await fs.writeFile(RECYCLE_FILE, '[]', 'utf-8')
  }
}

export async function getAllLetters(): Promise<Letter[]> {
  await ensureDataFiles()
  const data = await fs.readFile(LETTERS_FILE, 'utf-8')
  return JSON.parse(data)
}

export async function getLetterById(id: string): Promise<Letter | undefined> {
  const letters = await getAllLetters()
  return letters.find((l) => l.id === id)
}

export async function createLetter(data: CreateLetterData): Promise<Letter> {
  await ensureDataFiles()
  const letters = await getAllLetters()
  const weather = getSimulatedWeather()
  const letter: Letter = {
    id: uuidv4(),
    toEmail: data.toEmail,
    subject: data.subject,
    content: data.content,
    sendDate: data.sendDate,
    mood: data.mood,
    photo: data.photo,
    weatherEmoji: weather.emoji,
    createdAt: new Date().toISOString(),
    status: 'pending',
  }
  letters.push(letter)
  await fs.writeFile(LETTERS_FILE, JSON.stringify(letters, null, 2), 'utf-8')
  return letter
}

export async function updateLetter(id: string, data: Partial<Letter>): Promise<Letter | null> {
  await ensureDataFiles()
  const letters = await getAllLetters()
  const index = letters.findIndex((l) => l.id === id)
  if (index === -1) return null
  letters[index] = { ...letters[index], ...data, id }
  await fs.writeFile(LETTERS_FILE, JSON.stringify(letters, null, 2), 'utf-8')
  return letters[index]
}

export async function recallLetter(id: string): Promise<boolean> {
  await ensureDataFiles()
  const letters = await getAllLetters()
  const index = letters.findIndex((l) => l.id === id)
  if (index === -1) return false

  const letter = letters[index]
  if (letter.status !== 'pending') return false

  const now = new Date()
  const deleteAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const recycledLetter: RecycledLetter = {
    ...letter,
    status: 'recalled',
    recalledAt: now.toISOString(),
    deleteAt: deleteAt.toISOString(),
  }

  const recycleData = await getRecycledLetters()
  recycleData.push(recycledLetter)
  await fs.writeFile(RECYCLE_FILE, JSON.stringify(recycleData, null, 2), 'utf-8')

  letters.splice(index, 1)
  await fs.writeFile(LETTERS_FILE, JSON.stringify(letters, null, 2), 'utf-8')
  return true
}

export async function getRecycledLetters(): Promise<RecycledLetter[]> {
  await ensureDataFiles()
  const data = await fs.readFile(RECYCLE_FILE, 'utf-8')
  return JSON.parse(data)
}

export async function deleteExpiredRecycled(): Promise<void> {
  await ensureDataFiles()
  const recycled = await getRecycledLetters()
  const now = new Date().toISOString()
  const remaining = recycled.filter((r) => r.deleteAt >= now)
  await fs.writeFile(RECYCLE_FILE, JSON.stringify(remaining, null, 2), 'utf-8')
}

export async function checkAndSendLetters(): Promise<void> {
  await ensureDataFiles()
  const letters = await getAllLetters()
  const today = new Date().toISOString().split('T')[0]
  let changed = false

  for (const letter of letters) {
    if (letter.status === 'pending' && letter.sendDate <= today) {
      console.log(`Letter sent to ${letter.toEmail}`)
      letter.status = 'sent'
      changed = true
    }
  }

  if (changed) {
    await fs.writeFile(LETTERS_FILE, JSON.stringify(letters, null, 2), 'utf-8')
  }
}

export function startScheduler(): void {
  setInterval(async () => {
    await checkAndSendLetters()
    await deleteExpiredRecycled()
  }, 60 * 1000)
}
