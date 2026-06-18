import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Fragment, Artwork, Listing, Rarity, PlayerState } from '../types'
import { PersistentStore } from '../modules/storage/PersistentStore'
import { SynthesisEngine } from '../modules/nft-core/SynthesisEngine'
import type { SynthesisResult } from '../modules/nft-core/SynthesisEngine'

const DEFAULT_PLAYER_ID = 'player_001'
const DEFAULT_PLAYER_NAME = '数字奇境探险家'
const INITIAL_BALANCE = 1000

function getDefaultPlayerState(): PlayerState {
  return {
    playerId: DEFAULT_PLAYER_ID,
    playerName: DEFAULT_PLAYER_NAME,
    balance: INITIAL_BALANCE,
    fragments: [],
    artworks: [],
    lastQuizDate: '',
  }
}

function generateMockListings(): Listing[] {
  const sellers = ['收藏家_小明', 'NFT大师', '艺术品猎人', '数字艺术爱好者', '稀有碎片商']
  const itemNames = ['星核碎片', '银河之尘', '珊瑚之泪', '古树年轮', '霓虹芯片']
  const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary']
  const listings: Listing[] = []

  for (let i = 0; i < 25; i++) {
    const rarity = rarities[Math.floor(Math.random() * rarities.length)]
    const priceMap: Record<Rarity, number> = {
      common: 10 + Math.floor(Math.random() * 20),
      rare: 50 + Math.floor(Math.random() * 50),
      epic: 150 + Math.floor(Math.random() * 100),
      legendary: 300 + Math.floor(Math.random() * 200),
    }
    listings.push({
      id: uuidv4(),
      sellerId: `seller_${i}`,
      sellerName: sellers[Math.floor(Math.random() * sellers.length)],
      itemId: uuidv4(),
      itemType: 'fragment',
      itemName: itemNames[Math.floor(Math.random() * itemNames.length)],
      rarity,
      price: priceMap[rarity],
      listedAt: Date.now() - Math.floor(Math.random() * 86400000),
      quantity: 1,
    })
  }
  return listings
}

interface GameStore {
  player: PlayerState
  listings: Listing[]
  selectedFragmentIds: Set<string>
  showWelcome: boolean
  showCelebration: boolean
  celebrationFragments: Fragment[]
  synthFlash: boolean

  addFragment: (fragment: Fragment) => void
  addFragments: (fragments: Fragment[]) => void
  removeFragments: (ids: string[]) => void
  addArtwork: (artwork: Artwork) => void
  setBalance: (balance: number) => void
  updateBalance: (delta: number) => void

  toggleFragmentSelection: (id: string) => void
  clearFragmentSelection: () => void

  synthesizeSelected: () => SynthesisResult

  createListing: (itemId: string, itemType: 'fragment' | 'artwork', itemName: string, rarity: Rarity, price: number) => boolean
  cancelListing: (listingId: string) => boolean
  purchaseListing: (listingId: string) => { success: boolean; error?: string }

  setShowWelcome: (show: boolean) => void
  setShowCelebration: (show: boolean, fragments?: Fragment[]) => void
  setSynthFlash: (flash: boolean) => void
  markQuizTaken: () => void
  canTakeQuizToday: () => boolean

  initState: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  player: getDefaultPlayerState(),
  listings: [],
  selectedFragmentIds: new Set(),
  showWelcome: !PersistentStore.hasVisited(),
  showCelebration: false,
  celebrationFragments: [],
  synthFlash: false,

  initState: () => {
    const savedPlayer = PersistentStore.loadPlayerState()
    const savedListings = PersistentStore.loadMarketListings()

    const player = savedPlayer || getDefaultPlayerState()
    const listings = savedListings.length > 0 ? savedListings : generateMockListings()

    set({ player, listings })
    PersistentStore.savePlayerState(player)
    PersistentStore.saveMarketListings(listings)
  },

  addFragment: (fragment) => {
    set((state) => {
      const newFragments = [...state.player.fragments, fragment]
      const player = { ...state.player, fragments: newFragments }
      PersistentStore.savePlayerState(player)
      return { player }
    })
  },

  addFragments: (fragments) => {
    set((state) => {
      const newFragments = [...state.player.fragments, ...fragments]
      const player = { ...state.player, fragments: newFragments }
      PersistentStore.savePlayerState(player)
      return { player }
    })
  },

  removeFragments: (ids) => {
    set((state) => {
      const idSet = new Set(ids)
      const newFragments = state.player.fragments.filter((f) => !idSet.has(f.id))
      const player = { ...state.player, fragments: newFragments }
      PersistentStore.savePlayerState(player)
      return { player, selectedFragmentIds: new Set() }
    })
  },

  addArtwork: (artwork) => {
    set((state) => {
      const newArtworks = [...state.player.artworks, artwork]
      const player = { ...state.player, artworks: newArtworks }
      PersistentStore.savePlayerState(player)
      return { player }
    })
  },

  setBalance: (balance) => {
    set((state) => {
      const player = { ...state.player, balance }
      PersistentStore.savePlayerState(player)
      return { player }
    })
  },

  updateBalance: (delta) => {
    set((state) => {
      const player = { ...state.player, balance: state.player.balance + delta }
      PersistentStore.savePlayerState(player)
      return { player }
    })
  },

  toggleFragmentSelection: (id) => {
    set((state) => {
      const newSet = new Set(state.selectedFragmentIds)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        if (newSet.size < 4) {
          newSet.add(id)
        }
      }
      return { selectedFragmentIds: newSet }
    })
  },

  clearFragmentSelection: () => {
    set({ selectedFragmentIds: new Set() })
  },

  synthesizeSelected: () => {
    const state = get()
    const selectedFragments = state.player.fragments.filter((f) =>
      state.selectedFragmentIds.has(f.id)
    )

    const result = SynthesisEngine.synthesize(selectedFragments)
    if (result.success && result.artwork) {
      get().removeFragments(selectedFragments.map((f) => f.id))
      get().addArtwork(result.artwork)
      set({ synthFlash: true })
      setTimeout(() => set({ synthFlash: false }), 500)
    }
    return result
  },

  createListing: (itemId, itemType, itemName, rarity, price) => {
    if (price < 10 || price > 500) return false
    const state = get()
    if (itemType === 'fragment') {
      const fragment = state.player.fragments.find((f) => f.id === itemId)
      if (!fragment) return false
    }

    const listing: Listing = {
      id: uuidv4(),
      sellerId: state.player.playerId,
      sellerName: state.player.playerName,
      itemId,
      itemType,
      itemName,
      rarity,
      price,
      listedAt: Date.now(),
      quantity: 1,
    }

    if (itemType === 'fragment') {
      get().removeFragments([itemId])
    }

    set((s) => {
      const listings = [...s.listings, listing]
      PersistentStore.saveMarketListings(listings)
      return { listings }
    })

    return true
  },

  cancelListing: (listingId) => {
    const state = get()
    const listing = state.listings.find((l) => l.id === listingId)
    if (!listing || listing.sellerId !== state.player.playerId) return false

    set((s) => {
      const listings = s.listings.filter((l) => l.id !== listingId)
      PersistentStore.saveMarketListings(listings)
      return { listings }
    })
    return true
  },

  purchaseListing: (listingId) => {
    const state = get()
    const listing = state.listings.find((l) => l.id === listingId)
    if (!listing) return { success: false, error: '挂单不存在' }
    if (listing.sellerId === state.player.playerId) return { success: false, error: '不能购买自己的物品' }
    if (state.player.balance < listing.price) return { success: false, error: '余额不足' }

    get().updateBalance(-listing.price)

    set((s) => {
      const listings = s.listings.filter((l) => l.id !== listingId)
      PersistentStore.saveMarketListings(listings)
      return { listings }
    })

    if (listing.itemType === 'fragment') {
      const fragment: Fragment = {
        id: uuidv4(),
        name: listing.itemName,
        rarity: listing.rarity,
        groupId: 'g_mystery',
        groupName: '神秘收藏',
        imageId: 80 + Math.floor(Math.random() * 10),
      }
      get().addFragment(fragment)
    }

    return { success: true }
  },

  setShowWelcome: (show) => {
    if (!show) PersistentStore.markVisited()
    set({ showWelcome: show })
  },

  setShowCelebration: (show, fragments) => {
    set({ showCelebration: show, celebrationFragments: fragments || [] })
  },

  setSynthFlash: (flash) => set({ synthFlash: flash }),

  markQuizTaken: () => {
    const today = new Date().toDateString()
    set((state) => {
      const player = { ...state.player, lastQuizDate: today }
      PersistentStore.savePlayerState(player)
      return { player }
    })
  },

  canTakeQuizToday: () => {
    const today = new Date().toDateString()
    return get().player.lastQuizDate !== today
  },
}))
