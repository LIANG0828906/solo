import { useState, useMemo } from 'react';
import { BurndownChart } from './BurndownChart';
import { TaskCard } from '../backlog/TaskCard';
import { useAppStore } from '@/store/useAppStore';
import type { Task, Sprint } from '@/types';
import styles from './sprint.module.css';

export function SprintDashboard() {
  const {
    sprints,
    teamMembers,
    addSprint,
    updateTask,
    getSprintTasks,
    currentSprintId,
    setCurrentSprint,
    openTaskModal,
  } = useAppStore();

  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [newSprintName, setNewSprintName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newTeamMembers, setNewTeamMembers] = useState<string[]>([]);

  const selectedSprint = useMemo(
    () => sprints.find((s: Sprint) => s.id === currentSprintId) || null,
    [sprints, currentSprintId]
  );

  const sprintTasks = useMemo(
    () => (currentSprintId ? getSprintTasks(currentSprintId) : []),
    [currentSprintId, getSprintTasks]
  );

  const sprintTeamMembers = useMemo(() => {
    if (!selectedSprint) return [];
    return teamMembers.filter((m) => selectedSprint.teamMembers.includes(m.id));
  }, [selectedSprint, teamMembers]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && currentSprintId) {
      updateTask(taskId, { sprintId: currentSprintId });
    }
  };

  const handleTaskClick = (task: Task) => {
    openTaskModal(task.id);
  };

  const handleCreateSprint = () => {
    if (newSprintName && newStartDate && newEndDate) {
      addSprint({
        name: newSprintName,
        startDate: newStartDate,
        endDate: newEndDate,
        teamMembers: newTeamMembers,
      });
      setIsCreateSprintOpen(false);
      setNewSprintName('');
      setNewStartDate('');
      setNewEndDate('');
      setNewTeamMembers([]);
    }
  };

  const handleTeamMemberToggle = (memberId: string) => {
    setNewTeamMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  if (!selectedSprint) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>暂无冲刺，点击"创建冲刺"开始</p>
        <button
          className={styles.createButton}
          onClick={() => setIsCreateSprintOpen(true)}
        >
          创建冲刺
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <select
            className={styles.sprintSelect}
            value={currentSprintId || ''}
            onChange={(e) => setCurrentSprint(e.target.value || null)}
          >
            {sprints.map((sprint: Sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name}
              </option>
            ))}
          </select>
          <div className={styles.sprintInfo}>
            <span className={styles.dateRange}>
              {selectedSprint.startDate} ~ {selectedSprint.endDate}
            </span>
            <div className={styles.teamMembers}>
              {sprintTeamMembers.map((member) => (
                <span key={member.id} className={styles.memberBadge}>
                  {member.name}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          className={styles.createButton}
          onClick={() => setIsCreateSprintOpen(true)}
        >
          创建冲刺
        </button>
      </div>

      <div className={styles.chartSection}>
        {currentSprintId && (
          <BurndownChart
            sprintId={currentSprintId}
            sprintTasks={sprintTasks}
            teamMembers={sprintTeamMembers}
          />
        )}
      </div>

      <div
        className={`${styles.taskSection} ${isDragOver ? styles.dragOver : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={styles.taskSectionHeader}>
          <h3 className={styles.taskSectionTitle}>冲刺任务</h3>
          <span className={styles.taskCount}>{sprintTasks.length} 个任务</span>
        </div>
        {sprintTasks.length === 0 ? (
          <div className={styles.emptyTasks}>
            <p>拖拽任务到此处添加到冲刺</p>
          </div>
        ) : (
          <div className={styles.taskGrid}>
            {sprintTasks.map((task: Task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={handleTaskClick}
              />
            ))}
          </div>
        )}
      </div>

      {isCreateSprintOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateSprintOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>创建冲刺</h3>
            <div className={styles.form}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>冲刺名称</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  placeholder="请输入冲刺名称"
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>开始日期</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>结束日期</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>团队成员</label>
                <div className={styles.memberCheckboxes}>
                  {teamMembers.map((member) => (
                    <label
                      key={member.id}
                      className={`${styles.memberCheckbox} ${
                        newTeamMembers.includes(member.id) ? styles.checked : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newTeamMembers.includes(member.id)}
                        onChange={() => handleTeamMemberToggle(member.id)}
                        style={{ display: 'none' }}
                      />
                      <span>{member.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => setIsCreateSprintOpen(false)}
                >
                  取消
                </button>
                <button className={styles.confirmButton} onClick={handleCreateSprint}>
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SprintDashboard;
