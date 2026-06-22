import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../store/useProjectStore';

const STATUS_COLORS: Record<string, string> = {
  unassigned: '#78909c',
  translating: '#42a5f5',
  reviewing: '#ffa726',
  completed: '#66bb6a',
};

const STATUS_LABELS: Record<string, string> = {
  unassigned: '待分配',
  translating: '翻译中',
  reviewing: '审核中',
  completed: '已完成',
};

interface Props {
  task: Task;
}

export default function TaskCard({ task }: Props) {
  const [showDetail, setShowDetail] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
    boxShadow: isDragging
      ? '0 4px 16px rgba(0, 0, 0, 0.5)'
      : '0 2px 8px rgba(0, 0, 0, 0.3)',
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`task-card ${isDragging ? 'dragging' : ''}`}
        onClick={e => {
          if (!isDragging) {
            setShowDetail(true);
          }
        }}
      >
        <div className="task-card-header">
          <span
            className="task-status-dot"
            style={{ background: STATUS_COLORS[task.status] }}
          />
          <span className="task-title">{task.title}</span>
        </div>
        <div className="task-card-meta">
          <span className="task-due">截止：{task.dueDate || '未设置'}</span>
          <span className="task-assignee">
            {task.assigneeAvatar && (
              <img src={task.assigneeAvatar} alt="" className="avatar-xs" />
            )}
            {task.assigneeName}
          </span>
        </div>
      </div>
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal task-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="task-detail-header">
              <h3>{task.title}</h3>
              <span
                className="task-status-badge"
                style={{ background: STATUS_COLORS[task.status] }}
              >
                {STATUS_LABELS[task.status]}
              </span>
            </div>
            <p className="task-detail-desc">{task.description || '暂无描述'}</p>
            <div className="task-detail-info">
              <div>
                <label>负责人</label>
                <span>
                  {task.assigneeAvatar && (
                    <img src={task.assigneeAvatar} alt="" className="avatar-xs" />
                  )}
                  {task.assigneeName}
                </span>
              </div>
              <div>
                <label>截止日期</label>
                <span>{task.dueDate || '未设置'}</span>
              </div>
              <div>
                <label>创建时间</label>
                <span>{new Date(task.createdAt).toLocaleString('zh-CN')}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowDetail(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
