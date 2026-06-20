import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TimeSegment {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number;
}

export interface BarChartData {
  taskId: string;
  taskName: string;
  totalHours: number;
  segments: TimeSegment[];
}

interface BarChartProps {
  data: BarChartData[];
  onBarClick?: (taskId: string) => void;
}

const formatDuration = (seconds: number) => {
  const hours = seconds / 3600;
  return hours.toFixed(2) + 'h';
};

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const BarChart: React.FC<BarChartProps> = ({ data, onBarClick }) => {
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const maxHours = Math.max(...data.map((d) => d.totalHours), 1);

  const handleBarClick = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
    onBarClick?.(taskId);
  };

  const colors = [
    '#7C3AED',
    '#9B5DE5',
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#06B6D4',
    '#EC4899',
  ];

  return (
    <div
      style={{
        background: '#2D2D44',
        borderRadius: '12px',
        padding: '20px',
      }}
    >
      <div
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#E0E0E0',
          marginBottom: '24px',
        }}
      >
        任务耗时统计
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {data.map((item, index) => {
          const color = colors[index % colors.length];
          const isHovered = hoveredTaskId === item.taskId;
          const isExpanded = expandedTaskId === item.taskId;
          const barWidth = (item.totalHours / maxHours) * 100;

          return (
            <div key={item.taskId}>
              <motion.div
                onClick={() => handleBarClick(item.taskId)}
                onMouseEnter={() => setHoveredTaskId(item.taskId)}
                onMouseLeave={() => setHoveredTaskId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '10px',
                  transition: 'background 0.2s',
                  background: isHovered ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                }}
              >
                <div
                  style={{
                    width: '140px',
                    flexShrink: 0,
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#E0E0E0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.taskName}
                </div>

                <div
                  style={{
                    flex: 1,
                    height: '36px',
                    background: '#1E1E2E',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.max(barWidth, isHovered ? 4 : 2)}%`,
                      background: isHovered ? '#9B5DE5' : color,
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      borderRadius: '8px',
                      position: 'relative',
                      minWidth: '4px',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: barWidth > 30 ? '#fff' : '#E0E0E0',
                    }}
                  >
                    {item.totalHours.toFixed(2)}h
                  </div>
                </div>

                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9B9BC7',
                    flexShrink: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </motion.div>
              </motion.div>

              <AnimatePresence>
                {isExpanded && item.segments.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      overflow: 'hidden',
                      marginLeft: '156px',
                      marginTop: '8px',
                    }}
                  >
                    <div
                      style={{
                        background: '#1E1E2E',
                        borderRadius: '10px',
                        padding: '12px 16px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#9B9BC7',
                          marginBottom: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        计时片段 ({item.segments.length})
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                        }}
                      >
                        {item.segments.map((segment) => (
                          <div
                            key={segment.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 12px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              borderRadius: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: '#E0E0E0',
                                }}
                              >
                                {formatDateTime(segment.startTime)}
                              </div>
                              {segment.endTime && (
                                <div
                                  style={{
                                    fontSize: '11px',
                                    color: '#5A5A80',
                                  }}
                                >
                                  至 {formatDateTime(segment.endTime)}
                                </div>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: color,
                                background: `${color}20`,
                                padding: '4px 10px',
                                borderRadius: '6px',
                              }}
                            >
                              {formatDuration(segment.duration)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#5A5A80',
            fontSize: '13px',
          }}
        >
          暂无统计数据
        </div>
      )}
    </div>
  );
};

export default BarChart;
