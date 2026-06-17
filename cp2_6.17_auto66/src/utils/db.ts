import type { Project, Activity, Like, Comment } from '@/shared/types'

const DB_NAME = 'CommSpaceDB'
const DB_VERSION = 1

const STORES = {
  projects: 'projects',
  activities: 'activities',
  likes: 'likes',
  comments: 'comments',
} as const

let dbInstance: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORES.projects)) {
        db.createObjectStore(STORES.projects, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORES.activities)) {
        const store = db.createObjectStore(STORES.activities, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORES.likes)) {
        const store = db.createObjectStore(STORES.likes, { keyPath: ['projectId', 'userId'] })
        store.createIndex('projectId', 'projectId', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORES.comments)) {
        const store = db.createObjectStore(STORES.comments, { keyPath: 'id' })
        store.createIndex('projectId', 'projectId', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
  })
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as T[])
  })
}

async function getByIndex<T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.getAll(value)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as T[])
  })
}

async function put<T>(storeName: string, data: T): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(data)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

async function remove(storeName: string, key: IDBValidKey | IDBKeyRange): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(key)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export const db = {
  // Projects
  async getProjects(): Promise<Project[]> {
    return getAll<Project>(STORES.projects)
  },
  async saveProject(project: Project): Promise<void> {
    return put<Project>(STORES.projects, project)
  },
  async deleteProject(id: string): Promise<void> {
    return remove(STORES.projects, id)
  },

  // Activities
  async getActivities(): Promise<Activity[]> {
    return getAll<Activity>(STORES.activities)
  },
  async saveActivity(activity: Activity): Promise<void> {
    return put<Activity>(STORES.activities, activity)
  },

  // Likes
  async getLikesByProject(projectId: string): Promise<Like[]> {
    return getByIndex<Like>(STORES.likes, 'projectId', projectId)
  },
  async saveLike(like: Like): Promise<void> {
    return put<Like>(STORES.likes, like)
  },
  async deleteLike(projectId: string, userId: string): Promise<void> {
    return remove(STORES.likes, [projectId, userId])
  },

  // Comments
  async getCommentsByProject(projectId: string): Promise<Comment[]> {
    return getByIndex<Comment>(STORES.comments, 'projectId', projectId)
  },
  async saveComment(comment: Comment): Promise<void> {
    return put<Comment>(STORES.comments, comment)
  },
}
