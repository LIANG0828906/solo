import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Show, WatchRecord } from '../types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SHOWS_FILE = path.join(__dirname, 'shows.json')
const RECORDS_FILE = path.join(__dirname, 'records.json')

async function ensureDataFile<T>(filePath: string, defaultData: T): Promise<void> {
  try {
    await fs.access(filePath)
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8')
  }
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const data = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(data) as T
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export async function initStore(): Promise<void> {
  await ensureDataFile<Show[]>(SHOWS_FILE, [])
  await ensureDataFile<WatchRecord[]>(RECORDS_FILE, [])
}

export async function getAllShows(): Promise<Show[]> {
  await initStore()
  return readJsonFile<Show[]>(SHOWS_FILE)
}

export async function saveAllShows(shows: Show[]): Promise<void> {
  await writeJsonFile(SHOWS_FILE, shows)
}

export async function getAllRecords(): Promise<WatchRecord[]> {
  await initStore()
  return readJsonFile<WatchRecord[]>(RECORDS_FILE)
}

export async function saveAllRecords(records: WatchRecord[]): Promise<void> {
  await writeJsonFile(RECORDS_FILE, records)
}
