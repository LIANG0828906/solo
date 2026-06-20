import { useDataStore } from './dataStore'
import type { ChartType, Dataset, DataSeries, DataPoint } from './types'
import type { SceneManager } from './sceneManager'

export class UIController {
  private sceneManager: SceneManager | null = null
  private elements: Record<string, HTMLElement> = {}
  private isTransitioning = false

  constructor() {
    this.cacheElements()
    this.bindEvents()
    this.subscribeToStore()
  }

  public setSceneManager(sceneManager: SceneManager) {
    this.sceneManager = sceneManager
  }

  private cacheElements() {
    this.elements = {
      importBtn: document.getElementById('import-btn')!,
      fileInput: document.getElementById('file-input')!,
      chartModeGroup: document.getElementById('chart-mode-group')!,
      infoCard: document.getElementById('info-card')!,
      infoCardTitle: document.getElementById('info-card-title')!,
      infoSeries: document.getElementById('info-series')!,
      infoX: document.getElementById('info-x')!,
      infoY: document.getElementById('info-y')!,
      infoZ: document.getElementById('info-z')!,
      infoZRow: document.getElementById('info-z-row')!,
      snapshotPanel: document.getElementById('snapshot-panel')!,
      snapshotToggle: document.getElementById('snapshot-toggle')!,
      snapshotList: document.getElementById('snapshot-list')!,
      saveSnapshotBtn: document.getElementById('save-snapshot-btn')!,
      timelineContainer: document.getElementById('timeline-container')!,
      timelineSlider: document.getElementById('timeline-slider') as HTMLInputElement,
      timelineStart: document.getElementById('timeline-start')!,
      timelineEnd: document.getElementById('timeline-end')!,
      timelineCurrent: document.getElementById('timeline-current')!,
      timelineTicks: document.getElementById('timeline-ticks')!,
      topTimestamp: document.getElementById('top-timestamp')!,
      resetViewBtn: document.getElementById('reset-view-btn')!,
      autoRotateBtn: document.getElementById('auto-rotate-btn')!,
      loadingOverlay: document.getElementById('loading-overlay')!,
      loadingBar: document.getElementById('loading-bar')!,
      loadingText: document.getElementById('loading-text')!,
      sceneFade: document.getElementById('scene-fade')!
    }
  }

  private bindEvents() {
    this.elements.importBtn.addEventListener('click', () => {
      (this.elements.fileInput as HTMLInputElement).click()
    })

    this.elements.fileInput.addEventListener('change', this.handleFileImport.bind(this))

    this.elements.chartModeGroup.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('btn') && !target.classList.contains('active')) {
        const mode = target.dataset.mode as ChartType
        this.switchChartType(mode)
      }
    })

    this.elements.snapshotToggle.addEventListener('click', () => {
      useDataStore.getState().toggleSnapshotPanel()
    })

    this.elements.saveSnapshotBtn.addEventListener('click', () => {
      this.saveCurrentSnapshot()
    })

    this.elements.timelineSlider.addEventListener('input', this.handleTimelineChange.bind(this))

    this.elements.resetViewBtn.addEventListener('click', () => {
      if (this.sceneManager) {
        this.sceneManager.resetView()
      }
    })

    this.elements.autoRotateBtn.addEventListener('click', () => {
      const state = useDataStore.getState()
      const newAutoRotate = !state.viewState.autoRotate
      useDataStore.getState().setViewState({ autoRotate: newAutoRotate })
      
      if (this.sceneManager) {
        this.sceneManager.setAutoRotate(newAutoRotate)
      }
      
      if (newAutoRotate) {
        this.elements.autoRotateBtn.classList.add('active')
      } else {
        this.elements.autoRotateBtn.classList.remove('active')
      }
    })
  }

  private subscribeToStore() {
    useDataStore.subscribe((state, prevState) => {
      if (state.snapshotPanelCollapsed !== prevState.snapshotPanelCollapsed) {
        this.updateSnapshotPanelVisibility()
      }
      
      if (state.snapshots !== prevState.snapshots) {
        this.updateSnapshotList()
      }
      
      if (state.selectedPoint !== prevState.selectedPoint) {
        this.updateInfoCard()
      }
      
      if (state.hasTimeDimension !== prevState.hasTimeDimension) {
        this.updateTimelineVisibility()
      }
      
      if (state.isLoading !== prevState.isLoading || 
          state.loadingProgress !== prevState.loadingProgress) {
        this.updateLoadingOverlay()
      }
    })
  }

  private async handleFileImport(event: Event) {
    const input = event.target as HTMLInputElement
    const files = input.files
    if (!files || files.length === 0) return

    useDataStore.getState().setLoading(true, 0)

    try {
      const totalFiles = files.length
      let processedFiles = 0

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const content = await this.readFile(file)
        
        const dataset = this.parseJSONData(content, file.name)
        useDataStore.getState().addDataset(dataset)

        processedFiles++
        const progress = (processedFiles / totalFiles) * 100
        useDataStore.getState().setLoading(true, progress)

        await this.delay(100)
      }

      const state = useDataStore.getState()
      if (this.sceneManager) {
        this.sceneManager.updateCharts(state.datasets, state.chartType, state.timeRange)
      }

      this.setupTimeline()

    } catch (error) {
      console.error('Failed to import data:', error)
      alert('数据导入失败，请检查文件格式')
    } finally {
      useDataStore.getState().setLoading(false)
      input.value = ''
    }
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  private parseJSONData(content: string, fileName: string): Omit<Dataset, 'id'> {
    const parsed = JSON.parse(content)
    
    let series: DataSeries[] = []
    
    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && typeof parsed[0] === 'object' && 'data' in parsed[0]) {
        series = parsed.map((s: any, i: number) => ({
          id: '',
          name: s.name || `系列 ${i + 1}`,
          data: this.normalizeDataPoints(s.data),
          hasTimeDimension: this.checkTimeDimension(s.data)
        }))
      } else {
        series = [{
          id: '',
          name: fileName.replace('.json', ''),
          data: this.normalizeDataPoints(parsed),
          hasTimeDimension: this.checkTimeDimension(parsed)
        }]
      }
    } else if (parsed.series && Array.isArray(parsed.series)) {
      series = parsed.series.map((s: any, i: number) => ({
        id: '',
        name: s.name || `系列 ${i + 1}`,
        data: this.normalizeDataPoints(s.data),
        color: s.color,
        hasTimeDimension: this.checkTimeDimension(s.data)
      }))
    } else if (parsed.data && Array.isArray(parsed.data)) {
      series = [{
        id: '',
        name: parsed.name || fileName.replace('.json', ''),
        data: this.normalizeDataPoints(parsed.data),
        color: parsed.color,
        hasTimeDimension: this.checkTimeDimension(parsed.data)
      }]
    } else {
      throw new Error('Invalid data format')
    }
    
    return {
      name: fileName.replace('.json', ''),
      series,
      fileName
    }
  }

  private normalizeDataPoints(data: any[]): DataPoint[] {
    return data.map((item, index) => {
      if (typeof item === 'number') {
        return { x: index, y: item }
      }
      
      return {
        x: item.x !== undefined ? item.x : index,
        y: item.y !== undefined ? item.y : item.value,
        z: item.z,
        time: item.time || item.timestamp || item.date
      }
    })
  }

  private checkTimeDimension(data: any[]): boolean {
    return data.some(item => 
      item.time !== undefined || 
      item.timestamp !== undefined || 
      item.date !== undefined
    )
  }

  private setupTimeline() {
    const state = useDataStore.getState()
    if (!state.hasTimeDimension) return

    const allSeries = state.datasets.flatMap(d => d.series)
    let minTime = Infinity
    let maxTime = -Infinity

    allSeries.forEach(series => {
      series.data.forEach(point => {
        if (point.time !== undefined) {
          const t = typeof point.time === 'number' ? point.time : new Date(point.time).getTime()
          if (t < minTime) minTime = t
          if (t > maxTime) maxTime = t
        }
      })
    })

    if (isFinite(minTime) && isFinite(maxTime)) {
      const slider = this.elements.timelineSlider as HTMLInputElement
      slider.min = '0'
      slider.max = '100'
      slider.value = '100'
      
      this.elements.timelineStart.textContent = this.formatTime(minTime)
      this.elements.timelineEnd.textContent = this.formatTime(maxTime)
      this.elements.timelineCurrent.textContent = `时间范围: ${this.formatTime(minTime)} - ${this.formatTime(maxTime)}`
      
      this.elements.topTimestamp.textContent = `⏱ ${this.formatTime(maxTime)}`
      
      const ticksEl = this.elements.timelineTicks
      ticksEl.innerHTML = ''
      const tickCount = 6
      for (let i = 0; i <= tickCount; i++) {
        const tick = document.createElement('span')
        const tickTime = minTime + (maxTime - minTime) * (i / tickCount)
        tick.textContent = this.formatTime(tickTime)
        ticksEl.appendChild(tick)
      }
      
      useDataStore.getState().setTimeRange({ start: minTime, end: maxTime })
    }
  }

  private handleTimelineChange(event: Event) {
    const slider = event.target as HTMLInputElement
    const percentage = parseInt(slider.value) / 100
    
    const state = useDataStore.getState()
    if (!state.timeRange) return

    const allSeries = state.datasets.flatMap(d => d.series)
    let minTime = Infinity
    let maxTime = -Infinity

    allSeries.forEach(series => {
      series.data.forEach(point => {
        if (point.time !== undefined) {
          const t = typeof point.time === 'number' ? point.time : new Date(point.time).getTime()
          if (t < minTime) minTime = t
          if (t > maxTime) maxTime = t
        }
      })
    })

    const currentMaxTime = minTime + (maxTime - minTime) * percentage
    
    const newRange = { start: minTime, end: currentMaxTime }
    useDataStore.getState().setTimeRange(newRange)
    
    this.elements.timelineCurrent.textContent = 
      `当前时间: ${this.formatTime(currentMaxTime)} / ${this.formatTime(maxTime)}`
    
    this.elements.topTimestamp.textContent = `⏱ ${this.formatTime(currentMaxTime)}`

    if (this.sceneManager) {
      this.sceneManager.updateTimeRange(newRange)
    }
  }

  private formatTime(timestamp: number): string {
    const date = new Date(timestamp)
    
    if (timestamp > 10000000000) {
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    return timestamp.toFixed(2)
  }

  private updateTimelineVisibility() {
    const state = useDataStore.getState()
    if (state.hasTimeDimension) {
      this.elements.timelineContainer.style.display = 'block'
    } else {
      this.elements.timelineContainer.style.display = 'none'
    }
  }

  private switchChartType(type: ChartType) {
    if (this.isTransitioning) return
    
    this.isTransitioning = true
    
    const buttons = this.elements.chartModeGroup.querySelectorAll('.btn')
    buttons.forEach(btn => {
      btn.classList.remove('active')
      if ((btn as HTMLElement).dataset.mode === type) {
        btn.classList.add('active')
      }
    })
    
    useDataStore.getState().setChartType(type)
    
    if (this.sceneManager) {
      this.sceneManager.transitionChartType(type)
    }
    
    setTimeout(() => {
      this.isTransitioning = false
    }, 600)
  }

  private updateSnapshotPanelVisibility() {
    const state = useDataStore.getState()
    if (state.snapshotPanelCollapsed) {
      this.elements.snapshotPanel.classList.add('collapsed')
      this.elements.snapshotToggle.textContent = '▶'
    } else {
      this.elements.snapshotPanel.classList.remove('collapsed')
      this.elements.snapshotToggle.textContent = '◀'
    }
  }

  private updateSnapshotList() {
    const state = useDataStore.getState()
    const list = this.elements.snapshotList
    
    if (state.snapshots.length === 0) {
      list.innerHTML = '<div class="empty-snapshot">暂无快照</div>'
      return
    }
    
    list.innerHTML = ''
    
    state.snapshots.forEach((snapshot, index) => {
      const item = document.createElement('div')
      item.className = 'snapshot-item'
      item.dataset.id = snapshot.id
      
      const date = new Date(snapshot.timestamp)
      const timeStr = date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      const seriesCount = snapshot.datasets.reduce(
        (sum, d) => sum + d.series.length, 0
      )
      
      const modeNames: Record<ChartType, string> = {
        bar: '柱状图',
        line: '折线图',
        scatter: '散点图'
      }
      
      item.innerHTML = `
        <span class="snapshot-delete" title="删除">×</span>
        <div class="snapshot-item-name">${snapshot.name}</div>
        <div class="snapshot-item-info">${modeNames[snapshot.chartType]} · ${seriesCount}个系列 · ${timeStr}</div>
      `
      
      item.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).classList.contains('snapshot-delete')) {
          e.stopPropagation()
          useDataStore.getState().deleteSnapshot(snapshot.id)
        } else {
          this.loadSnapshot(snapshot.id)
        }
      })
      
      list.appendChild(item)
    })
  }

  private saveCurrentSnapshot() {
    const state = useDataStore.getState()
    
    if (state.datasets.length === 0) {
      alert('当前没有数据，无法保存快照')
      return
    }
    
    if (this.sceneManager) {
      const viewState = this.sceneManager.getViewState()
      useDataStore.getState().setViewState(viewState)
    }
    
    const name = prompt('请输入快照名称:', `快照 ${state.snapshots.length + 1}`)
    if (name !== null) {
      useDataStore.getState().saveSnapshot(name || undefined)
    }
  }

  private loadSnapshot(id: string) {
    const fadeEl = this.elements.sceneFade
    fadeEl.classList.add('active')
    
    setTimeout(() => {
      const snapshot = useDataStore.getState().loadSnapshot(id)
      
      if (snapshot && this.sceneManager) {
        this.sceneManager.setViewState(snapshot.viewState)
        this.sceneManager.setAutoRotate(snapshot.viewState.autoRotate)
        
        useDataStore.getState().setChartType(snapshot.chartType)
        this.sceneManager.updateCharts(snapshot.datasets, snapshot.chartType, snapshot.timeRange)
        
        const buttons = this.elements.chartModeGroup.querySelectorAll('.btn')
        buttons.forEach(btn => {
          btn.classList.remove('active')
          if ((btn as HTMLElement).dataset.mode === snapshot.chartType) {
            btn.classList.add('active')
          }
        })
        
        if (snapshot.viewState.autoRotate) {
          this.elements.autoRotateBtn.classList.add('active')
        } else {
          this.elements.autoRotateBtn.classList.remove('active')
        }
      }
      
      setTimeout(() => {
        fadeEl.classList.remove('active')
      }, 500)
    }, 500)
  }

  private updateInfoCard() {
    const state = useDataStore.getState()
    const point = state.selectedPoint
    
    if (point) {
      this.elements.infoSeries.textContent = point.seriesName
      this.elements.infoX.textContent = this.formatValue(point.data.x)
      this.elements.infoY.textContent = this.formatValue(point.data.y)
      
      if (point.data.z !== undefined) {
        this.elements.infoZRow.style.display = 'flex'
        this.elements.infoZ.textContent = this.formatValue(point.data.z)
      } else {
        this.elements.infoZRow.style.display = 'none'
      }
      
      this.elements.infoCard.classList.add('visible')
    } else {
      this.elements.infoCard.classList.remove('visible')
    }
  }

  private formatValue(value: number | string): string {
    if (typeof value === 'number') {
      if (Math.abs(value) >= 1000) {
        return value.toLocaleString()
      }
      if (Math.abs(value) < 1 && value !== 0) {
        return value.toFixed(4)
      }
      return value.toFixed(2)
    }
    return String(value)
  }

  private updateLoadingOverlay() {
    const state = useDataStore.getState()
    
    if (state.isLoading) {
      this.elements.loadingOverlay.classList.add('visible')
      ;(this.elements.loadingBar as HTMLElement).style.width = `${state.loadingProgress}%`
    } else {
      this.elements.loadingOverlay.classList.remove('visible')
    }
  }

  public handlePointClick(point: { seriesId: string; pointIndex: number; data: DataPoint; seriesName: string } | null) {
    useDataStore.getState().setSelectedPoint(point)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
