import { get, set } from 'idb-keyval'
import type { Subscription } from './types'

const STORAGE_KEY = 'saas_subscriptions_v1'

export const storage = {
  async load(): Promise<Subscription[]> {
    try {
      const data = await get(STORAGE_KEY) as Subscription[] | undefined
      return data || []
    } catch (err) {
      console.warn('Failed to load subscriptions from IndexedDB:', err)
      return []
    }
  },

  async save(subscriptions: Subscription[]): Promise<void> {
    try {
      await set(STORAGE_KEY, subscriptions)
    } catch (err) {
      console.warn('Failed to save subscriptions to IndexedDB:', err)
    }
  }
}
