import React, { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTasks,
  fetchTeamMembers,
  createTask,
  reorderTasks,
  fetchStats,
} from './api';
import { TaskStatus, statusLabels } from './types';
import KanbanColumn from './components/KanbanColumn';
import StatsPanel from './components/StatsPanel';
import CreateTaskModal from './components/CreateTaskModal';

const App: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<TaskStatus>('todo');
  const [statsExpanded, setStatsExpanded] = useState(false);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  const { data: teamMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: fetchTeamMembers,
  });

  const { data: stats = [], isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: (data) => {
      queryClient.setQueryData(['tasks'], data);
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderTasks,
    onSuccess: (data) => {
      queryClient.setQueryData(['tasks'], data);
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const filteredTasks = selectedMemberId
    ? tasks.filter((t) => t.assigneeId === selectedMemberId)
    : tasks;

  const tasksByStatus = (status: TaskStatus) =>
    filteredTasks.filter((t) => t.status === status);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    reorderMutation.mutate({
      taskId: draggableId,
      sourceStatus: source.droppableId as TaskStatus,
      destinationStatus: destination.droppableId as TaskStatus,
      destinationIndex: destination.index,
    });
  };

  const handleCreateTask = (taskData: any) => {
    createMutation.mutate(taskData);
  };

  const selectedMember = teamMembers.find((m) => m.id === selectedMemberId);

  const mobileColumns: TaskStatus[] = ['todo', 'in-progress', 'done'];

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title">
          <span>📋</span>
          <span>任务看板系统</span>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <span>+</span>
            <span>新建任务</span>
          </button>
        </div>
      </header>

      <main className="main-content">
        {selectedMemberId && (
          <div className="filter-bar">
            <div className="filter-tag">
              <span>
                筛选: {selectedMember?.name} 的任务
              </span>
              <button onClick={() => setSelectedMemberId(null)}>×</button>
            </div>
          </div>
        )}

        <div className="mobile-tabs">
          {mobileColumns.map((status) => (
            <button
              key={status}
              className={`mobile-tab ${activeMobileTab === status ? 'active' : ''}`}
              onClick={() => setActiveMobileTab(status)}
            >
              {statusLabels[status]} ({tasksByStatus(status).length})
            </button>
          ))}
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            <div style={{ display: 'contents' }} className="hide-on-mobile">
              <KanbanColumn
                status="todo"
                tasks={tasksByStatus('todo')}
                teamMembers={teamMembers}
                isLoading={tasksLoading || membersLoading}
              />
              <KanbanColumn
                status="in-progress"
                tasks={tasksByStatus('in-progress')}
                teamMembers={teamMembers}
                isLoading={tasksLoading || membersLoading}
              />
              <KanbanColumn
                status="done"
                tasks={tasksByStatus('done')}
                teamMembers={teamMembers}
                isLoading={tasksLoading || membersLoading}
              />
            </div>

            <div style={{ display: 'none' }} className="show-on-mobile">
              <KanbanColumn
                status={activeMobileTab}
                tasks={tasksByStatus(activeMobileTab)}
                teamMembers={teamMembers}
                isLoading={tasksLoading || membersLoading}
              />
            </div>
          </div>
        </DragDropContext>

        <div className="stats-accordion">
          <button
            onClick={() => setStatsExpanded(!statsExpanded)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: '#333',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
            }}
          >
            <span>📊 数据统计</span>
            <span style={{ transition: 'transform 0.3s', transform: statsExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
              ▼
            </span>
          </button>
          {statsExpanded && (
            <div style={{ marginTop: 10, animation: 'fadeInUp 0.3s ease-out' }}>
              <StatsPanel
                tasks={filteredTasks}
                teamMembers={teamMembers}
                stats={stats}
                selectedMemberId={selectedMemberId}
                onSelectMember={setSelectedMemberId}
              />
            </div>
          )}
        </div>

        <div className="stats-panel-desktop">
          <StatsPanel
            tasks={filteredTasks}
            teamMembers={teamMembers}
            stats={stats}
            selectedMemberId={selectedMemberId}
            onSelectMember={setSelectedMemberId}
          />
        </div>
      </main>

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
        teamMembers={teamMembers}
      />

      <style>{`
        @media (min-width: 769px) {
          .show-on-mobile {
            display: none !important;
          }
          .hide-on-mobile {
            display: contents !important;
          }
        }
        @media (max-width: 768px) {
          .show-on-mobile {
            display: block !important;
            width: 100%;
          }
          .hide-on-mobile {
            display: none !important;
          }
          .stats-panel-desktop {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
