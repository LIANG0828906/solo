import React from 'react';
import {
  type CareTask,
  formatCountdown,
  getTaskTypeLabel,
  getTaskTypeEmoji,
} from './calendarEngine';

interface TaskTimelineProps {
  tasks: Array<
    CareTask & { plantName?: string }
  >;
  onComplete: (taskId: string) => void;
  onPostpone: (taskId: string) => void;
}

export function TaskTimeline({ tasks, onComplete, onPostpone }: TaskTimelineProps) {
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime();
  });

  const pendingTasks = sortedTasks.filter(t => !t.completed);
  const completedTasks = sortedTasks.filter(t => t.completed);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '16px' }}>
      {pendingTasks.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#66BB6A', marginBottom: '16px' }}>
            待办养护 ({pendingTasks.length})
          </h3>
          <div style={{ position: 'relative', paddingLeft: '32px' }}>
            <div
              style={{
                position: 'absolute',
                left: '7px',
                top: '8px',
                bottom: '8px',
                borderLeft: '2px dashed #BDBDBD',
              }}
            />
            {pendingTasks.map((task, idx) => (
              <div
                key={task.id}
                className="timeline-item"
                style={{
                  position: 'relative',
                  marginBottom: idx < pendingTasks.length - 1 ? '20px' : '0',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '-29px',
                    top: '6px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#66BB6A',
                    border: '3px solid #C8E6C9',
                  }}
                />
                <div
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    border: '1px solid #E0E0E0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{getTaskTypeEmoji(task.type)}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
                          {getTaskTypeLabel(task.type)}
                        </span>
                        {task.plantName && (
                          <span
                            style={{
                              fontSize: '12px',
                              background: '#E8F5E9',
                              color: '#2E7D32',
                              padding: '2px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            {task.plantName}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        每{task.intervalDays}天 · {formatCountdown(task.nextDue)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        className="btn-primary"
                        onClick={() => onComplete(task.id)}
                        style={{ padding: '5px 14px', fontSize: '12px' }}
                      >
                        完成
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => onPostpone(task.id)}
                        style={{ padding: '5px 12px', fontSize: '12px' }}
                      >
                        推迟1天
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#999', marginBottom: '16px' }}>
            已完成 ({completedTasks.length})
          </h3>
          <div style={{ position: 'relative', paddingLeft: '32px' }}>
            <div
              style={{
                position: 'absolute',
                left: '7px',
                top: '8px',
                bottom: '8px',
                borderLeft: '2px dashed #E0E0E0',
              }}
            />
            {completedTasks.map((task, idx) => (
              <div
                key={task.id}
                className="timeline-item"
                style={{
                  position: 'relative',
                  marginBottom: idx < completedTasks.length - 1 ? '20px' : '0',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '-29px',
                    top: '6px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#B0BEC5',
                    border: '3px solid #CFD8DC',
                  }}
                />
                <div
                  style={{
                    background: '#FAFAFA',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    border: '1px solid #EEE',
                    opacity: 0.7,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>{getTaskTypeEmoji(task.type)}</span>
                    <span
                      style={{
                        fontSize: '13px',
                        color: '#999',
                        textDecoration: 'line-through',
                      }}
                    >
                      {getTaskTypeLabel(task.type)}
                    </span>
                    {task.plantName && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#BBB',
                          textDecoration: 'line-through',
                        }}
                      >
                        {task.plantName}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#BBB',
                        textDecoration: 'line-through',
                        marginLeft: 'auto',
                      }}
                    >
                      每{task.intervalDays}天
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sortedTasks.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#999',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌱</div>
          <p>暂无养护任务</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>添加植物并设置养护计划后，任务将显示在这里</p>
        </div>
      )}
    </div>
  );
}
