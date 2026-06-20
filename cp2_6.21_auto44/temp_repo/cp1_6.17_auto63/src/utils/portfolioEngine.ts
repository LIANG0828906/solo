export type AssetType = 'stock' | 'bond' | 'commodity'

export interface Asset {
  id: string
  type: AssetType
  name: string
  weight: number
  returnRate: number
  volatility: number
}

export interface StressTestResult {
  name: string
  impact: number
}

export interface RiskMetrics {
  portfolioReturn: number
  portfolioVolatility: number
  maxDrawdown: number
  sharpeRatio: number
  var95: number
  var99: number
  stressTests: StressTestResult[]
}

export interface PointDetail {
  date: string
  portfolioValue: number
  var95: number
  sharpeRatio: number
}

export function calculateCorrelationMatrix(assets: Asset[]): number[][] {
  const n = assets.length
  const matrix: number[][] = []

  const baseCorrelations: Record<AssetType, Record<AssetType, number>> = {
    stock: { stock: 1, bond: 0.2, commodity: 0.4 },
    bond: { stock: 0.2, bond: 1, commodity: 0.1 },
    commodity: { stock: 0.4, bond: 0.1, commodity: 1 }
  }

  for (let i = 0; i < n; i++) {
    matrix[i] = []
    for (let j = 0; j < n; j++) {
      matrix[i][j] = baseCorrelations[assets[i].type][assets[j].type]
    }
  }

  return matrix
}

export function calculatePortfolioReturn(assets: Asset[]): number {
  return assets.reduce((sum, asset) => sum + asset.weight * asset.returnRate, 0)
}

export function calculatePortfolioVolatility(
  assets: Asset[],
  correlationMatrix: number[][]
): number {
  let variance = 0
  const n = assets.length

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      variance +=
        assets[i].weight *
        assets[j].weight *
        assets[i].volatility *
        assets[j].volatility *
        correlationMatrix[i][j]
    }
  }

  return Math.sqrt(variance)
}

export function calculateMaxDrawdown(
  assets: Asset[],
  correlationMatrix: number[][]
): number {
  const volatility = calculatePortfolioVolatility(assets, correlationMatrix)
  const returnRate = calculatePortfolioReturn(assets)
  return volatility * 2.5 - returnRate * 0.5
}

export function runStressTests(
  assets: Asset[],
  correlationMatrix: number[][]
): StressTestResult[] {
  const volatility = calculatePortfolioVolatility(assets, correlationMatrix)

  return [
    { name: '市场崩盘', impact: -volatility * 3 },
    { name: '利率上升', impact: -volatility * 1.5 },
    { name: '通胀冲击', impact: -volatility * 2 },
    { name: '流动性危机', impact: -volatility * 2.5 }
  ]
}

export function calculateVaR(
  assets: Asset[],
  correlationMatrix: number[][],
  confidence: number
): number {
  const volatility = calculatePortfolioVolatility(assets, correlationMatrix)
  const returnRate = calculatePortfolioReturn(assets)
  const zScore = confidence === 0.99 ? 2.33 : 1.645
  return returnRate - zScore * volatility
}

export function calculateSharpeRatio(
  assets: Asset[],
  correlationMatrix: number[][],
  riskFreeRate: number
): number {
  const volatility = calculatePortfolioVolatility(assets, correlationMatrix)
  const returnRate = calculatePortfolioReturn(assets)
  if (volatility === 0) return 0
  return (returnRate - riskFreeRate) / volatility
}
