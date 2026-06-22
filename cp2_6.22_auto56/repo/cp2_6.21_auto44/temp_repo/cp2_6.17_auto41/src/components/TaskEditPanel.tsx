import { useState, useEffect } from 'react';
import { useStore, darkenColor } from '@/stores/useStore';
import { TaskStatus } from '@/utils/db';

const SAVE_BTN = '#3498DB';
const DELETE_BTN = '#E74C3C';
const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: '待办', color: '#95A5A6' },
  { value: 'in_progress', label: '进行中', color: '#3498DB' },
  { value: 'done', label: '已完成', color: '#2ECC71' },
];

export default function TaskEditPanel() {
  const selectedTaskId = useStore(s => s.selectedTaskId);
  const setSelectedTaskId = useStore(s => s.setSelectedTaskId);
  const taskFromStore = useStore(s => selectedTaskId ? s.tasks[selectedTaskId] : null);
  const updateTask = useStore(s => s.updateTask);
  const deleteTask = useStore(s => s.deleteTask);
  const members = useStore(s => s.members);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [projectName, setProjectName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [localTask, setLocalTask] = useState(taskFromStore);
  const [localTaskId, setLocalTaskId] = useState(selectedTaskId);

  useEffect(() => {
    if (taskFromStore && selectedTaskId) {
      setLocalTask(taskFromStore);
      setLocalTaskId(selectedTaskId);
      setTitle(taskFromStore.title);
      setDescription(taskFromStore.description);
      setAssigneeId(taskFromStore.assigneeId);
      setStatus(taskFromStore.status);
      setProjectName(taskFromStore.projectName);
      setDueDate(taskFromStore.dueDate);
      requestAnimationFrame(() => {
        setIsOpen(true);
      });
    }
  }, [taskFromStore, selectedTaskId]);

  if (!localTask || !localTaskId) return null;

  const close = () => {
    setIsOpen(false);
    setTimeout(() => {
      setSelectedTaskId(null);
      setLocalTask(null);
      setLocalTaskId(null);
    }, 300);
  };

  const handleSave = () => {
    if (!title.trim() || !localTaskId) return;
    updateTask(localTaskId, {
      title: title.trim(),
      description: description.trim(),
      assigneeId,
      status,
      projectName: projectName.trim() || '未分类项目',
      dueDate,
    });
    close();
  };

  const handleDelete = () => {
    if (!localTaskId) return;
    if (confirm('确定要删除此任务吗？')) {
      deleteTask(localTaskId);
      close();
    }
  };

  const assignee = members.find(m => m.id === assigneeId);

  return (
    <>
      <div
        onClick={close}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isOpen ? 'rgba(44, 62, 80, 0.45)' : 'rgba(44, 62, 80, 0)',
          zIndex: 999,
          transition: 'background-color 0.3s ease-out',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '400px',
          backgroundColor: '#FFFFFF',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0%)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E5E8EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2C3E50' }}>
            编辑任务
          </h3>
          <button
            onClick={close}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#7F8C8D',
              fontSize: '20px',
              lineHeight: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#ECF0F1';
              e.currentTarget.style.color = '#2C3E50';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#7F8C8D';
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div
            style={{
              padding: '12px',
              backgroundColor: '#F8F9FA',
              borderRadius: '8px',
              border: '1px solid #E5E8EB',
            }}
          >
            <div style={{ fontSize: '12px', color: '#7F8C8D', marginBottom: '6px' }}>
              当前状态
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: STATUS_OPTIONS.find(o => o.value === localTask.status)?.color,
                }}
              />
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C3E50' }}>
                {STATUS_OPTIONS.find(o => o.value === localTask.status)?.label}
              </span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#5D6D7E', marginBottom: '6px', fontWeight: 500 }}>
              任务标题 <span style={{ color: '#E74C3C' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="请输入任务标题"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D5D8DC',
                borderRadius: '6px',
                fontSize: '14px',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#3498DB')}
              onBlur={e => (e.currentTarget.style.borderColor = '#D5D8DC')}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#5D6D7E', marginBottom: '6px', fontWeight: 500 }}>
              任务描述
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="请输入任务描述"
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D5D8DC',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#3498DB')}
              onBlur={e => (e.currentTarget.style.borderColor = '#D5D8DC')}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#5D6D7E', marginBottom: '6px', fontWeight: 500 }}>
              任务状态
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {STATUS_OPTIONS.map(opt => {
                const active = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    style={{
                      flex: 1,
                      padding: '8px 6px',
                      borderRadius: '6px',
                      border: active ? `2px solid ${opt.color}` : '1px solid #D5D8DC',
                      backgroundColor: active ? `${opt.color}15` : '#FFFFFF',
                      color: active ? opt.color : '#5D6D7E',
                      fontSize: '13px',
                      fontWeight: active ? 600 : 400,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.borderColor = opt.color;
                        e.currentTarget.style.color = opt.color;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.borderColor = '#D5D8DC';
                        e.currentTarget.style.color = '#5D6D7E';
                      }
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#5D6D7E', marginBottom: '6px', fontWeight: 500 }}>
              指派成员
            </label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {members.map(m => {
                const active = assigneeId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setAssigneeId(m.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      borderRadius: '20px',
                      border: active ? `2px solid ${m.avatarColor}` : '1px solid #D5D8DC',
                      backgroundColor: active ? `${m.avatarColor}15` : '#FFFFFF',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.borderColor = m.avatarColor;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.borderColor = '#D5D8DC';
                      }
                    }}
                  >
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: m.avatarColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {m.name.charAt(0)}
                    </span>
                    <span style={{ fontSize: '13px', color: active ? '#2C3E50' : '#5D6D7E', fontWeight: active ? 500 : 400 }}>
                      {m.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#5D6D7E', marginBottom: '6px', fontWeight: 500 }}>
              所属项目
            </label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="请输入项目名称"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D5D8DC',
                borderRadius: '6px',
                fontSize: '14px',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#3498DB')}
              onBlur={e => (e.currentTarget.style.borderColor = '#D5D8DC')}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#5D6D7E', marginBottom: '6px', fontWeight: 500 }}>
              截止日期
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D5D8DC',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          {assignee && (
            <div style={{ padding: '12px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#7F8C8D', marginBottom: '8px' }}>
                任务创建信息
              </div>
              <div style={{ fontSize: '13px', color: '#5D6D7E', lineHeight: 1.8 }}>
                <div>创建时间：{new Date(localTask.createdAt).toLocaleString('zh-CN')}</div>
                {localTask.completedAt && (
                  <div>完成时间：{new Date(localTask.completedAt).toLocaleString('zh-CN')}</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E5E8EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <button
            onClick={handleDelete}
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              backgroundColor: DELETE_BTN,
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 500,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = darkenColor(DELETE_BTN, 15);
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = DELETE_BTN;
            }}
          >
            🗑 删除
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={close}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                backgroundColor: '#ECF0F1',
                color: '#2C3E50',
                fontSize: '14px',
                fontWeight: 500,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#D5D8DC';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#ECF0F1';
              }}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '10px 24px',
                borderRadius: '6px',
                backgroundColor: SAVE_BTN,
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 500,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = darkenColor(SAVE_BTN, 15);
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = SAVE_BTN;
              }}
            >
              保存修改
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
