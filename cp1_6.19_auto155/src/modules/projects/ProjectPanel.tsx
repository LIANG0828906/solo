import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type Project, type Priority } from '../shared/StoreContext';
import { allocateTime } from '../scheduler/TimeAllocator';
import { BudgetBar } from '../scheduler/BudgetBar';
import { ProjectForm } from './ProjectForm';
import { eventBus, PROJECTS_UPDATED } from '../shared/EventBus';

type FilterPriority = 'all' | Priority;
type SortOption = 'deadline' | 'deviation';

const priorityColors: Record<Priority, string> = {
  high: '#FF4757',
  medium: '#FFA502',
  low: '#2ED573',
};

const priorityLabels: Record<Priority, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

function getDaysRemaining(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getDeviationColor(deviationPercent: number): string {
  const absDeviation = Math.abs(deviationPercent);
  if (absDeviation <= 10) return '#2ED573';
  if (absDeviation <= 30) return '#FFA502';
  return '#FF4757';
}

export function ProjectPanel() {
  const { state, addProject, updateProject, deleteProject, updateHoursInvested, setDailyAvailableHours } = useAppStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [sortOption, setSortOption] = useState<SortOption>('deadline');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [allocations, setAllocations] = useState(() => allocateTime(state.projects, state.dailyAvailableHours));
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  useEffect(() => {
    const unsubscribe = eventBus.on(PROJECTS_UPDATED, (data: unknown) => {
      const appState = data as { projects: Project[]; dailyAvailableHours: number };
      const newAllocations = allocateTime(appState.projects, appState.dailyAvailableHours);
      setAllocations(newAllocations);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const newAllocations = allocateTime(state.projects, state.dailyAvailableHours);
    setAllocations(newAllocations);
  }, [state.projects, state.dailyAvailableHours]);

  const getDeviationForProject = useCallback(
    (projectId: string): number => {
      const allocation = allocations.find((a) => a.projectId === projectId);
      return allocation?.deviationPercent ?? 0;
    },
    [allocations]
  );

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...state.projects];

    if (filterPriority !== 'all') {
      result = result.filter((p) => p.priority === filterPriority);
    }

    result.sort((a, b) => {
      if (sortOption === 'deadline') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      } else {
        return Math.abs(getDeviationForProject(b.id)) - Math.abs(getDeviationForProject(a.id));
      }
    });

    return result;
  }, [state.projects, filterPriority, sortOption, getDeviationForProject]);

  const handleAddProject = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const handleCardClick = (project: Project) => {
    if (!isLongPress.current) {
      setEditingProject(project);
      setIsFormOpen(true);
    }
    isLongPress.current = false;
  };

  const handleMouseDown = (projectId: string) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setDeleteConfirm(projectId);
    }, 600);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleSubmit = (data: {
    name: string;
    deadline: string;
    totalTasks: number;
    priority: Priority;
  }) => {
    if (editingProject) {
      updateProject({
        ...editingProject,
        ...data,
      });
    } else {
      addProject(data);
    }
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteProject(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const handleHoursChange = (projectId: string, value: string) => {
    const hours = parseFloat(value);
    if (!isNaN(hours) && hours >= 0) {
      updateHoursInvested(projectId, Math.round(hours * 10) / 10);
    }
  };

  const handleDailyHoursChange = (delta: number) => {
    const newHours = Math.max(0.5, Math.min(24, state.dailyAvailableHours + delta));
    setDailyAvailableHours(newHours);
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>项目看板</h1>
      </header>

      <div style={styles.mainContent} className="main-content">
        <div style={styles.projectsSection}>
          <div style={styles.filterBar} className="filter-bar">
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>筛选：</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
                style={styles.select}
              >
                <option value="all">全部</option>
                <option value="high">高优先级</option>
                <option value="medium">中优先级</option>
                <option value="low">低优先级</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>排序：</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                style={styles.select}
              >
                <option value="deadline">按截止日期</option>
                <option value="deviation">按偏差程度</option>
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddProject}
              style={styles.addButton}
              className="add-button"
            >
              + 添加项目
            </motion.button>
          </div>

          <motion.div layout style={styles.cardsContainer} className="cards-container">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedProjects.map((project) => {
                const remainingTasks = project.totalTasks - project.completedTasks;
                const daysRemaining = getDaysRemaining(project.deadline);
                const deviation = getDeviationForProject(project.id);
                const deviationColor = getDeviationColor(deviation);

                return (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -4, boxShadow: '0 8px 25px rgba(0, 0, 0, 0.25)' }}
                    style={{
                      ...styles.card,
                      borderLeftColor: priorityColors[project.priority],
                    }}
                    onClick={() => handleCardClick(project)}
                    onMouseDown={() => handleMouseDown(project.id)}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={() => handleMouseDown(project.id)}
                    onTouchEnd={handleMouseUp}
                  >
                    <div style={styles.cardHeader}>
                      <div
                        style={{
                          ...styles.deviationDot,
                          backgroundColor: deviationColor,
                        }}
                      />
                      <span style={styles.priorityLabel}>
                        {priorityLabels[project.priority]}
                      </span>
                    </div>

                    <h3 style={styles.projectName}>{project.name}</h3>

                    <div style={styles.statsRow}>
                      <div style={styles.statItem}>
                        <span style={styles.statLabel}>剩余任务</span>
                        <span style={styles.statValueRed}>{remainingTasks}</span>
                      </div>
                      <div style={styles.statItem}>
                        <span style={styles.statLabel}>剩余天数</span>
                        <span style={styles.statValueBlue}>{daysRemaining}</span>
                      </div>
                    </div>

                    <div style={styles.hoursInputRow}>
                      <label style={styles.hoursLabel}>已投入（小时）</label>
                      <input
                        type="number"
                        value={project.hoursInvested}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleHoursChange(project.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        step="0.1"
                        min="0"
                        style={styles.hoursInput}
                      />
                    </div>

                    {deviation !== 0 && (
                      <div style={styles.deviationRow}>
                        <span style={{ ...styles.deviationText, color: deviationColor }}>
                          偏差: {deviation > 0 ? '+' : ''}{deviation}%
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {filteredAndSortedProjects.length === 0 && (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>暂无项目</p>
              <p style={styles.emptySubText}>点击"添加项目"按钮开始管理您的项目</p>
            </div>
          )}
        </div>

        <aside style={styles.sidebar} className="sidebar">
          <div style={styles.sidebarHeader}>
            <h2 style={styles.sidebarTitle}>时间预算</h2>
          </div>

          <div style={styles.dailyHoursSection}>
            <label style={styles.dailyHoursLabel}>每日可用时长</label>
            <div style={styles.dailyHoursControl}>
              <button
                onClick={() => handleDailyHoursChange(-0.5)}
                style={styles.hoursBtn}
              >
                -
              </button>
              <span style={styles.dailyHoursValue}>
                {state.dailyAvailableHours.toFixed(1)}h
              </span>
              <button
                onClick={() => handleDailyHoursChange(0.5)}
                style={styles.hoursBtn}
              >
                +
              </button>
            </div>
          </div>

          <BudgetBar allocations={allocations} dailyAvailableHours={state.dailyAvailableHours} />
        </aside>
      </div>

      <ProjectForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        editingProject={editingProject}
      />

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.confirmOverlay}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={styles.confirmDialog}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={styles.confirmTitle}>确认删除</h3>
              <p style={styles.confirmMessage}>确定要删除这个项目吗？此操作无法撤销。</p>
              <div style={styles.confirmActions}>
                <button onClick={() => setDeleteConfirm(null)} style={styles.confirmCancel}>
                  取消
                </button>
                <button onClick={handleDelete} style={styles.confirmDelete}>
                  删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#1E1E2E',
    color: '#FFFFFF',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    height: '60px',
    backgroundColor: '#2B2D42',
    display: 'flex',
    alignItems: 'center',
    padding: '0 32px',
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: 700,
    margin: 0,
    color: '#FFFFFF',
  },
  mainContent: {
    display: 'flex',
    gap: '24px',
    padding: '24px 32px',
  },
  projectsSection: {
    flex: 1,
    minWidth: 0,
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterLabel: {
    color: '#888899',
    fontSize: '14px',
  },
  select: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2B2D42',
    color: '#FFFFFF',
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none',
  },
  addButton: {
    marginLeft: 'auto',
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cardsContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '20px',
  },
  card: {
    width: '280px',
    height: '180px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    borderLeft: '4px solid',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative' as const,
    userSelect: 'none' as const,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  deviationDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.3)',
  },
  priorityLabel: {
    fontSize: '12px',
    color: '#666666',
    fontWeight: 500,
  },
  projectName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A2E',
    margin: '0 0 16px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  statsRow: {
    display: 'flex',
    gap: '24px',
    marginBottom: '12px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  statLabel: {
    fontSize: '11px',
    color: '#888888',
  },
  statValueRed: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#FF4757',
  },
  statValueBlue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#3B82F6',
  },
  hoursInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: 'auto',
  },
  hoursLabel: {
    fontSize: '11px',
    color: '#888888',
  },
  hoursInput: {
    width: '80px',
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #E0E0E0',
    fontSize: '13px',
    color: '#1A1A2E',
    outline: 'none',
  },
  deviationRow: {
    marginTop: '4px',
  },
  deviationText: {
    fontSize: '11px',
    fontWeight: 600,
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
  emptyText: {
    color: '#888899',
    fontSize: '18px',
    fontWeight: 500,
    margin: '0 0 8px 0',
  },
  emptySubText: {
    color: '#666677',
    fontSize: '14px',
    margin: 0,
  },
  sidebar: {
    width: '320px',
    flexShrink: 0,
    backgroundColor: '#252538',
    borderRadius: '16px',
    padding: '20px',
    height: 'fit-content',
  },
  sidebarHeader: {
    marginBottom: '20px',
  },
  sidebarTitle: {
    fontSize: '20px',
    fontWeight: 700,
    margin: 0,
    color: '#FFFFFF',
  },
  dailyHoursSection: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#1E1E2E',
    borderRadius: '12px',
  },
  dailyHoursLabel: {
    display: 'block',
    color: '#888899',
    fontSize: '13px',
    marginBottom: '12px',
  },
  dailyHoursControl: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  hoursBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3A3D5C',
    color: '#FFFFFF',
    fontSize: '20px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  dailyHoursValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#FFFFFF',
    minWidth: '80px',
    textAlign: 'center' as const,
  },
  confirmOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  confirmDialog: {
    backgroundColor: '#2B2D42',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '360px',
    width: '100%',
    textAlign: 'center' as const,
  },
  confirmTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#FFFFFF',
    margin: '0 0 12px 0',
  },
  confirmMessage: {
    fontSize: '14px',
    color: '#888899',
    margin: '0 0 24px 0',
  },
  confirmActions: {
    display: 'flex',
    gap: '12px',
  },
  confirmCancel: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3A3D5C',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  confirmDelete: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#FF4757',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
