import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MemberAvatar } from '../components/MemberAvatar';
import { TaskCard } from '../components/TaskCard';
import { Modal } from '../components/Modal';
import type { GroupingMethod } from '../types';
import { parseSimpleMarkdown } from '../utils/markdown';
import '../styles/TaskTimeline.css';

export function TaskTimeline() {
  const { id: classId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getClassById, getTaskById, tasks, currentUser, users, createTask } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState<string | null>(null);
  const [taskName, setTaskName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [groupingMethod, setGroupingMethod] = useState<GroupingMethod>('random');

  const classItem = classId ? getClassById(classId) : undefined;
  const classTasks = tasks.filter((t) => t.classId === classId);
  const classMembers = classItem
    ? users.filter((u) => classItem.members.includes(u.id))
    : [];

  const handleCreateTask = () => {
    if (!classId || !taskName.trim() || !deadline) return;

    createTask(classId, {
      name: taskName.trim(),
      description,
      deadline: new Date(deadline).toISOString(),
      groupingMethod,
    });

    setTaskName('');
    setDeadline('');
    setDescription('');
    setGroupingMethod('random');
    setShowCreateModal(false);
  };

  const handleTaskClick = (taskId: string) => {
    const task = getTaskById(taskId);
    if (!task) return;

    if (task.status === 'in-progress') {
      navigate(`/task/${taskId}/submit`);
    } else if (task.status === 'reviewing') {
      navigate(`/task/${taskId}/review`);
    } else if (task.status === 'completed') {
      navigate(`/task/${taskId}/results`);
    } else {
      setShowTaskDetail(taskId);
    }
  };

  const selectedTask = showTaskDetail ? getTaskById(showTaskDetail) : null;

  if (!classItem) {
    return (
      <div className="task-timeline page-enter">
        <div className="task-timeline__empty">班级不存在</div>
      </div>
    );
  }

  const sortedTasks = [...classTasks].sort(
    (a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
  );

  return (
    <div className="task-timeline page-enter">
      <div className="task-timeline__header">
        <button className="task-timeline__back" onClick={() => navigate('/classes')}>
          ← 返回
        </button>
        <div className="task-timeline__class-info">
          <h1 className="task-timeline__class-name">{classItem.name}</h1>
          <p className="task-timeline__class-meta">
            {classItem.memberCount} 名成员
          </p>
        </div>
        {currentUser?.role === 'teacher' && (
          <button
            className="btn btn--primary"
            onClick={() => setShowCreateModal(true)}
          >
            创建任务
          </button>
        )}
      </div>

      <div className="task-timeline__members">
        <h2 className="task-timeline__section-title">班级成员</h2>
        <div className="task-timeline__members-scroll">
          {classMembers.map((member, index) => (
            <div
              key={member.id}
              className="task-timeline__member"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <MemberAvatar user={member} size="md" showStatus />
              <span className="task-timeline__member-name">{member.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="task-timeline__section">
        <h2 className="task-timeline__section-title">任务列表</h2>
        {sortedTasks.length === 0 ? (
          <div className="task-timeline__no-tasks">
            暂无任务
            {currentUser?.role === 'teacher' && (
              <button
                className="btn btn--primary task-timeline__create-btn"
                onClick={() => setShowCreateModal(true)}
              >
                创建第一个任务
              </button>
            )}
          </div>
        ) : (
          <div className="task-timeline__list">
            {sortedTasks.map((task, index) => (
              <div
                key={task.id}
                className="breathe-in"
                style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
              >
                <TaskCard task={task} onClick={() => handleTaskClick(task.id)} />
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建新任务"
      >
        <div className="form-group">
          <label className="form-label">任务名称</label>
          <input
            type="text"
            className="form-input"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="请输入任务名称"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">截止日期</label>
          <input
            type="datetime-local"
            className="form-input"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">任务描述</label>
          <textarea
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="支持简单Markdown格式：**加粗**、- 列表、换行"
          />
        </div>
        <div className="form-group">
          <label className="form-label">分组方式</label>
          <select
            className="form-select"
            value={groupingMethod}
            onChange={(e) => setGroupingMethod(e.target.value as GroupingMethod)}
          >
            <option value="random">自动随机分组</option>
            <option value="manual">手动调整分组</option>
          </select>
        </div>
        <div className="form-actions">
          <button
            className="btn btn--secondary"
            onClick={() => setShowCreateModal(false)}
          >
            取消
          </button>
          <button
            className="btn btn--primary"
            onClick={handleCreateTask}
            disabled={!taskName.trim() || !deadline}
          >
            创建
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedTask}
        onClose={() => setShowTaskDetail(null)}
        title={selectedTask?.name || ''}
      >
        {selectedTask && (
          <div>
            <div
              className="task-timeline__description"
              dangerouslySetInnerHTML={{
                __html: parseSimpleMarkdown(selectedTask.description),
              }}
            />
            <div className="task-timeline__deadline">
              截止时间：{new Date(selectedTask.deadline).toLocaleString('zh-CN')}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
