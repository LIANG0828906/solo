import { openDB, IDBPDatabase } from 'idb'

export interface Activity {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  poster?: string
  maxParticipants: number
}

export interface Registration {
  id: string
  activityId: string
  name: string
  email: string
  phone: string
  createdAt: number
}

interface ClubActivityDBSchema {
  activities: {
    key: string
    value: Activity
  }
  registrations: {
    key: string
    value: Registration
    indexes: { 'by-activity': string }
  }
}

let dbPromise: Promise<IDBPDatabase<ClubActivityDBSchema>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ClubActivityDBSchema>('ClubActivityDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('activities')) {
          db.createObjectStore('activities', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('registrations')) {
          const store = db.createObjectStore('registrations', { keyPath: 'id' })
          store.createIndex('by-activity', 'activityId')
        }
      },
    })
  }
  return dbPromise
}

export async function addActivity(activity: Activity): Promise<void> {
  const db = await getDB()
  await db.put('activities', activity)
}

export async function getActivities(): Promise<Activity[]> {
  const db = await getDB()
  return db.getAll('activities')
}

export async function updateActivity(id: string, data: Partial<Activity>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('activities', id)
  if (existing) {
    await db.put('activities', { ...existing, ...data })
  }
}

export async function deleteActivity(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['activities', 'registrations'], 'readwrite')
  await tx.objectStore('activities').delete(id)
  const index = tx.objectStore('registrations').index('by-activity')
  const keys = await index.getAllKeys(id)
  for (const key of keys) {
    await tx.objectStore('registrations').delete(key)
  }
  await tx.done
}

export async function addRegistration(registration: Registration): Promise<void> {
  const db = await getDB()
  await db.put('registrations', registration)
}

export async function getRegistrationsByActivity(activityId: string): Promise<Registration[]> {
  const db = await getDB()
  return db.getAllFromIndex('registrations', 'by-activity', activityId)
}

export async function getAllRegistrations(): Promise<Registration[]> {
  const db = await getDB()
  return db.getAll('registrations')
}
