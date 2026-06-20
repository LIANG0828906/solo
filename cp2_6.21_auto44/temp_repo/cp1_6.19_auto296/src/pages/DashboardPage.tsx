import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { Task, TaskStatus, Member, BurndownPoint } from '../types';

const columns: { status: TaskStatus; title: string; color: string }[] = [
  { status: 'todo', title: '待开始', color: '#6B7280' },
  { status: 'in-progress', title: '进行中', color: '#7C3AED' },
  { status: 'done', title: '已完成', color: '#10B981' }
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
};

const BurndownChart = ({ data }: { data: BurndownPoint[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 80, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.fillStyle = 'transparent';
    ctx.clearRect(0, 0, width, height);

    const maxHours = Math.max(...data.map(d => Math.max(d.idealHours, d.actualHours))) * 1.1;
    const minHours = 0;

    const xStep = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

    ctx.strokeStyle = 'rgba(139, 139, 163, 0.15)';
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();

      const value = Math.round(maxHours - ((maxHours - minHours) / gridLines) * i);
      ctx.fillStyle = '#8B8BA3';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${value}h`, padding.left - 8, y + 4);
    }

    data.forEach((d, i) => {
      const x = padding.left + i * xStep;
      ctx.fillStyle = '#8B8BA3';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      const dateLabel = d.date.slice(5).replace('-', '/');
      ctx.fillText(dateLabel, x, height - padding.bottom + 20);
    });

    const idealGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    idealGradient.addColorStop(0, 'rgba(107, 114, 128, 0.2)');
    idealGradient.addColorStop(1, 'rgba(107, 114, 128, 0)');
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    data.forEach((d, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + chartHeight - ((d.idealHours - minHours) / (maxHours - minHours)) * chartHeight;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(padding.left + (data.length - 1) * xStep, padding.top + chartHeight);
    ctx.closePath();
    ctx.fillStyle = idealGradient;
    ctx.fill();

    ctx.beginPath();
    data.forEach((d, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + chartHeight - ((d.idealHours - minHours) / (maxHours - minHours)) * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    const actualGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    actualGradient.addColorStop(0, 'rgba(124, 58, 237, 0.25)');
    actualGradient.addColorStop(1, 'rgba(124, 58, 237, 0)');
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    data.forEach((d, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + chartHeight - ((d.actualHours - minHours) / (maxHours - minHours)) * chartHeight;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(padding.left + (data.length - 1) * xStep, padding.top + chartHeight);
    ctx.closePath();
    ctx.fillStyle = actualGradient;
    ctx.fill();

    ctx.beginPath();
    data.forEach((d, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + chartHeight - ((d.actualHours - minHours) / (maxHours - minHours)) * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();

    data.forEach((d, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + chartHeight - ((d.actualHours - minHours) / (maxHours - minHours)) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#7C3AED';
      ctx.fill();
      ctx.strokeStyle = '#1E1E2E';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (i === data.length - 1) {
        ctx.fillStyle = '#E0E0E0';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${d.actualHours}h`, x + 10, y - 2);
      }
    });

    const legendX = width - padding.right + 10;
    let legendY = padding.top;

    ctx.fillStyle = '#7C3AED';
    ctx.fillRect(legendX, legendY, 16, 3);
    ctx.fillStyle = '#E0E0E0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('实际', legendX + 22, legendY + 6);

    legendY += 24;
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + 16, legendY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#E0E0E0';
    ctx.fillText('理想', legendX + 22, legendY + 4);

  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '280px',
        display: 'block'
      }}
    />
  );
};

const TaskCard = ({
  task,
  members,
  onClick
}: {
  task: Task;
  members: Member[];
  onClick: () => void;
}) => {
  const assignee = members.find((m) => m.id === task.assigneeId);
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';
  const progressPercent = task.estimatedHours > 0
    ? Math.round(((task.estimatedHours - task.remainingHours) / task.estimatedHours) * 100)
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      style={{
        background: '#2D2D44',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        transition: 'box-shadow 0.2s',
        border: isOverdue ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent',
        marginBottom: '12px'
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 4px 12px rgba(124, 58, 237, 0.3)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 4px 12px rgba(0, 0, 0, 0.2)';
      }}
    >
      <h4
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#E0E0E0',
          marginBottom: '10px',
          lineHeight: 1.4
        }}
      >
        {task.title}
      </h4>

      {task.estimatedHours > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#8B8BA3',
              marginBottom: '6px'
            }}
          >
            <span>进度</span>
            <span>{progressPercent}%</span>
          </div>
          <div
            style={{
              height: '6px',
              background: '#1E1E2E',
              borderRadius: '3px',
              overflow: 'hidden'
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
              style={{
                height: '100%',
                background: task.status === 'done'
                  ? '#10B981'
                  : 'linear-gradient(90deg, #7C3AED, #9B5DE5)',
                borderRadius: '3px'
              }}
            />
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: assignee?.avatarColor || '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 600,
              color: '#fff',
              flexShrink: 0
            }}
          >
            {assignee?.name?.charAt(0) || '?'}
          </div>
          <span style={{ fontSize: '12px', color: '#A0A0B8' }}>
            {assignee?.name || '未分配'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke={task.remainingHours === 0 ? '#10B981' : isOverdue ? '#EF4444' : '#8B8BA3'}
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          <span
            style={{
              fontSize: '12px',
              color: task.remainingHours === 0 ? '#10B981' : isOverdue ? '#EF4444' : '#8B8BA3',
              fontWeight: 500
            }}
          >
            {task.remainingHours}h
          </span>
        </div>
      </div>

      {isOverdue && (
        <div
          style={{
            marginTop: '10px',
            padding: '6px 10px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#F87171',
            textAlign: 'center'
          }}
        >
          已逾期 · 截止 {formatDate(task.dueDate)}
        </div>
      )}
    </motion.div>
  );
};

const KanbanColumn = ({
  column,
  tasks,
  members,
  onTaskClick
}: {
  column: typeof columns[0];
  tasks: Task[];
  members: Member[];
  onTaskClick: (task: Task) => void;
}) => {
  return (
    <div
      style={{
        minWidth: 0,
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '2px solid rgba(139, 139, 163, 0.15)'
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: column.color,
            boxShadow: `0 0 8px ${column.color}50`
          }}
        />
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#E0E0E0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}
        >
          {column.title}
        </h3>
        <span
          style={{
            minWidth: '24px',
            height: '24px',
            padding: '0 8px',
            borderRadius: '12px',
            background: `${column.color}20`,
            color: column.color,
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {tasks.length}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '4px',
          minHeight: '100px'
        }}
      >
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#5A5A7A',
              fontSize: '13px',
              border: '2px dashed rgba(139, 139, 163, 0.2)',
              borderRadius: '12px'
            }}
          >
            暂无任务
          </div>
        )}
      </div>
    </div>
  );
};

const TaskModal = ({
  task,
  members,
  onClose
}: {
  task: Task;
  members: Member[];
  onClose: () => void;
}) => {
  const assignee = members.find((m) => m.id === task.assigneeId);
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';
  const progressPercent = task.estimatedHours > 0
    ? Math.round(((task.estimatedHours - task.remainingHours) / task.estimatedHours) * 100)
    : 0;

  const statusMap: Record<TaskStatus, { label: string; color: string }> = {
    'todo': { label: '待开始', color: '#6B7280' },
    'in-progress': { label: '进行中', color: '#7C3AED' },
    'done': { label: '已完成', color: '#10B981' }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            background: '#2D2D44',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              padding: '24px 28px',
              borderBottom: '1px solid rgba(139, 139, 163, 0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '16px'
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    background: `${statusMap[task.status].color}20`,
                    color: statusMap[task.status].color,
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  {statusMap[task.status].label}
                </span>
                {isOverdue && (
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#F87171',
                      fontSize: '12px',
                      fontWeight: 500
                    }}
                  >
                    已逾期
                  </span>
                )}
              </div>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#E0E0E0',
                  lineHeight: 1.4
                }}
              >
                {task.title}
              </h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(139, 139, 163, 0.1)',
                border: 'none',
                color: '#8B8BA3',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              ×
            </motion.button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '13px', color: '#8B8BA3', marginBottom: '10px', fontWeight: 500 }}>
                任务描述
              </h4>
              <p
                style={{
                  fontSize: '14px',
                  color: '#C0C0D0',
                  lineHeight: 1.7,
                  padding: '14px 16px',
                  background: '#1E1E2E',
                  borderRadius: '10px'
                }}
              >
                {task.description}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h4 style={{ fontSize: '13px', color: '#8B8BA3', marginBottom: '10px', fontWeight: 500 }}>
                  负责人
                </h4>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    background: '#1E1E2E',
                    borderRadius: '10px'
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: assignee?.avatarColor || '#7C3AED',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#fff'
                    }}
                  >
                    {assignee?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#E0E0E0', fontWeight: 500 }}>
                      {assignee?.name || '未分配'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>
                      ID: {task.assigneeId}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '13px', color: '#8B8BA3', marginBottom: '10px', fontWeight: 500 }}>
                  截止日期
                </h4>
                <div
                  style={{
                    padding: '12px',
                    background: '#1E1E2E',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: isOverdue ? '#F87171' : '#E0E0E0',
                    fontWeight: 500
                  }}
                >
                  {task.dueDate}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '13px', color: '#8B8BA3', fontWeight: 500 }}>
                  工时进度
                </h4>
                <span style={{ fontSize: '14px', color: '#E0E0E0', fontWeight: 600 }}>
                  {task.estimatedHours - task.remainingHours}h / {task.estimatedHours}h
                </span>
              </div>
              <div
                style={{
                  height: '10px',
                  background: '#1E1E2E',
                  borderRadius: '5px',
                  overflow: 'hidden',
                  marginBottom: '10px'
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6 }}
                  style={{
                    height: '100%',
                    background: task.status === 'done'
                      ? '#10B981'
                      : 'linear-gradient(90deg, #7C3AED, #9B5DE5)',
                    borderRadius: '5px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#10B981' }}>已完成 {progressPercent}%</span>
                <span style={{ color: '#8B8BA3' }}>剩余 {task.remainingHours}h</span>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '16px 28px',
              borderTop: '1px solid rgba(139, 139, 163, 0.15)',
              display: 'flex',
              gap: '12px'
            }}
          >
            <motion.button
              whileHover={{ backgroundColor: '#9B5DE5' }}
              whileTap={{ scale: 0.95 }}
              style={{
                flex: 1,
                height: '44px',
                background: '#7C3AED',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              开始计时
            </motion.button>
            <motion.button
              whileHover={{ backgroundColor: 'rgba(139, 139, 163, 0.15)' }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              style={{
                padding: '0 24px',
                height: '44px',
                background: 'rgba(139, 139, 163, 0.08)',
                border: '1px solid rgba(139, 139, 163, 0.2)',
                borderRadius: '10px',
                color: '#C0C0D0',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              关闭
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const {
    user,
    tasks,
    members,
    burndownData,
    selectedTask,
    isModalOpen,
    sidebarCollapsed,
    setSelectedTask,
    setModalOpen,
    toggleSidebar,
    logout
  } = useStore();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setModalOpen(true);
  }, [setSelectedTask, setModalOpen]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setTimeout(() => setSelectedTask(null), 200);
  }, [setModalOpen, setSelectedTask]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const totalHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const remainingHours = tasks.reduce((sum, t) => sum + t.remainingHours, 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#1E1E2E' }}>
      <motion.div
        animate={{ width: sidebarCollapsed ? 0 : 240 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          background: '#2C3E50',
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            padding: sidebarCollapsed ? '0' : '24px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            opacity: sidebarCollapsed ? 0 : 1,
            transition: 'opacity 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #7C3AED, #9B5DE5)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0
              }}
            >
              P
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                项目看板
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                团队协作系统
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: sidebarCollapsed ? '0' : '16px 12px' }}>
          <div
            style={{
              opacity: sidebarCollapsed ? 0 : 1,
              transition: 'opacity 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.4)',
                padding: '12px 12px 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 600
              }}
            >
              项目概览
            </div>

            <div
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(124, 58, 237, 0.2)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: '4px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              项目看板
            </div>

            <div
              onClick={() => navigate('/weekly-report')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: '20px'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              个人周报
            </div>

            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.4)',
                padding: '12px 12px 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 600
              }}
            >
              团队成员
            </div>

            {members.map((member) => (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  marginBottom: '4px'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: member.avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#fff',
                    flexShrink: 0
                  }}
                >
                  {member.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#fff',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {member.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    {member.weeklyHours}h / 本周
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            height: '64px',
            background: '#2D2D44',
            borderBottom: '1px solid rgba(139, 139, 163, 0.15)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: '16px',
            flexShrink: 0
          }}
        >
          <motion.button
            whileHover={{ backgroundColor: 'rgba(124, 58, 237, 0.15)' }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleSidebar}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(139, 139, 163, 0.08)',
              border: 'none',
              color: '#C0C0D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarCollapsed ? (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="15" y2="12" />
                  <line x1="3" y1="18" x2="18" y2="18" />
                </>
              )}
            </svg>
          </motion.button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#E0E0E0' }}>
              项目看板
            </h1>
            <p style={{ fontSize: '12px', color: '#8B8BA3' }}>
              跟踪项目进度，高效协作完成目标
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'none', gap: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#7C3AED' }}>
                  {totalTasks}
                </div>
                <div style={{ fontSize: '11px', color: '#8B8BA3' }}>总任务</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#10B981' }}>
                  {doneTasks}
                </div>
                <div style={{ fontSize: '11px', color: '#8B8BA3' }}>已完成</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#F59E0B' }}>
                  {inProgressTasks}
                </div>
                <div style={{ fontSize: '11px', color: '#8B8BA3' }}>进行中</div>
              </div>
            </div>

            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 12px 6px 6px',
                  borderRadius: '20px',
                  background: 'rgba(139, 139, 163, 0.08)',
                  border: '1px solid rgba(139, 139, 163, 0.15)',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: user?.avatarColor || '#7C3AED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#fff'
                  }}
                >
                  {user?.name?.charAt(0) || '?'}
                </div>
                <span style={{ fontSize: '13px', color: '#E0E0E0', fontWeight: 500 }}>
                  {user?.name || '用户'}
                </span>
              </motion.button>

              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: '180px',
                    background: '#2D2D44',
                    borderRadius: '10px',
                    border: '1px solid rgba(139, 139, 163, 0.15)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                    overflow: 'hidden',
                    zIndex: 100
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(139, 139, 163, 0.15)'
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#E0E0E0' }}>
                      {user?.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8B8BA3' }}>
                      {user?.role === 'admin' ? '管理员' : '成员'}
                    </div>
                  </div>
                  <div
                    onClick={() => {
                      navigate('/weekly-report');
                      setShowUserMenu(false);
                    }}
                    style={{
                      padding: '10px 16px',
                      fontSize: '13px',
                      color: '#C0C0D0',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(124, 58, 237, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    }}
                  >
                    📊 个人周报
                  </div>
                  <div
                    onClick={handleLogout}
                    style={{
                      padding: '10px 16px',
                      fontSize: '13px',
                      color: '#F87171',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    }}
                  >
                    🚪 退出登录
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px', minWidth: 0 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '24px'
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              style={{
                background: '#2D2D44',
                borderRadius: '12px',
                padding: '18px',
                borderTop: '3px solid #7C3AED'
              }}
            >
              <div style={{ fontSize: '12px', color: '#8B8BA3', marginBottom: '8px' }}>总任务数</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#E0E0E0' }}>{totalTasks}</div>
              <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>
                ↑ 本周新增 3 个
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                background: '#2D2D44',
                borderRadius: '12px',
                padding: '18px',
                borderTop: '3px solid #10B981'
              }}
            >
              <div style={{ fontSize: '12px', color: '#8B8BA3', marginBottom: '8px' }}>已完成</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#E0E0E0' }}>{doneTasks}</div>
              <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>
                完成率 {Math.round((doneTasks / totalTasks) * 100)}%
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{
                background: '#2D2D44',
                borderRadius: '12px',
                padding: '18px',
                borderTop: '3px solid #F59E0B'
              }}
            >
              <div style={{ fontSize: '12px', color: '#8B8BA3', marginBottom: '8px' }}>进行中</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#E0E0E0' }}>{inProgressTasks}</div>
              <div style={{ fontSize: '11px', color: '#8B8BA3', marginTop: '4px' }}>
                待开始 {todoTasks} 个
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                background: '#2D2D44',
                borderRadius: '12px',
                padding: '18px',
                borderTop: '3px solid #06B6D4'
              }}
            >
              <div style={{ fontSize: '12px', color: '#8B8BA3', marginBottom: '8px' }}>总工时</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#E0E0E0' }}>{totalHours}h</div>
              <div style={{ fontSize: '11px', color: '#F59E0B', marginTop: '4px' }}>
                剩余 {remainingHours}h
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              background: '#2D2D44',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}
            >
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#E0E0E0', marginBottom: '4px' }}>
                  项目燃尽图
                </h3>
                <p style={{ fontSize: '12px', color: '#8B8BA3' }}>
                  7天进度追踪 · 理想 vs 实际工时消耗
                </p>
              </div>
              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: remainingHours <= totalHours * 0.5
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(245, 158, 11, 0.1)',
                  color: remainingHours <= totalHours * 0.5 ? '#10B981' : '#F59E0B',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                {remainingHours <= totalHours * 0.5 ? '✓ 进度良好' : '⚠ 需加快进度'}
              </div>
            </div>
            <BurndownChart data={burndownData} />
          </motion.div>

          <div
            style={{
              display: 'flex',
              gap: '24px',
              '@media maxWidth: 768px': {
                flexDirection: 'column'
              }
            }}
          >
            <style>{`
              @media (max-width: 768px) {
                .kanban-container {
                  flex-direction: column !important;
                }
              }
            `}</style>
            <div
              className="kanban-container"
              style={{
                display: 'flex',
                gap: '24px',
                width: '100%',
                flexWrap: 'wrap',
                minWidth: 0
              }}
            >
              {columns.map((column, idx) => (
                <motion.div
                  key={column.status}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  style={{
                    flex: 1,
                    minWidth: '280px',
                    background: '#2D2D44',
                    borderRadius: '12px',
                    padding: '20px',
                    minHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <KanbanColumn
                    column={column}
                    tasks={tasks.filter((t) => t.status === column.status)}
                    members={members}
                    onTaskClick={handleTaskClick}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && selectedTask && (
        <TaskModal
          task={selectedTask}
          members={members}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default DashboardPage;
