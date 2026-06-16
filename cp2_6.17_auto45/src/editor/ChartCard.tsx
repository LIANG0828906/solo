import { useState, memo } from 'react'
import { Settings, Trash2, X } from 'lucide-react'
import type { DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd'
import ChartRenderer from '../components/ChartRenderer'
import { useDashboardStore, colorThemes, type RefreshInterval, type ChartConfig } from '../data/DataStore'
import type { ColorThemeKey } from '../utils/mockData'

interface ChartCardProps {
  chart: ChartConfig
  index: number
  provided: DraggableProvided
  snapshot: DraggableStateSnapshot
  isPreview?: boolean
}

const chartTypeNames: Record<string, string> = {
  line: '折线图',
  bar: '柱状图',
  pie: '饼图',
  area: '面积图'
}

const ChartCard = memo(function ChartCard({
  chart,
  provided,
  snapshot,
  isPreview = false
}: ChartCardProps) {
  const [showConfig, setShowConfig] = useState(false)
  const [localDataSource, setLocalDataSource] = useState(chart.dataSourceId)
  const [localRefreshInterval, setLocalRefreshInterval] = useState<RefreshInterval>(chart.refreshInterval)
  const [localColorTheme, setLocalColorTheme] = useState<ColorThemeKey>(chart.colorTheme)

  const chartData = useDashboardStore(state => state.chartData[chart.id])
  const dataSources = useDashboardStore(state => state.dataSources)
  const removeChart = useDashboardStore(state => state.removeChart)
  const setDataSource = useDashboardStore(state => state.setDataSource)
  const setRefreshInterval = useDashboardStore(state => state.setRefreshInterval)
  const setColorTheme = useDashboardStore(state => state.setColorTheme)

  const handleOpenConfig = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLocalDataSource(chart.dataSourceId)
    setLocalRefreshInterval(chart.refreshInterval)
    setLocalColorTheme(chart.colorTheme)
    setShowConfig(true)
  }

  const handleCloseConfig = () => {
    setShowConfig(false)
  }

  const handleSaveConfig = () => {
    if (localDataSource !== chart.dataSourceId) {
      setDataSource(chart.id, localDataSource)
    }
    if (localRefreshInterval !== chart.refreshInterval) {
      setRefreshInterval(chart.id, localRefreshInterval)
    }
    if (localColorTheme !== chart.colorTheme) {
      setColorTheme(chart.id, localColorTheme)
    }
    setShowConfig(false)
  }

  const handleDelete = () => {
    removeChart(chart.id)
    setShowConfig(false)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseConfig()
    }
  }

  const cardClass = isPreview ? 'preview-chart-card' : 'chart-card'
  const draggableClass = snapshot.isDragging && !isPreview ? 'dragging' : ''

  if (!chartData) return null

  if (isPreview) {
    return (
      <div className={cardClass}>
        <div className="preview-chart-body">
          <ChartRenderer
            type={chart.type}
            data={chartData}
            colorTheme={chart.colorTheme}
            height={280}
            showLegend={true}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`${cardClass} ${draggableClass}`}
      >
        <div className="chart-card-header">
          <span className="chart-card-title">{chartTypeNames[chart.type]}</span>
          <div className="chart-card-actions">
            <button
              className="icon-btn"
              onClick={handleOpenConfig}
              title="配置"
            >
              <Settings size={16} />
            </button>
            <button
              className="icon-btn delete"
              onClick={(e) => {
                e.stopPropagation()
                removeChart(chart.id)
              }}
              title="删除"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div className="chart-card-body">
          <ChartRenderer
            type={chart.type}
            data={chartData}
            colorTheme={chart.colorTheme}
            height={140}
            showLegend={false}
          />
        </div>
      </div>

      <div
        className={`config-panel-overlay ${showConfig ? 'visible' : ''}`}
        onClick={handleOverlayClick}
      />
      <div className={`config-panel ${showConfig ? 'open' : ''}`}>
        <div className="config-panel-header">
          <h3 className="config-panel-title">图表配置 - {chartTypeNames[chart.type]}</h3>
          <button className="icon-btn" onClick={handleCloseConfig}>
            <X size={18} />
          </button>
        </div>

        <div className="config-panel-body">
          <div className="config-section">
            <label className="config-label">数据源</label>
            <select
              className="config-select"
              value={localDataSource}
              onChange={(e) => setLocalDataSource(e.target.value)}
            >
              {Object.values(dataSources).map(ds => (
                <option key={ds.id} value={ds.id}>
                  {ds.name}
                </option>
              ))}
            </select>
          </div>

          <div className="config-section">
            <label className="config-label">刷新间隔（秒）</label>
            <select
              className="config-select"
              value={localRefreshInterval}
              onChange={(e) => setLocalRefreshInterval(Number(e.target.value) as RefreshInterval)}
            >
              <option value={5}>5 秒</option>
              <option value={15}>15 秒</option>
              <option value={30}>30 秒</option>
              <option value={60}>60 秒</option>
            </select>
          </div>

          <div className="config-section">
            <label className="config-label">颜色主题</label>
            <div className="color-themes">
              {(Object.keys(colorThemes) as ColorThemeKey[]).map(themeKey => {
                const theme = colorThemes[themeKey]
                return (
                  <div
                    key={themeKey}
                    className={`color-theme-option ${localColorTheme === themeKey ? 'selected' : ''}`}
                    onClick={() => setLocalColorTheme(themeKey)}
                  >
                    <div
                      className="color-preview"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <span className="color-theme-name">{theme.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="config-panel-footer">
          <button className="btn-primary" onClick={handleSaveConfig}>
            保存配置
          </button>
          <button className="btn-danger" onClick={handleDelete}>
            删除图表
          </button>
        </div>
      </div>
    </>
  )
})

export default ChartCard
