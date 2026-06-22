import React, { createContext, useContext, useState, useCallback } from 'react'

export type MeasurementInput = {
  chest: number
  waist: number
  hip: number
  length: number
  shoulder: number
  sleeveLength: number
}

export type SizeScore = {
  size: string
  fitScore: number
}

export type RecommendationResult = {
  recommendedSize: string
  fitScore: number
  allScores: Record<string, number>
  chartId: string
  chartBrand: string
  measurements: MeasurementInput
}

export type SizeChart = {
  id: string
  brand: string
  sizes: Record<string, MeasurementInput>
}

export type BatchItem = {
  id: string
  productName: string
  result: RecommendationResult
}

export type AppState = {
  currentMeasurements: MeasurementInput | null
  currentResult: RecommendationResult | null
  batchItems: BatchItem[]
  sizeCharts: SizeChart[]
  selectedChartId: string
  activeTab: 'fitting' | 'result' | 'sizecharts'
  toastMessage: string
  isLoading: boolean
}

type AppContextValue = AppState & {
  setCurrentMeasurements: (m: MeasurementInput | null) => void
  setCurrentResult: (r: RecommendationResult | null) => void
  setBatchItems: React.Dispatch<React.SetStateAction<BatchItem[]>>
  setSizeCharts: React.Dispatch<React.SetStateAction<SizeChart[]>>
  setSelectedChartId: (id: string) => void
  setActiveTab: (tab: AppState['activeTab']) => void
  showToast: (msg: string) => void
  setIsLoading: (loading: boolean) => void
}

const AppContext = createContext<AppContextValue | null>(null)

const defaultMeasurements: MeasurementInput = {
  chest: 0,
  waist: 0,
  hip: 0,
  length: 0,
  shoulder: 0,
  sleeveLength: 0,
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentMeasurements, setCurrentMeasurements] = useState<MeasurementInput | null>(null)
  const [currentResult, setCurrentResult] = useState<RecommendationResult | null>(null)
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>([])
  const [selectedChartId, setSelectedChartId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<AppState['activeTab']>('fitting')
  const [toastMessage, setToastMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 2500)
  }, [])

  const value: AppContextValue = {
    currentMeasurements,
    currentResult,
    batchItems,
    sizeCharts,
    selectedChartId,
    activeTab,
    toastMessage,
    isLoading,
    setCurrentMeasurements,
    setCurrentResult,
    setBatchItems,
    setSizeCharts,
    setSelectedChartId,
    setActiveTab,
    showToast,
    setIsLoading,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider')
  }
  return ctx
}
