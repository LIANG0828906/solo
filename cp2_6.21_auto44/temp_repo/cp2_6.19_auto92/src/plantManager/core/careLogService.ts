import { v4 as uuidv4 } from 'uuid'
import type { Plant, CareLog, CareLogType } from './plantModel'

const DB_NAME = 'PlantCareDB'
const DB_VERSION = 1
const PLANTS_STORE = 'plants'
const CARE_LOGS_STORE = 'careLogs'

let dbInstance: IDBDatabase | null = null

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(request.error)
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(PLANTS_STORE)) {
        const plantsStore = db.createObjectStore(PLANTS_STORE, { keyPath: 'id' })
        plantsStore.createIndex('category', 'category')
        plantsStore.createIndex('createdAt', 'createdAt')
      }

      if (!db.objectStoreNames.contains(CARE_LOGS_STORE)) {
        const logsStore = db.createObjectStore(CARE_LOGS_STORE, { keyPath: 'id' })
        logsStore.createIndex('plantId', 'plantId')
        logsStore.createIndex('type', 'type')
        logsStore.createIndex('date', 'date')
        logsStore.createIndex('plantId-date', ['plantId', 'date'])
      }
    }
  })
}

export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance
  }
  return initDB()
}

export async function addPlant(
  plant: Omit<Plant, 'id' | 'createdAt'>
): Promise<Plant> {
  const db = await getDB()
  const newPlant: Plant = {
    ...plant,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PLANTS_STORE, 'readwrite')
    const store = transaction.objectStore(PLANTS_STORE)
    const request = store.add(newPlant)

    request.onsuccess = () => {
      resolve(newPlant)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

export async function updatePlant(
  id: string,
  updates: Partial<Plant>
): Promise<Plant | null> {
  const db = await getDB()
  const existingPlant = await getPlant(id)

  if (!existingPlant) {
    return null
  }

  const updatedPlant: Plant = {
    ...existingPlant,
    ...updates,
    id: existingPlant.id,
    createdAt: existingPlant.createdAt,
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PLANTS_STORE, 'readwrite')
    const store = transaction.objectStore(PLANTS_STORE)
    const request = store.put(updatedPlant)

    request.onsuccess = () => {
      resolve(updatedPlant)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

export async function deletePlant(id: string): Promise<void> {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PLANTS_STORE, CARE_LOGS_STORE], 'readwrite')

    const plantsStore = transaction.objectStore(PLANTS_STORE)
    const plantRequest = plantsStore.delete(id)

    plantRequest.onerror = () => {
      reject(plantRequest.error)
    }

    const logsStore = transaction.objectStore(CARE_LOGS_STORE)
    const plantIdIndex = logsStore.index('plantId')
    const logsRequest = plantIdIndex.openCursor(IDBKeyRange.only(id))

    logsRequest.onsuccess = () => {
      const cursor = logsRequest.result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }

    logsRequest.onerror = () => {
      reject(logsRequest.error)
    }

    transaction.oncomplete = () => {
      resolve()
    }

    transaction.onerror = () => {
      reject(transaction.error)
    }
  })
}

export async function getPlant(id: string): Promise<Plant | null> {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PLANTS_STORE, 'readonly')
    const store = transaction.objectStore(PLANTS_STORE)
    const request = store.get(id)

    request.onsuccess = () => {
      resolve(request.result || null)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

export async function getAllPlants(): Promise<Plant[]> {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PLANTS_STORE, 'readonly')
    const store = transaction.objectStore(PLANTS_STORE)
    const request = store.getAll()

    request.onsuccess = () => {
      resolve(request.result || [])
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

export async function addLog(
  log: Omit<CareLog, 'id' | 'createdAt'>
): Promise<CareLog> {
  const db = await getDB()
  const newLog: CareLog = {
    ...log,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PLANTS_STORE, CARE_LOGS_STORE], 'readwrite')
    const logsStore = transaction.objectStore(CARE_LOGS_STORE)
    const addRequest = logsStore.add(newLog)

    addRequest.onsuccess = async () => {
      if (log.type === 'watering' || log.type === 'fertilizing') {
        const plantsStore = transaction.objectStore(PLANTS_STORE)
        const getPlantRequest = plantsStore.get(log.plantId)

        getPlantRequest.onsuccess = () => {
          const plant = getPlantRequest.result
          if (plant) {
            if (log.type === 'watering') {
              plant.lastWateringDate = log.date
            } else if (log.type === 'fertilizing') {
              plant.lastFertilizingDate = log.date
            }
            plantsStore.put(plant)
          }
        }
      }
    }

    addRequest.onerror = () => {
      reject(addRequest.error)
    }

    transaction.oncomplete = () => {
      resolve(newLog)
    }

    transaction.onerror = () => {
      reject(transaction.error)
    }
  })
}

export async function deleteLog(id: string): Promise<void> {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CARE_LOGS_STORE, 'readwrite')
    const store = transaction.objectStore(CARE_LOGS_STORE)
    const request = store.delete(id)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

export async function getLogsByPlant(plantId: string): Promise<CareLog[]> {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CARE_LOGS_STORE, 'readonly')
    const store = transaction.objectStore(CARE_LOGS_STORE)
    const index = store.index('plantId')
    const request = index.getAll(IDBKeyRange.only(plantId))

    request.onsuccess = () => {
      const logs = request.result || []
      logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      resolve(logs)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

export async function getLogsByType(
  plantId: string,
  type: CareLogType
): Promise<CareLog[]> {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CARE_LOGS_STORE, 'readonly')
    const store = transaction.objectStore(CARE_LOGS_STORE)
    const index = store.index('plantId')
    const request = index.openCursor(IDBKeyRange.only(plantId))

    const logs: CareLog[] = []

    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        if (cursor.value.type === type) {
          logs.push(cursor.value)
        }
        cursor.continue()
      } else {
        logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        resolve(logs)
      }
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

export async function getLastLogOfType(
  plantId: string,
  type: CareLogType
): Promise<CareLog | null> {
  const logs = await getLogsByType(plantId, type)
  return logs.length > 0 ? logs[0] : null
}
