import type { PlayerState, Listing } from '../../types'

const PLAYER_KEY = 'dw_player_state'
const MARKET_KEY = 'dw_market_listings'
const VISITED_KEY = 'dw_visited'

export class PersistentStore {
  static savePlayerState(state: PlayerState): void {
    try {
      localStorage.setItem(PLAYER_KEY, JSON.stringify(state))
    } catch (e) {
      console.error('Failed to save player state:', e)
    }
  }

  static loadPlayerState(): PlayerState | null {
    try {
      const raw = localStorage.getItem(PLAYER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch (e) {
      console.error('Failed to load player state:', e)
      return null
    }
  }

  static saveMarketListings(listings: Listing[]): void {
    try {
      localStorage.setItem(MARKET_KEY, JSON.stringify(listings))
    } catch (e) {
      console.error('Failed to save market listings:', e)
    }
  }

  static loadMarketListings(): Listing[] {
    try {
      const raw = localStorage.getItem(MARKET_KEY)
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      console.error('Failed to load market listings:', e)
      return []
    }
  }

  static hasVisited(): boolean {
    return localStorage.getItem(VISITED_KEY) === 'true'
  }

  static markVisited(): void {
    localStorage.setItem(VISITED_KEY, 'true')
  }
}
