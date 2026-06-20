import { useState, useEffect } from 'react';
import { BacklogPanel } from '@/modules/backlog/BacklogPanel';
import { SprintDashboard } from '@/modules/sprint/SprintDashboard';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { useAppStore } from '@/store/useAppStore';
import type { Task } from '@/types';
import styles from './App.module.css';

function App() {
  const { loadInitialData, isTaskModalOpen, selectedTaskId, closeTaskModal, tasks, teamMembers, updateTask } =
    useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCloseModal = () => {
    closeTaskModal();
  };

  const handleTaskSave = (taskData: Partial<Task>) => {
    if (selectedTaskId) {
      updateTask(selectedTaskId, taskData);
    }
    closeTaskModal();
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  return (
    <div className={styles.app}>
      <button
        className={styles.menuButton}
        onClick={toggleSidebar}
        aria-label="切换菜单"
      >
        <span />
        <span />
        <span />
      </button>

      <div
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
      >
        <BacklogPanel />
      </div>

      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={toggleSidebar}
        />
      )}

      <main className={styles.main}>
        <SprintDashboard />
      </main>

      <TaskDetailModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseModal}
        onSave={handleTaskSave}
        task={selectedTask}
        teamMembers={teamMembers}
      />
    </div>
  );
}

export default App;
