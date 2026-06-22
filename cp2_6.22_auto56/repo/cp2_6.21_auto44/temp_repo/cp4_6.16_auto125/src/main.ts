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
    const now = Date.now()
    const hourMs = 60 * 60 * 1000
    
    const demoDatasets = [
      {
        name: '24小时气温变化',
        series: [
          {
            id: '',
            name: '北京气温(°C)',
            data: this.generateTimeSeriesData(100, 15, 10, now - 24 * hourMs, hourMs / 4),
            hasTimeDimension: true
          },
          {
            id: '',
            name: '上海气温(°C)',
            data: this.generateTimeSeriesData(100, 20, 8, now - 24 * hourMs, hourMs / 4),
            hasTimeDimension: true
          },
          {
            id: '',
            name: '广州气温(°C)',
            data: this.generateTimeSeriesData(100, 25, 6, now - 24 * hourMs, hourMs / 4),
            hasTimeDimension: true
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

  private generateTimeSeriesData(count: number, baseValue: number, volatility: number, startTime: number, interval: number): { x: number; y: number; time: number }[] {
    const data: { x: number; y: number; time: number }[] = []
    let value = baseValue

    for (let i = 0; i < count; i++) {
      const change = (Math.random() - 0.5) * volatility
      value = Math.max(0, value + change)
      data.push({ 
        x: i, 
        y: Math.round(value * 10) / 10,
        time: startTime + i * interval
      })
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
