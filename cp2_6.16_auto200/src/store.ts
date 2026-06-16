import { create } from 'zustand'
import type { AppState, UserInput, BannerOutput } from './types'

const DEFAULT_USER_INPUT: UserInput = {
  imageUrl: '',
  title: '限时特惠 不容错过',
  subtitle: '精选商品低至五折起，数量有限先到先得',
  buttonText: '立即抢购',
}

export const useBannerStore = create<AppState>((set) => ({
  selectedTemplateId: 'classic',
  selectedSizeId: 'facebook',
  userInput: DEFAULT_USER_INPUT,
  banners: [],
  isDownloading: false,
  isImageLoading: false,

  setSelectedTemplateId: (id: string) => set({ selectedTemplateId: id }),

  setSelectedSizeId: (id: string) => set({ selectedSizeId: id }),

  setUserInput: (input: Partial<UserInput>) =>
    set((state) => ({
      userInput: { ...state.userInput, ...input },
    })),

  setDownloading: (loading: boolean) => set({ isDownloading: loading }),

  setImageLoading: (loading: boolean) => set({ isImageLoading: loading }),

  addBanner: (banner: BannerOutput) =>
    set((state) => ({
      banners: [...state.banners, banner],
    })),

  clearBanners: () => set({ banners: [] }),
}))
