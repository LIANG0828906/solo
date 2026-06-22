import { useEffect, useState, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import GanttChart from './components/GanttChart';
import KanbanBoard from './components/KanbanBoard';
import TaskModal from './components/TaskModal';
import MilestoneModal from './components/MilestoneModal';
import Sidebar from './components/Sidebar';

function App() {
  const {
    fetchTasks,
    fetchDependencies,
    fetchMilestones,
    updateTaskStatus,
    isTaskModalOpen,
    isMilestoneModalOpen,
    addTask,
    addMilestone,
    zoomLevel,
    setZoomLevel,
    tasks,
  } = useAppStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    fetchTasks();
    fetchDependencies();
    fetchMilestones();
  }, [fetchTasks, fetchDependencies, fetchMilestones]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    if (overId === 'todo' || overId === 'in-progress' || overId === 'done') {
      const status = overId as 'todo' | 'in-progress' | 'done';
      updateTaskStatus(taskId, status);
    }
  }, [updateTaskStatus]);

  const handleNewTask = () => {
    const today = new Date();
    const endDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    addTask({
      title: '新任务',
      description: '',
      status: 'todo',
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      progress: 0,
      dependencies: [],
      attachments: [],
    });
  };

  const handleNewMilestone = () => {
    const today = new Date();
    addMilestone({
      name: '新里程碑',
      description: '',
      date: today.toISOString().split('T')[0],
    });
  };

  const handleZoomIn = () => {
    setZoomLevel(zoomLevel + 0.2);
  };

  const handleZoomOut = () => {
    setZoomLevel(zoomLevel - 0.2);
  };

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  const ganttHeightRatio = isMobile ? 0.35 : (isTablet ? 0.4 : 0.45);

  const activeTask = tasks.find((t) => t.id === activeId);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        overflow: 'hidden',
      }}>
        <Sidebar />
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FAFAFA',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            padding: isMobile ? '12px 16px' : '16px 24px',
            borderBottom: '1px solid #E0E0E0',
            backgroundColor: '#FFFFFF',
            flexWrap: 'wrap',
            flexShrink: 0,
          }}>
            <button
              onClick={handleNewTask}
              style={{
                padding: isMobile ? '6px 12px' : '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#1976D2',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: isMobile ? '12px' : '14px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1565C0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1976D2'; }}
            >
              新建任务
            </button>
            <button
              onClick={handleNewMilestone}
              style={{
                padding: isMobile ? '6px 12px' : '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#1976D2',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: isMobile ? '12px' : '14px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1565C0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1976D2'; }}
            >
              新建里程碑
            </button>
            <button
              onClick={handleZoomIn}
              style={{
                padding: isMobile ? '6px 12px' : '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#1976D2',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: isMobile ? '12px' : '14px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1565C0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1976D2'; }}
            >
              放大时间轴
            </button>
            <button
              onClick={handleZoomOut}
              style={{
                padding: isMobile ? '6px 12px' : '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#1976D2',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: isMobile ? '12px' : '14px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1565C0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1976D2'; }}
            >
              缩小时间轴
            </button>
          </div>

          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
          }}>
            <div style={{
              height: `${ganttHeightRatio * 100}%`,
              minHeight: isMobile ? '180px' : '280px',
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              <GanttChart />
            </div>
            <div style={{
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
            }}>
              <KanbanBoard />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isTaskModalOpen && <TaskModal />}
      </AnimatePresence>

      <AnimatePresence>
        {isMilestoneModalOpen && <MilestoneModal />}
      </AnimatePresence>

      <DragOverlay>
        {activeTask ? (
          <div
            style={{
              width: '180px',
              backgroundColor: '#E8F5E9',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
              opacity: 0.9,
              transform: 'scale(1.02)',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
              {activeTask.title}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default App;
