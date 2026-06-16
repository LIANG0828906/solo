import { SceneManager } from './sceneManager'
import { UIController } from './uiController'
import { useDataStore } from './dataStore'

class DataOrbitApp {
  private sceneManager: SceneManager
  private uiController: UIController

  constructor() {
    const container = document.getElementById('canvas-container')
    if (!container) {
      throw new Error('Canvas container not found')
    }

    this.sceneManager = new SceneManager(container)
    this.uiController = new UIController()
    this.uiController.setSceneManager(this.sceneManager)

    this.setupPointClickHandler()
    this.setupStoreSubscription()
    
    this.loadDemoData()
  }

  private setupPointClickHandler() {
    this.sceneManager.setOnPointClick((point) => {
      this.uiController.handlePointClick(point)
    })
  }

  private setupStoreSubscription() {
    let prevChartType = useDataStore.getState().chartType
    let prevDatasets = useDataStore.getState().datasets
    let prevTimeRange = useDataStore.getState().timeRange

    useDataStore.subscribe((state) => {
      if (state.chartType !== prevChartType) {
        prevChartType = state.chartType
        this.sceneManager.transitionChartType(state.chartType)
      }
      
      if (state.datasets !== prevDatasets) {
        prevDatasets = state.datasets
        this.sceneManager.updateCharts(state.datasets, state.chartType, state.timeRange)
      }
      
      if (state.timeRange !== prevTimeRange) {
        prevTimeRange = state.timeRange
        if (state.timeRange) {
          this.sceneManager.updateTimeRange(state.timeRange)
        }
      }
      
      if (state.viewState.autoRotate !== useDataStore.getState().viewState.autoRotate) {
        this.sceneManager.setAutoRotate(state.viewState.autoRotate)
      }
    })
  }

  private loadDemoData() {
    const demoDatasets = [
      {
        name: '股票走势示例',
        series: [
          {
            id: '',
            name: '科技股指数',
            data: this.generateStockData(200, 100, 30),
            hasTimeDimension: false
          },
          {
            id: '',
            name: '医疗股指数',
            data: this.generateStockData(200, 80, 20),
            hasTimeDimension: false
          },
          {
            id: '',
            name: '消费股指数',
            data: this.generateStockData(200, 120, 25),
            hasTimeDimension: false
          }
        ]
      }
    ]

    demoDatasets.forEach(dataset => {
      useDataStore.getState().addDataset(dataset)
    })

    const state = useDataStore.getState()
    this.sceneManager.updateCharts(state.datasets, state.chartType)
  }

  private generateStockData(count: number, basePrice: number, volatility: number): { x: number; y: number }[] {
    const data: { x: number; y: number }[] = []
    let price = basePrice

    for (let i = 0; i < count; i++) {
      const change = (Math.random() - 0.48) * volatility
      price = Math.max(10, price + change)
      data.push({ x: i, y: Math.round(price * 100) / 100 })
    }

    return data
  }

  public dispose() {
    this.sceneManager.dispose()
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new DataOrbitApp()
  ;(window as any).app = app
})
