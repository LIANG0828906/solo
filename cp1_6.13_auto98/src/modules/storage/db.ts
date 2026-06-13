import type { Difficulty, GameRecord } from '../game/GameEngine'

interface IndexConfig {
  name: string
  keyPath: string
  unique?: boolean
}

interface StoreConfig {
  keyPath: string
  indexes: IndexConfig[]
}

const DB_CONFIG = {
  name: 'ColorChordDB',
  version: 1,
  stores: {
    records: {
      keyPath: 'id',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp' },
        { name: 'difficulty', keyPath: 'difficulty' },
      ],
    } as StoreConfig,
  },
}

let dbInstance: IDBDatabase | null = null
let openPromise: Promise<IDBDatabase> | null = null

export function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)
  if (openPromise) return openPromise

  openPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      Object.entries(DB_CONFIG.stores).forEach(([storeName, storeCfg]) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: storeCfg.keyPath })
          storeCfg.indexes.forEach((idx) => {
            store.createIndex(idx.name, idx.keyPath, { unique: idx.unique ?? false })
          })
        }
      })
    }
  })

  return openPromise
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function addRecord(record: GameRecord): Promise<string> {
  const db = await openDB()
  const tx = db.transaction('records', 'readwrite')
  const store = tx.objectStore('records')
  await promisifyRequest(store.add(record))
  return record.id
}

export async function getAllRecords(): Promise<GameRecord[]> {
  const db = await openDB()
  const tx = db.transaction('records', 'readonly')
  const store = tx.objectStore('records')
  const index = store.index('timestamp')

  const records: GameRecord[] = []
  return new Promise((resolve, reject) => {
    const cursorReq = index.openCursor(null, 'prev')
    cursorReq.onerror = () => reject(cursorReq.error)
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result
      if (cursor) {
        records.push(cursor.value as GameRecord)
        cursor.continue()
      } else {
        resolve(records)
      }
    }
  })
}

export async function getRecordsByDifficulty(difficulty: Difficulty): Promise<GameRecord[]> {
  const db = await openDB()
  const tx = db.transaction('records', 'readonly')
  const store = tx.objectStore('records')
  const index = store.index('difficulty')

  const all: GameRecord[] = []
  return new Promise((resolve, reject) => {
    const cursorReq = index.openCursor(IDBKeyRange.only(difficulty), 'prev')
    cursorReq.onerror = () => reject(cursorReq.error)
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result
      if (cursor) {
        all.push(cursor.value as GameRecord)
        cursor.continue()
      } else {
        all.sort((a, b) => b.timestamp - a.timestamp)
        resolve(all)
      }
    }
  })
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction('records', 'readwrite')
  const store = tx.objectStore('records')
  await promisifyRequest(store.delete(id))
}

export async function clearAllRecords(): Promise<void> {
  const db = await openDB()
  const tx = db.transaction('records', 'readwrite')
  const store = tx.objectStore('records')
  await promisifyRequest(store.clear())
}
