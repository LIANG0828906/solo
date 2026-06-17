import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import {
  Asset,
  AssetType,
  RiskMetrics,
  PointDetail,
  calculateCorrelationMatrix,
  calculatePortfolioReturn,
  calculatePortfolioVolatility,
  calculateMaxDrawdown,
  runStressTests,
  calculateVaR,
  calculateSharpeRatio
} from '@/utils/portfolioEngine'
import { RiskSurfaceData, generateRiskSurfaceData } from '@/utils/generateRiskData'

interface PortfolioState {
  assets: Asset[]
  riskSurfaceData: RiskSurfaceData | null
  riskMetrics: RiskMetrics | null
  selectedPoint: PointDetail | null
  leftPanelCollapsed: boolean
  rightPanelCollapsed: boolean
  addAsset: (type: AssetType) => void
  removeAsset: (id: string) => void
  updateWeight: (id: string, weight: number) => void
  updateReturnRate: (id: string, rate: number) => void
  updateVolatility: (id: string, vol: number) => void
  selectPoint: (point: PointDetail | null) => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  recalculateRiskData: () => void
}

const defaultAssets: Asset[] = [
  {
    id: uuidv4(),
    type: 'stock',
    name: '股票',
    weight: 0.5,
    returnRate: 0.08,
    volatility: 0.2
  },
  {
    id: uuidv4(),
    type: 'bond',
    name: '债券',
    weight: 0.3,
    returnRate: 0.04,
    volatility: 0.05
  },
  {
    id: uuidv4(),
    type: 'commodity',
    name: '商品',
    weight: 0.2,
    returnRate: 0.06,
    volatility: 0.15
  }
]

export const usePortfolioStore = create<PortfolioState>((set, get) => {
  const store: PortfolioState = {
    assets: defaultAssets,
    riskSurfaceData: null,
    riskMetrics: null,
    selectedPoint: null,
    leftPanelCollapsed: false,
    rightPanelCollapsed: false,

    addAsset: (type: AssetType) => {
      const assetNames: Record<AssetType, string> = {
        stock: '股票',
        bond: '债券',
        commodity: '商品'
      }
      const newAsset: Asset = {
        id: uuidv4(),
        type,
        name: assetNames[type],
        weight: 0,
        returnRate: 0,
        volatility: 0
      }
      set((state) => ({
        assets: [...state.assets, newAsset]
      }))
      get().recalculateRiskData()
    },

    removeAsset: (id: string) => {
      set((state) => ({
        assets: state.assets.filter((asset) => asset.id !== id)
      }))
      get().recalculateRiskData()
    },

    updateWeight: (id: string, weight: number) => {
      set((state) => ({
        assets: state.assets.map((asset) =>
          asset.id === id ? { ...asset, weight } : asset
        )
      }))
      get().recalculateRiskData()
    },

    updateReturnRate: (id: string, rate: number) => {
      set((state) => ({
        assets: state.assets.map((asset) =>
          asset.id === id ? { ...asset, returnRate: rate } : asset
        )
      }))
      get().recalculateRiskData()
    },

    updateVolatility: (id: string, vol: number) => {
      set((state) => ({
        assets: state.assets.map((asset) =>
          asset.id === id ? { ...asset, volatility: vol } : asset
        )
      }))
      get().recalculateRiskData()
    },

    selectPoint: (point: PointDetail | null) => {
      set({ selectedPoint: point })
    },

    toggleLeftPanel: () => {
      set((state) => ({ leftPanelCollapsed: !state.leftPanelCollapsed }))
    },

    toggleRightPanel: () => {
      set((state) => ({ rightPanelCollapsed: !state.rightPanelCollapsed }))
    },

    recalculateRiskData: () => {
      const { assets } = get()

      if (assets.length === 0) {
        set({
          riskSurfaceData: null,
          riskMetrics: null
        })
        return
      }

      const correlationMatrix = calculateCorrelationMatrix(assets)
      const portfolioReturn = calculatePortfolioReturn(assets)
      const portfolioVolatility = calculatePortfolioVolatility(
        assets,
        correlationMatrix
      )
      const maxDrawdown = calculateMaxDrawdown(assets, correlationMatrix)
      const stressTests = runStressTests(assets, correlationMatrix)
      const var95 = calculateVaR(assets, correlationMatrix, 0.95)
      const var99 = calculateVaR(assets, correlationMatrix, 0.99)
      const sharpeRatio = calculateSharpeRatio(assets, correlationMatrix, 0.02)

      const riskMetrics: RiskMetrics = {
        portfolioReturn,
        portfolioVolatility,
        maxDrawdown,
        sharpeRatio,
        var95,
        var99,
        stressTests
      }

      const riskSurfaceData = generateRiskSurfaceData(assets)

      set({
        riskSurfaceData,
        riskMetrics
      })
    }
  }

  store.recalculateRiskData()

  return store
})
