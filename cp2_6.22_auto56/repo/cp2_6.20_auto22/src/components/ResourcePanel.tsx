import React, { useMemo, useState, memo, useCallback } from 'react';
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  differenceInDays,
  parseISO,
  isBefore,
  isAfter,
  isSameDay,
  startOfDay,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Task, Project, Resource } from '../types';
import { useAppStore } from '../store';

interface ResourcePanelProps {
  resources: Resource[];
  tasks: Task[];
  projects: Project[];
}

const avatarColors = ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#c2185b', '#00796b', '#5d4037', '#455a64'];

const ResourcePanel: React.FC<ResourcePanelProps> = ({ resources, tasks, projects }) => {
  const getResourceLoad = useAppStore((s) => s.getResourceLoad);
  const [expandedResources, setExpandedResources] = useState<Set<string>>(
    () => new Set(resources.slice(0, 3).map((r) => r.id))
  );

  const weekRange = useMemo(() => {
    const today = startOfDay(new Date());
    return {
      start: startOfWeek(today, { locale: zhCN }),
      end: endOfWeek(today, { locale: zhCN }),
    };
  }, []);

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    let current = new Date(weekRange.start.getTime());
    const endTime = weekRange.end.getTime();
    while (current.getTime() <= endTime) {
      days.push(new Date(current.getTime()));
      current = addDays(current, 1);
    }
    return days;
  }, [weekRange]);

  const projectColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    projects.forEach((p) => {
      if (p.color.includes('blue')) map[p.id] = '#1e88e5';
      else if (p.color.includes('green')) map[p.id] = '#43a047';
      else if (p.color.includes('purple')) map[p.id] = '#8e24aa';
      else if (p.color.includes('pink')) map[p.id] = '#d81b60';
      else if (p.color.includes('orange')) map[p.id] = '#fb8c00';
      else map[p.id] = '#757575';
    });
    return map;
  }, [projects]);

  const getResourceTasks = useCallback(
    (resourceId: string) => tasks.filter((t) => t.assigneeId === resourceId),
    [tasks]
  );

  const getTaskBlocksForDay = useCallback(
    (resourceId: string, date: Date) => {
      const checkTime = startOfDay(date).getTime();
      return tasks.filter((task) => {
        if (task.assigneeId !== resourceId) return false;
        const taskStart = startOfDay(parseISO(task.startDate)).getTime();
        const taskEnd = startOfDay(parseISO(task.endDate)).getTime();
        return checkTime >= taskStart && checkTime <= taskEnd;
      });
    },
    [tasks]
  );

  const toggleResource = (resourceId: string) => {
    setExpandedResources((prev) => {
      const next = new Set(prev);
      if (next.has(resourceId)) {
        next.delete(resourceId);
      } else {
        next.add(resourceId);
      }
      return next;
    });
  };

  const getInitials = (name: string) => name.slice(0, 1);

  const RenderResourceCard = memo(function RenderResourceCard({
    resource,
    idx,
    isExpanded,
    onToggle,
    weekDays,
    getResourceLoad,
    getResourceTasks,
    getTaskBlocksForDay,
    projectColorMap,
  }: {
    resource: Resource;
    idx: number;
    isExpanded: boolean;
    onToggle: (id: string) => void;
    weekDays: Date[];
    getResourceLoad: (id: string, date: Date) => number;
    getResourceTasks: (id: string) => Task[];
    getTaskBlocksForDay: (id: string, date: Date) => Task[];
    projectColorMap: Record<string, string>;
  }) {
    const resourceId = resource.id;
    const toggle = () => onToggle(resourceId);
    const resourceTasks = getResourceTasks(resourceId);

    const totalWeekHours = weekDays.reduce((sum, day) => {
      return sum + getResourceLoad(resource.id, day);
    }, 0);

    const maxWeekHours = resource.dailyCapacity * 7;
    const weekLoadPercent = maxWeekHours > 0 ? Math.round((totalWeekHours / maxWeekHours) * 100) : 0;
    const isOverloaded = weekLoadPercent > 100;
    const avatarColor = avatarColors[idx % avatarColors.length];

    return (
      <div
        key={resource.id}
        style={{
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: isOverloaded ? '1px solid #ef9a9a' : '1px solid transparent',
        }}
      >
        <div
          onClick={toggle}
          style={{
            padding: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: isExpanded
              ? 'linear-gradient(135deg, #f5f7fa 0%, #e8eaf6 100%)'
              : 'white',
            transition: 'background 0.2s',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${avatarColor} 0%, ${avatarColor}dd 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: `0 2px 8px ${avatarColor}40`,
              flexShrink: 0,
            }}
          >
            {getInitials(resource.name)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#263238' }}>
                {resource.name}
              </span>
              {isOverloaded && (
                <span
                  style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 10,
                    background: '#ffebee',
                    color: '#c62828',
                    fontWeight: 600,
                  }}
                >
                  ⚠️ 超载
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#78909c', marginTop: 2 }}>
              {resource.role}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 4,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: isOverloaded
                  ? '#e53935'
                  : weekLoadPercent > 80
                  ? '#fb8c00'
                  : '#43a047',
              }}
            >
              {Math.round(totalWeekHours)}h / {maxWeekHours}h
            </div>
            <div
              style={{
                width: 60,
                height: 4,
                background: '#e0e0e0',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(weekLoadPercent, 100)}%`,
                  height: '100%',
                  background: isOverloaded
                    ? '#e53935'
                    : weekLoadPercent > 80
                    ? '#fb8c00'
                    : '#43a047',
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>

          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="#78909c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {isExpanded && (
          <div
            style={{
              padding: '0 12px 12px',
              animation: 'slideDownContent 0.3s ease-out',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 4,
                marginBottom: 8,
              }}
            >
              {weekDays.map((day) => {
                const dailyLoad = getResourceLoad(resource.id, day);
                const loadPercent =
                  resource.dailyCapacity > 0
                    ? Math.round((dailyLoad / resource.dailyCapacity) * 100)
                    : 0;
                const isDayOverloaded = dailyLoad > resource.dailyCapacity;
                const dayBlocks = getTaskBlocksForDay(resource.id, day);
                const isToday = isSameDay(day, new Date());
                const overloadPct = Math.max(0, loadPercent - 100);

                return (
                  <div
                    key={day.getTime()}
                    style={{
                      textAlign: 'center',
                      padding: '6px 2px',
                      borderRadius: 6,
                      background: isToday ? 'rgba(26, 35, 126, 0.08)' : 'transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: isToday ? '#1a237e' : '#78909c',
                        fontWeight: isToday ? 700 : 400,
                      }}
                    >
                      {format(day, 'EEE', { locale: zhCN })}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: isToday ? '#1a237e' : '#455a64',
                        marginTop: 1,
                      }}
                    >
                      {format(day, 'd')}
                    </div>
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: 36,
                        marginTop: 4,
                        background: isDayOverloaded ? '#ffebee' : '#f5f5f5',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      {dayBlocks.map((task, i) => {
                        const projectColor = projectColorMap[task.projectId] || '#757575';
                        const maxHours = Math.max(...dayBlocks.map((t) => t.estimatedHours), 1);
                        const blockHeight = Math.max(
                          8,
                          Math.min(30, (task.estimatedHours / maxHours) * 28)
                        );
                        return (
                          <div
                            key={task.id}
                            title={`${task.name} - ${task.estimatedHours}h`}
                            style={{
                              position: 'absolute',
                              top: 2 + (i * 32) % 30,
                              left: 2,
                              right: 2,
                              height: blockHeight,
                              background: isDayOverloaded
                                ? `linear-gradient(90deg, #ef5350, #e53935)`
                                : projectColor,
                              borderRadius: 3,
                              boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                              transition: 'all 0.2s',
                            }}
                          />
                        );
                      })}
                      {dailyLoad === 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: 10,
                            color: '#bdbdbd',
                          }}
                        >
                          —
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        marginTop: 3,
                        color: isDayOverloaded
                          ? '#e53935'
                          : loadPercent > 80
                          ? '#fb8c00'
                          : dailyLoad > 0
                          ? '#43a047'
                          : '#bdbdbd',
                      }}
                    >
                      {dailyLoad > 0
                        ? isDayOverloaded
                          ? `${Math.round(dailyLoad)}h (+${overloadPct}%)`
                          : `${Math.round(dailyLoad)}h`
                        : '0h'}
                    </div>
                  </div>
                );
              })}
            </div>

            {resourceTasks.length > 0 && (
              <div
                style={{
                  borderTop: '1px dashed #e0e0e0',
                  paddingTop: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ fontSize: 11, color: '#78909c', fontWeight: 500 }}>
                  分配任务 ({resourceTasks.length})
                </div>
                {resourceTasks.map((task) => {
                  const projectColor = projectColorMap[task.projectId] || '#757575';
                  return (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        background: '#fafafa',
                        borderRadius: 6,
                        borderLeft: `3px solid ${projectColor}`,
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#263238',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {task.name}
                        </div>
                        <div style={{ fontSize: 10, color: '#78909c', marginTop: 2 }}>
                          {task.startDate} ~ {task.endDate}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 10,
                          background: `${projectColor}15`,
                          color: projectColor,
                        }}
                      >
                        {task.estimatedHours}h
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {resourceTasks.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: 16,
                  fontSize: 12,
                  color: '#bdbdbd',
                }}
              >
                暂无分配任务
              </div>
            )}
          </div>
        )}
      </div>
    );
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        background: '#f5f7fa',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 4px 8px',
          borderBottom: '2px solid #1a237e',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 20, background: '#1a237e', borderRadius: 2 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1a237e' }}>资源负载面板</span>
        </div>
        <span style={{ fontSize: 11, color: '#78909c' }}>本周视图</span>
      </div>

      {resources.map((resource, idx) => (
        <RenderResourceCard
          key={resource.id}
          resource={resource}
          idx={idx}
          isExpanded={expandedResources.has(resource.id)}
          onToggle={toggleResource}
          weekDays={weekDays}
          getResourceLoad={getResourceLoad}
          getResourceTasks={getResourceTasks}
          getTaskBlocksForDay={getTaskBlocksForDay}
          projectColorMap={projectColorMap}
        />
      ))}

      <style>{`
        @keyframes slideDownContent {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            max-height: 800px;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default memo(ResourcePanel);
