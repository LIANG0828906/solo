import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DroppableProvided,
  type DroppableStateSnapshot
} from 'react-beautiful-dnd'
import {
  LineChart,
  BarChart3,
  PieChart,
  AreaChart,
  LayoutGrid,
  Save,
  Eye
} from 'lucide-react'
import ChartCard from './ChartCard'
import { useDashboardStore } from '../data/DataStore'
import type { ChartType } from '../utils/mockData'

interface ChartTypeOption {
  type: ChartType
  name: string
  description: string
  icon: React.ReactNode
}

const chartTypeOptions: ChartTypeOption[] = [
  {
    type: 'line',
    name: '折线图',
    description: '展示数据趋势变化',
    icon: <LineChart size={20} />
  },
  {
    type: 'bar',
    name: '柱状图',
    description: '对比分类数据',
    icon: <BarChart3 size={20} />
  },
  {
    type: 'pie',
    name: '饼图',
    description: '显示占比分布',
    icon: <PieChart size={20} />
  },
  {
    type: 'area',
    name: '面积图',
    description: '展示累计趋势',
    icon: <AreaChart size={20} />
  }
]

function LayoutArea({ onPreview }: { onPreview: () => void }) {
  const chartConfigs = useDashboardStore(state => state.chartConfigs)
  const addChart = useDashboardStore(state => state.addChart)
  const reorderCharts = useDashboardStore(state => state.reorderCharts)

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    if (source.droppableId === 'sidebar' && destination.droppableId === 'layout') {
      const chartType = draggableId.replace('sidebar-', '') as ChartType
      addChart(chartType, destination.index)
      return
    }

    if (source.droppableId === 'layout' && destination.droppableId === 'layout') {
      reorderCharts(source.index, destination.index)
    }
  }, [addChart, reorderCharts])

  const renderDroppable = (
    provided: DroppableProvided,
    snapshot: DroppableStateSnapshot
  ) => (
    <div
      ref={provided.innerRef}
      {...provided.droppableProps}
      className={`charts-grid ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
    >
      {chartConfigs.length === 0 && !snapshot.isDraggingOver && (
        <div className="empty-state" style={{ width: '100%' }}>
          <LayoutGrid className="empty-state-icon" />
          <div className="empty-state-text">暂无图表</div>
          <div className="empty-state-hint">从左侧拖拽图表类型到此处开始构建仪表盘</div>
        </div>
      )}

      {chartConfigs.map((chart, index) => (
        <Draggable key={chart.id} draggableId={chart.id} index={index}>
          {(provided, snapshot) => (
            <ChartCard
              chart={chart}
              index={index}
              provided={provided}
              snapshot={snapshot}
            />
          )}
        </Draggable>
      ))}

      {provided.placeholder}
    </div>
  )

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="dashboard-container">
        <div className="sidebar">
          <h2 className="sidebar-title">图表类型</h2>
          <Droppable droppableId="sidebar" isDropDisabled={true}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                {chartTypeOptions.map((option, index) => (
                  <Draggable
                    key={option.type}
                    draggableId={`sidebar-${option.type}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`chart-type-item ${snapshot.isDragging ? 'dragging' : ''}`}
                      >
                        <div className="chart-type-icon">
                          {option.icon}
                        </div>
                        <div className="chart-type-info">
                          <div className="chart-type-name">{option.name}</div>
                          <div className="chart-type-desc">{option.description}</div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        <div className="main-content">
          <div className="editor-header">
            <button
              className="btn-primary"
              onClick={() => {
                alert('布局已保存！')
              }}
            >
              <Save size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
              保存布局
            </button>
            <button
              className="btn-secondary"
              onClick={onPreview}
            >
              <Eye size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
              预览仪表盘
            </button>
          </div>

          <div className="layout-area">
            <Droppable droppableId="layout" direction="horizontal">
              {renderDroppable}
            </Droppable>
          </div>
        </div>
      </div>
    </DragDropContext>
  )
}

export default function DashboardEditor() {
  const navigate = useNavigate()

  const handlePreview = () => {
    const store = useDashboardStore.getState()
    if (store.chartConfigs.length === 0) {
      alert('请先添加至少一个图表')
      return
    }
    navigate('/preview')
  }

  return <LayoutArea onPreview={handlePreview} />
}
