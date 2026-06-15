import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Plus, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { calculateLoad, getAverageLoad } from '@/utils/loadBalancer';
import type { Task, TaskStatus } from '@/utils/types';
import Sidebar from '@/components/Sidebar';
import TaskBoard from '@/components/TaskBoard';
import TaskModal from '@/components/TaskModal';
import LoadBalance from '@/components/LoadBalance';
import Heatmap from '@/components/Heatmap';

const springConfig = {
  type: 'spring',
  stiffness: 400,
  damping: 28,
};

export default function App() {
  const {
    tasks,
    members,
    lanes,
    editingTask,
    heatmapData,
    sidebarCollapsed,
    rightPanelCollapsed,
    toggleSidebar,
    toggleRightPanel,
    updateTask,
    deleteTask,
    addTask,
    setEditingTask,
    renameLane,
    removeLane,
    reorderLanes,
    reorderTasksInLane,
    moveTaskToLane,
    reassignTask,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'load' | 'heatmap'>('load');

  const loadData = useMemo(() => calculateLoad(members, tasks), [members, tasks]);
  const averageLoad = useMemo(() => getAverageLoad(loadData), [loadData]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
  }, [setEditingTask]);

  const handleCloseModal = useCallback(() => {
    setEditingTask(null);
  }, [setEditingTask]);

  const handleSaveTask = useCallback(
    (task: Task) => {
      updateTask(task);
    },
    [updateTask]
  );

  const handleDeleteTask = useCallback(
    (id: string) => {
      deleteTask(id);
      setEditingTask(null);
    },
    [deleteTask, setEditingTask]
  );

  const handleAddTask = useCallback(
    (status: TaskStatus) => {
      addTask({
        title: '',
        description: '',
        assigneeId: null,
        priority: 'medium',
        estimatedHours: 4,
        status,
        dueDate: new Date().toISOString().split('T')[0],
      });
    },
    [addTask]
  );

  const handleApplySuggestion = useCallback(
    (taskId: string, newAssigneeId: string) => {
      reassignTask(taskId, newAssigneeId);
    },
    [reassignTask]
  );

  return (
    <div className="flex h-screen bg-[#f4f5f7] overflow-hidden">
      <Sidebar
        members={members}
        loadData={loadData}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        averageLoad={averageLoad}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-500" />
                项目看板
              </h1>
              <p className="text-xs text-gray-500">
                共 {tasks.length} 个任务 · {lanes.length} 个泳道
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddTask('todo')}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover-scale bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-md flex items-center gap-2"
            >
              <Plus size={16} />
              新建任务
            </button>

            <button
              onClick={toggleRightPanel}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {rightPanelCollapsed ? (
                <ChevronLeft size={20} className="text-gray-600" />
              ) : (
                <ChevronRight size={20} className="text-gray-600" />
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto">
            <TaskBoard
              tasks={tasks}
              lanes={lanes}
              members={members}
              onEditTask={handleEditTask}
              onAddTask={handleAddTask}
              onRenameLane={renameLane}
              onRemoveLane={removeLane}
              onReorderLanes={reorderLanes}
              onReorderTasksInLane={reorderTasksInLane}
              onMoveTaskToLane={moveTaskToLane}
            />
          </div>

          <AnimatePresence initial={false}>
            {!rightPanelCollapsed && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 340, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={springConfig}
                className="bg-white border-l border-gray-100 flex flex-col overflow-hidden shrink-0"
              >
                <div className="flex border-b border-gray-100">
                  <button
                    onClick={() => setActiveTab('load')}
                    className={`
                      flex-1 py-3 text-xs font-medium transition-colors
                      ${
                        activeTab === 'load'
                          ? 'text-indigo-600 border-b-2 border-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }
                    `}
                  >
                    负载均衡
                  </button>
                  <button
                    onClick={() => setActiveTab('heatmap')}
                    className={`
                      flex-1 py-3 text-xs font-medium transition-colors
                      ${
                        activeTab === 'heatmap'
                          ? 'text-indigo-600 border-b-2 border-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }
                    `}
                  >
                    热力图
                  </button>
                </div>

                <div className="flex-1 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="h-full overflow-hidden"
                    >
                      {activeTab === 'load' ? (
                        <LoadBalance
                          loadData={loadData}
                          members={members}
                          tasks={tasks}
                          averageLoad={averageLoad}
                          onReassignTask={reassignTask}
                          onApplySuggestion={handleApplySuggestion}
                        />
                      ) : (
                        <div className="h-full overflow-y-auto">
                          <Heatmap data={heatmapData} />
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </main>

      <TaskModal
        task={editingTask}
        members={members}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
