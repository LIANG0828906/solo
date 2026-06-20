import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { TaskCard } from './components/TaskCard'
import { DependencyGraph } from './components/DependencyGraph'
import { useTaskStore, TaskStatus } from './hooks/useTaskStore'

const statusLabels: Record<TaskStatus, string> = {
  todo: '待办',
  'in-progress': '进行中',
  done: '已完成',
}

const statusFilterOptions: Array<'all' | TaskStatus> = [
  'all',
  'todo',
  'in-progress',
  'done',
]

function App() {
  const [sidebarWidth, setSidebarWidth] = useState(400)
  const [isResizing, setIsResizing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [graphSize, setGraphSize] = useState({ width: 0, height: 0 })
  const graphContainerRef = useRef<HTMLDivElement | null>(null)

  const tasks = useTaskStore((s) => s.tasks)
  const addTask = useTaskStore((s) => s.addTask)
  const addDependency = useTaskStore((s) => s.addDependency)
  const topologicalSort = useTaskStore((s) => s.topologicalSort)
  const loadFromStorage = useTaskStore((s) => s.loadFromStorage)
  const resetAll = useTaskStore((s) => s.resetAll)
  const searchQuery = useTaskStore((s) => s.searchQuery)
  const setSearchQuery = useTaskStore((s) => s.setSearchQuery)
  const statusFilter = useTaskStore((s) => s.statusFilter)
  const setStatusFilter = useTaskStore((s) => s.setStatusFilter)
  const highlightedTaskId = useTaskStore((s) => s.highlightedTaskId)
  const getDownstreamTasks = useTaskStore((s) => s.getDownstreamTasks)
  const getUpstreamTasks = useTaskStore((s) => s.getUpstreamTasks)
  const detectCycles = useTaskStore((s) => s.detectCycles)

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8,
    },
  })

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 5,
    },
  })

  const sensors = useSensors(mouseSensor, touchSensor)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const updateGraphSize = () => {
      const container = document.getElementById('graph-container')
      if (container) {
        setGraphSize({
          width: container.clientWidth,
          height: container.clientHeight,
        })
      }
    }

    updateGraphSize()
    window.addEventListener('resize', updateGraphSize)
    return () => window.removeEventListener('resize', updateGraphSize)
  }, [sidebarWidth, isSidebarOpen, isMobile])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = Math.max(250, Math.min(600, e.clientX))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  const sortedTasks = useMemo(() => {
    const sorted = topologicalSort()
    detectCycles()
    return sorted.filter((t) => {
      const matchesSearch =
        !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [topologicalSort, searchQuery, statusFilter, detectCycles])

  const activeTask = useMemo(() => {
    if (!activeId) return null
    return tasks.find((t) => t.id === activeId) || null
  }, [activeId, tasks])

  const getHighlightType = useCallback(
    (taskId: string): 'upstream' | 'downstream' | null => {
      if (!highlightedTaskId) return null
      const downstream = getDownstreamTasks(highlightedTaskId)
      const upstream = getUpstreamTasks(highlightedTaskId)
      if (downstream.includes(taskId)) return 'downstream'
      if (upstream.includes(taskId)) return 'upstream'
      return null
    },
    [highlightedTaskId, getDownstreamTasks, getUpstreamTasks]
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const sourceId = active.id as string
      const targetId = over.id as string
      addDependency(sourceId, targetId)
    }
  }

  const handleAddTask = () => {
    const today = new Date().toISOString().split('T')[0]
    addTask({
      name: '新任务',
      status: 'todo',
      dueDate: today,
    })
  }

  const handleReset = () => {
    if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
      resetAll()
    }
  }

  const sidebarStyle = isMobile
    ? { width: '100%', height: isSidebarOpen ? 'auto' : '60px' }
    : { width: `${sidebarWidth}px` }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="app-container">
        <aside className="sidebar" style={sidebarStyle}>
          <div className="sidebar-header">
            <h2 className="app-title">任务依赖看板</h2>
            {isMobile && (
              <button
                className="toggle-sidebar-btn"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? '收起' : '展开'}
              </button>
            )}
          </div>

          {(!isMobile || isSidebarOpen) && (
            <>
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="搜索任务..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-buttons">
                {statusFilterOptions.map((filter) => (
                  <button
                    key={filter}
                    className={`filter-btn ${
                      statusFilter === filter ? 'active' : ''
                    }`}
                    onClick={() => setStatusFilter(filter)}
                  >
                    {filter === 'all' ? '全部' : statusLabels[filter]}
                  </button>
                ))}
              </div>

              <div className="task-list-container">
                <div className="task-list">
                  {sortedTasks.map((task) => (
                    <div key={task.id} className="sidebar-card-wrapper">
                      <TaskCard
                        task={task}
                        isHighlighted={highlightedTaskId === task.id}
                        highlightType={getHighlightType(task.id)}
                        draggable={true}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="sidebar-footer">
                <button className="btn-primary" onClick={handleAddTask}>
                  + 新增任务
                </button>
                <button className="btn-danger" onClick={handleReset}>
                  清空数据
                </button>
              </div>
            </>
          )}
        </aside>

        {!isMobile && (
          <div
            className={`resizer ${isResizing ? 'active' : ''}`}
            onMouseDown={handleMouseDown}
          />
        )}

        <main
          id="graph-container"
          ref={graphContainerRef}
          className="graph-container"
        >
          {graphSize.width > 0 && graphSize.height > 0 && (
            <DependencyGraph
              width={graphSize.width}
              height={graphSize.height}
            />
          )}
        </main>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="drag-overlay-card">
            <TaskCard task={activeTask} draggable={false} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default App
