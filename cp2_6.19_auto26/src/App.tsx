import { useCallback, useState, useEffect } from 'react'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { addTaskToSprint } from '@/services/mockApi'
import { useAppStore } from '@/store/useAppStore'
import BacklogPanel from '@/modules/backlog/BacklogPanel'
import SprintDashboard from '@/modules/sprint/SprintDashboard'
import TaskDetailModal from '@/modules/TaskDetailModal'
import { Menu, X, Flame } from 'lucide-react'
import { clsx } from 'clsx'

export default function App() {
  const setEditingTaskId = useAppStore(s => s.setEditingTaskId)
  const sidebarOpen = useAppStore(s => s.sidebarOpen)
  const setSidebarOpen = useAppStore(s => s.setSidebarOpen)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleEditTask = useCallback((id: string) => {
    setEditingTaskId(id)
  }, [setEditingTaskId])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    const overId = String(over.id)

    const sprints = useAppStore.getState().sprints
    const targetSprint = sprints.find(s =>
      s.id === overId || s.taskIds.includes(overId)
    )

    if (targetSprint) {
      await addTaskToSprint(targetSprint.id, taskId)
    }
  }, [])

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="h-screen w-screen bg-primary flex overflow-hidden">
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={clsx(
            'h-full bg-secondary/80 backdrop-blur-xl border-r border-white/5 flex flex-col shrink-0',
            'w-[300px]',
            isMobile
              ? clsx(
                  'fixed top-0 left-0 z-30 transition-transform duration-300 ease-out',
                  sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                )
              : 'relative',
          )}
        >
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame size={20} className="text-accent" />
              <span className="text-sm font-bold text-text-primary">Sprint Tracker</span>
            </div>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <BacklogPanel
              onEditTask={handleEditTask}
              onDragEnd={async (taskId, sprintId) => {
                await addTaskToSprint(sprintId, taskId)
              }}
            />
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          {isMobile && (
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-accent" />
                <span className="text-sm font-bold text-text-primary">Sprint Tracker</span>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <SprintDashboard
              onEditTask={handleEditTask}
              onDragEnd={async (taskId, sprintId) => {
                await addTaskToSprint(sprintId, taskId)
              }}
            />
          </div>
        </main>

        <TaskDetailModal />
      </div>
    </DndContext>
  )
}
