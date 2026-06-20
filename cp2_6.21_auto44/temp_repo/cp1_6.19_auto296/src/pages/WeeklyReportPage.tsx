import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { TimeLog } from '../types';

const formatTime = (isoStr: string) => {
  const date = new Date(isoStr);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const formatShortDate = (isoStr: string) => {
  const date = new Date(isoStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const colors = [
  '#7C3AED', '#06B6D4', '#F59E0B', '#10B981',
  '#EF4444', '#EC4899', '#6366F1', '#14B8A6',
  '#8B5CF6', '#F97316'
];

const BarChart = ({
  tasks,
  taskTotals,
  expandedTaskId,
  onToggle,
  timeLogsByTask
}: {
  tasks: { id: string; title: string }[];
  taskTotals: number[];
  expandedTaskId: string | null;
  onToggle: (taskId: string) => void;
  timeLogsByTask: Record<string, TimeLog[]>;
}) => {
  const maxValue = Math.max(...taskTotals, 1);
  const totalHours = taskTotals.reduce((sum, v) => sum + v, 0);

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#E0E0E0', marginBottom: '4px' }}>
            任务耗时统计
          </h3>
          <p style={{ fontSize: '12px', color: '#8B8BA3' }}>
            按任务汇总总耗时，点击柱子展开查看计时片段
          </p>
        </div>
        <div
          style={{
            padding: '8px 18px',
            background: 'rgba(124, 58, 237, 0.1)',
            borderRadius: '20px',
            border: '1px solid rgba(124, 58, 237, 0.2)'
          }}
        >
          <span style={{ fontSize: '12px', color: '#8B8BA3' }}>本周总工时：</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#7C3AED' }}>
            {Math.round(totalHours * 10) / 10}h
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tasks.map((task, idx) => {
          const color = colors[idx % colors.length];
          const isExpanded = expandedTaskId === task.id;
          const logs = timeLogsByTask[task.id] || [];
          const percent = (taskTotals[idx] / maxValue) * 100;

          return (
            <div key={task.id}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onToggle(task.id)}
                style={{
                  background: '#1E1E2E',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${color}40`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '10px'
                  }}
                >
                  <div
                    style={{
                      width: '4px',
                      height: '16px',
                      borderRadius: '2px',
                      background: color,
                      flexShrink: 0
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: '13px',
                      color: '#E0E0E0',
                      fontWeight: 500,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={task.title}
                  >
                    {task.title}
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color,
                      flexShrink: 0
                    }}
                  >
                    {taskTotals[idx]}h
                  </span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ flexShrink: 0 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8BA3" strokeWidth="2">
                      <polyline points="6,9 12,15 18,9" />
                    </svg>
                  </motion.div>
                </div>

                <div
                  style={{
                    height: '8px',
                    background: '#2D2D44',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.05 }}
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, ${color}, ${color}CC)`,
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '6px',
                    fontSize: '11px',
                    color: '#6B6B8A'
                  }}
                >
                  <span>{logs.length} 条记录</span>
                  <span>{Math.round(percent)}% 占比</span>
                </div>
              </motion.div>

              <AnimatePresence>
                {isExpanded && logs.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      overflow: 'hidden',
                      marginLeft: '24px',
                      marginTop: '4px'
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(139, 139, 163, 0.05)',
                        borderRadius: '0 0 10px 10px',
                        padding: '4px 0',
                        borderLeft: `2px solid ${color}40`
                      }}
                    >
                      {logs.map((log, logIdx) => (
                        <motion.div
                          key={log.id}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: logIdx * 0.05 }}
                          style={{
                            padding: '10px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            borderBottom: logIdx < logs.length - 1 ? '1px solid rgba(139, 139, 163, 0.08)' : 'none'
                          }}
                        >
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: color,
                              flexShrink: 0
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', color: '#C0C0D0' }}>
                              {formatShortDate(log.startTime)} · {formatTime(log.startTime)} - {formatTime(log.endTime || log.startTime)}
                            </div>
                          </div>
                          <div
                            style={{
                              padding: '3px 10px',
                              background: `${color}20`,
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color,
                              flexShrink: 0
                            }}
                          >
                            +{log.duration}h
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WeeklyReportPage = () => {
  const navigate = useNavigate();
  const {
    user,
    weeklyData,
    expandedTaskId,
    toggleExpandedTask,
    logout
  } = useStore();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { days, tasks, dailyHours, taskTotals, timeLogsByTask } = weeklyData;

  const dayTotals = days.map((_, dayIdx) => {
    let sum = 0;
    for (let i = 0; i < tasks.length; i++) {
      if (dailyHours[i] && dailyHours[i][dayIdx] !== null) {
        sum += dailyHours[i][dayIdx] || 0;
      }
    }
    return Math.round(sum * 10) / 10;
  });

  const grandTotal = dayTotals.reduce((sum, v) => sum + v, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#1E1E2E', display: 'flex', flexDirection: 'column' }}>
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
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(139, 139, 163, 0.08)',
            border: 'none',
            color: '#C0C0D0',
            fontSize: '13px',
            fontWeight: 500,
            flexShrink: 0
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12,19 5,12 12,5" />
          </svg>
          返回看板
        </motion.button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#E0E0E0' }}>
            个人周报
          </h1>
          <p style={{ fontSize: '12px', color: '#8B8BA3' }}>
            工时汇总与统计分析
          </p>
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
                  navigate('/dashboard');
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
                📋 项目看板
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
      </header>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}
        >
          <div
            style={{
              background: '#2D2D44',
              borderRadius: '12px',
              padding: '18px',
              borderTop: '3px solid #7C3AED'
            }}
          >
            <div style={{ fontSize: '12px', color: '#8B8BA3', marginBottom: '8px' }}>本周总工时</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#E0E0E0' }}>
              {Math.round(grandTotal * 10) / 10}h
            </div>
            <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>
              日均 {Math.round((grandTotal / 7) * 10) / 10}h
            </div>
          </div>
          <div
            style={{
              background: '#2D2D44',
              borderRadius: '12px',
              padding: '18px',
              borderTop: '3px solid #06B6D4'
            }}
          >
            <div style={{ fontSize: '12px', color: '#8B8BA3', marginBottom: '8px' }}>工作任务数</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#E0E0E0' }}>{tasks.length}</div>
            <div style={{ fontSize: '11px', color: '#8B8BA3', marginTop: '4px' }}>
              活跃任务 {tasks.filter((_, i) => taskTotals[i] > 0).length}
            </div>
          </div>
          <div
            style={{
              background: '#2D2D44',
              borderRadius: '12px',
              padding: '18px',
              borderTop: '3px solid #10B981'
            }}
          >
            <div style={{ fontSize: '12px', color: '#8B8BA3', marginBottom: '8px' }}>工作天数</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#E0E0E0' }}>
              {dayTotals.filter(v => v > 0).length}
            </div>
            <div style={{ fontSize: '11px', color: '#F59E0B', marginTop: '4px' }}>
              最高日工时 {Math.max(...dayTotals)}h
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: '#2D2D44',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            overflow: 'auto'
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#E0E0E0', marginBottom: '4px' }}>
              工时汇总表
            </h3>
            <p style={{ fontSize: '12px', color: '#8B8BA3' }}>
              行：日期（周一至周日） · 列：任务名称 · 单元格：当日该任务工时
            </p>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(139, 139, 163, 0.15)' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
                minWidth: '800px'
              }}
            >
              <thead>
                <tr style={{ background: '#1E1E2E' }}>
                  <th
                    style={{
                      padding: '14px 16px',
                      textAlign: 'left',
                      color: '#8B8BA3',
                      fontWeight: 600,
                      fontSize: '12px',
                      borderBottom: '2px solid rgba(139, 139, 163, 0.2)',
                      position: 'sticky',
                      left: 0,
                      background: '#1E1E2E',
                      zIndex: 2,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    日期 \ 任务
                  </th>
                  {tasks.map((task, idx) => (
                    <th
                      key={task.id}
                      style={{
                        padding: '14px 12px',
                        textAlign: 'center',
                        color: '#E0E0E0',
                        fontWeight: 500,
                        fontSize: '12px',
                        borderBottom: '2px solid rgba(139, 139, 163, 0.2)',
                        borderLeft: '1px solid rgba(139, 139, 163, 0.1)',
                        whiteSpace: 'nowrap',
                        maxWidth: '160px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={task.title}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '2px',
                            background: colors[idx % colors.length],
                            flexShrink: 0
                          }}
                        />
                        <span
                          style={{
                            maxWidth: '130px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'inline-block'
                          }}
                        >
                          {task.title}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th
                    style={{
                      padding: '14px 16px',
                      textAlign: 'center',
                      color: '#7C3AED',
                      fontWeight: 600,
                      fontSize: '12px',
                      borderBottom: '2px solid rgba(124, 58, 237, 0.3)',
                      borderLeft: '2px solid rgba(124, 58, 237, 0.2)',
                      background: 'rgba(124, 58, 237, 0.05)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    合计
                  </th>
                </tr>
              </thead>
              <tbody>
                {days.map((day, dayIdx) => {
                  const isWeekend = dayIdx >= 5;
                  const isToday = dayIdx === 4;
                  return (
                    <tr
                      key={dayIdx}
                      style={{
                        background: isToday ? 'rgba(124, 58, 237, 0.04)' : 'transparent',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={() => setHoveredCell({ row: dayIdx, col: -1 })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <td
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid rgba(139, 139, 163, 0.1)',
                          color: isToday ? '#7C3AED' : '#E0E0E0',
                          fontWeight: isToday ? 600 : 500,
                          position: 'sticky',
                          left: 0,
                          background: hoveredCell?.row === dayIdx ? 'rgba(124, 58, 237, 0.08)' : (isToday ? 'rgba(124, 58, 237, 0.04)' : '#2D2D44'),
                          zIndex: 1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isWeekend && (
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(139, 139, 163, 0.15)',
                                fontSize: '10px',
                                color: '#8B8BA3'
                              }}
                            >
                              周末
                            </span>
                          )}
                          {isToday && (
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(124, 58, 237, 0.15)',
                                fontSize: '10px',
                                color: '#A78BFA'
                              }}
                            >
                              今天
                            </span>
                          )}
                          {day}
                        </div>
                      </td>
                      {tasks.map((task, taskIdx) => {
                        const hours = dailyHours[taskIdx]?.[dayIdx];
                        const isHovered = hoveredCell?.row === dayIdx;
                        return (
                          <td
                            key={`${dayIdx}-${taskIdx}`}
                            style={{
                              padding: '12px',
                              borderBottom: '1px solid rgba(139, 139, 163, 0.1)',
                              borderLeft: '1px solid rgba(139, 139, 163, 0.08)',
                              textAlign: 'center',
                              background: hours !== null && hours > 0
                                ? `${colors[taskIdx % colors.length]}${isHovered ? '25' : '15'}`
                                : isHovered ? 'rgba(139, 139, 163, 0.04)' : 'transparent',
                              transition: 'all 0.15s'
                            }}
                          >
                            {hours !== null && hours > 0 ? (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: `${colors[taskIdx % colors.length]}30`,
                                  color: colors[taskIdx % colors.length],
                                  fontWeight: 600,
                                  fontSize: '12px'
                                }}
                              >
                                {hours}h
                              </span>
                            ) : (
                              <span style={{ color: '#4A4A6A', fontSize: '12px' }}>—</span>
                            )}
                          </td>
                        );
                      })}
                      <td
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid rgba(139, 139, 163, 0.1)',
                          borderLeft: '2px solid rgba(124, 58, 237, 0.2)',
                          textAlign: 'center',
                          background: hoveredCell?.row === dayIdx ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.05)',
                          fontWeight: 700,
                          color: dayTotals[dayIdx] > 8 ? '#F59E0B' : '#7C3AED',
                          fontSize: '13px'
                        }}
                      >
                        {dayTotals[dayIdx] > 0 ? `${dayTotals[dayIdx]}h` : '—'}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#1E1E2E' }}>
                  <td
                    style={{
                      padding: '14px 16px',
                      color: '#8B8BA3',
                      fontWeight: 600,
                      fontSize: '12px',
                      borderTop: '2px solid rgba(139, 139, 163, 0.2)',
                      position: 'sticky',
                      left: 0,
                      background: '#1E1E2E',
                      zIndex: 1,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    任务合计
                  </td>
                  {tasks.map((task, idx) => (
                    <td
                      key={task.id}
                      style={{
                        padding: '14px 12px',
                        borderTop: '2px solid rgba(139, 139, 163, 0.2)',
                        borderLeft: '1px solid rgba(139, 139, 163, 0.1)',
                        textAlign: 'center'
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          background: `${colors[idx % colors.length]}20`,
                          color: colors[idx % colors.length],
                          fontWeight: 700,
                          fontSize: '13px'
                        }}
                      >
                        {taskTotals[idx]}h
                      </span>
                    </td>
                  ))}
                  <td
                    style={{
                      padding: '14px 16px',
                      borderTop: '2px solid rgba(124, 58, 237, 0.4)',
                      borderLeft: '2px solid rgba(124, 58, 237, 0.3)',
                      textAlign: 'center',
                      background: 'rgba(124, 58, 237, 0.1)'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#7C3AED'
                      }}
                    >
                      {Math.round(grandTotal * 10) / 10}h
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: '#2D2D44',
            borderRadius: '12px',
            padding: '24px'
          }}
        >
          <BarChart
            tasks={tasks}
            taskTotals={taskTotals}
            expandedTaskId={expandedTaskId}
            onToggle={(taskId) => toggleExpandedTask(taskId)}
            timeLogsByTask={timeLogsByTask}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default WeeklyReportPage;
