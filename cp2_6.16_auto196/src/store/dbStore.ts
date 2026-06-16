import type { ContractTemplate, Contract } from '@/types'

const DB_NAME = 'lease-contract-db'
const DB_VERSION = 1
const TEMPLATE_STORE = 'templates'
const CONTRACT_STORE = 'contracts'

class DbStore {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (this.db) return
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(TEMPLATE_STORE)) {
          const templateStore = db.createObjectStore(TEMPLATE_STORE, { keyPath: 'id' })
          templateStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }

        if (!db.objectStoreNames.contains(CONTRACT_STORE)) {
          const contractStore = db.createObjectStore(CONTRACT_STORE, { keyPath: 'id' })
          contractStore.createIndex('status', 'status', { unique: false })
          contractStore.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    })

    return this.initPromise
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')
    const transaction = this.db.transaction(storeName, mode)
    return transaction.objectStore(storeName)
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllTemplates(): Promise<ContractTemplate[]> {
    const store = await this.getStore(TEMPLATE_STORE)
    const request = store.getAll()
    const result = await this.promisifyRequest(request)
    return result.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  async getTemplate(id: string): Promise<ContractTemplate | undefined> {
    const store = await this.getStore(TEMPLATE_STORE)
    const request = store.get(id)
    return this.promisifyRequest(request)
  }

  async addTemplate(template: ContractTemplate): Promise<void> {
    const store = await this.getStore(TEMPLATE_STORE, 'readwrite')
    store.add(template)
  }

  async updateTemplate(template: ContractTemplate): Promise<void> {
    const store = await this.getStore(TEMPLATE_STORE, 'readwrite')
    store.put(template)
  }

  async deleteTemplate(id: string): Promise<void> {
    const store = await this.getStore(TEMPLATE_STORE, 'readwrite')
    store.delete(id)
  }

  async getAllContracts(): Promise<Contract[]> {
    const store = await this.getStore(CONTRACT_STORE)
    const request = store.getAll()
    const result = await this.promisifyRequest(request)
    return result.sort((a, b) => b.createdAt - a.createdAt)
  }

  async getContract(id: string): Promise<Contract | undefined> {
    const store = await this.getStore(CONTRACT_STORE)
    const request = store.get(id)
    return this.promisifyRequest(request)
  }

  async addContract(contract: Contract): Promise<void> {
    const store = await this.getStore(CONTRACT_STORE, 'readwrite')
    store.add(contract)
  }

  async updateContract(contract: Contract): Promise<void> {
    const store = await this.getStore(CONTRACT_STORE, 'readwrite')
    store.put(contract)
  }

  async deleteContract(id: string): Promise<void> {
    const store = await this.getStore(CONTRACT_STORE, 'readwrite')
    store.delete(id)
  }
}

export const dbStore = new DbStore()
