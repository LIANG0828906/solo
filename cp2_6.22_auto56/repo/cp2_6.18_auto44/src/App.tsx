import React, { useState, useEffect } from 'react';
import { Menu, Plus } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import SearchFilter from '@/components/SearchFilter';
import TaskModal from '@/components/TaskModal';
import TaskBoard from '@/modules/taskBoard/TaskBoard';
import StatsDashboard from '@/modules/stats/StatsDashboard';
import { useTaskStore } from '@/store/taskStore';
import type { Task } from '@/types';

const App: React.FC = () => {
  const { currentProjectId } = useTaskStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalOpen(false);
        setEditingTask(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddTask = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="app-container">
      <button
        className="menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu size={18} />
      </button>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <StatsDashboard />

        {currentProjectId && (
          <div className="toolbar">
            <SearchFilter />
            <button className="add-task-btn" onClick={handleAddTask}>
              <Plus size={16} />
              添加任务
            </button>
          </div>
        )}

        <TaskBoard onEditTask={handleEditTask} />
      </main>

      <TaskModal
        task={editingTask}
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default App;
