import { get, set } from 'idb-keyval'
import type { Subscription } from './types'

const STORAGE_KEY = 'saas_subscriptions_v1'
const SCHEMA_VERSION = 1
const MAX_RETRIES = 3

interface StorageEnvelope {
  __v: number
  __ts: number
  data: Subscription[]
}

let _saveQueue: Promise<void> = Promise.resolve()
let _channel: BroadcastChannel | null = null

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!_channel) {
    try {
      _channel = new BroadcastChannel('saas_subscriptions_sync')
    } catch {
      _channel = null
    }
  }
  return _channel
}

export const storage = {
  async load(): Promise<Subscription[]> {
    try {
      const raw = await get(STORAGE_KEY) as StorageEnvelope | Subscription[] | undefined
      if (!raw) return []
      if (Array.isArray(raw)) {
        return raw
      }
      if ('__v' in raw && 'data' in raw) {
        if (raw.__v !== SCHEMA_VERSION) {
          console.warn(`Storage schema mismatch, expected v${SCHEMA_VERSION}, got v${raw.__v}`)
          return []
        }
        return raw.data || []
      }
      return []
    } catch (err) {
      console.warn('Failed to load subscriptions from IndexedDB:', err)
      return []
    }
  },

  async save(subscriptions: Subscription[]): Promise<void> {
    const ch = getChannel()
    const runSave = async (): Promise<void> => {
      try {
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            const envelope: StorageEnvelope = {
              __v: SCHEMA_VERSION,
              __ts: Date.now() + attempt,
              data: subscriptions
            }
            await set(STORAGE_KEY, envelope)
            ch?.postMessage({ type: 'updated', __ts: envelope.__ts })
            return
          } catch (retryErr) {
            if (attempt === MAX_RETRIES - 1) throw retryErr
            await new Promise(r => setTimeout(r, 30 * (attempt + 1)))
          }
        }
      } catch (err) {
        console.warn('Failed to save subscriptions to IndexedDB:', err)
      }
    }
    _saveQueue = _saveQueue.then(runSave, runSave)
    return _saveQueue
  },

  subscribe(callback: (subs: Subscription[]) => void): () => void {
    const ch = getChannel()
    if (!ch) return () => {}
    const handler = async (ev: MessageEvent) => {
      if (ev.data?.type === 'updated') {
        this.load().then(callback).catch(() => {})
      }
    }
    ch.addEventListener('message', handler)
    return () => ch.removeEventListener('message', handler)
  }
}
