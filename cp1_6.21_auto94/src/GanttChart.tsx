import React, { useState, useMemo } from 'react';

export interface GanttTask {
  id: string;
  name: string;
  duration: number;
  pert: number;
  optimistic: number;
  pessimistic: number;
  mostLikely: number;
  poker: number;
}

interface GanttChartProps {
  tasks: GanttTask[];
}

const MS_PER_DAY = 8 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

type ZoomLevel = 'day' | 'week' | 'month';

const GanttChart: React.FC<GanttChartProps> = ({ tasks }) => {
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [zoomValue, setZoomValue] = useState(50);

  const zoomLevel: ZoomLevel = useMemo(() => {
    if (zoomValue < 33) return 'month';
    if (zoomValue < 66) return 'week';
    return 'day';
  }, [zoomValue]);

  const { startDate, endDate, totalDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalHours = 0;
    tasks.forEach((task) => {
      totalHours += task.pert;
    });

    const totalDaysEstimate = Math.max(1, Math.ceil(totalHours / 8));
    const end = new Date(today);
    end.setDate(today.getDate() + totalDaysEstimate + 7);

    return {
      startDate: today,
      endDate: end,
      totalDays: totalDaysEstimate + 7,
    };
  }, [tasks]);

  const taskPositions = useMemo(() => {
    const positions: {
      id: string;
      leftPercent: number;
      widthPercent: number;
      startDate: Date;
      endDate: Date;
      durationDays: number;
    }[] = [];

    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + 1);

    tasks.forEach((task) => {
      const durationDays = Math.max(0.5, task.pert / 8);
      const totalMs = endDate.getTime() - startDate.getTime();
      const leftMs = currentDate.getTime() - startDate.getTime();
      const leftPercent = (leftMs / totalMs) * 100;
      const widthPercent = (durationDays * MS_PER_DAY / totalMs) * 100;

      const taskEndDate = new Date(currentDate);
      taskEndDate.setDate(taskEndDate.getDate() + Math.ceil(durationDays));

      positions.push({
        id: task.id,
        leftPercent,
        widthPercent,
        startDate: new Date(currentDate),
        endDate: taskEndDate,
        durationDays,
      });

      currentDate = taskEndDate;
    });

    return positions;
  }, [tasks, startDate, endDate]);

  const timeUnits = useMemo(() => {
    const units: { label: string; leftPercent: number; isWeekStart?: boolean }[] = [];

    if (zoomLevel === 'day') {
      const dayMs = MS_PER_DAY;
      const totalMs = endDate.getTime() - startDate.getTime();
      let current = new Date(startDate);
      while (current <= endDate) {
        const leftMs = current.getTime() - startDate.getTime();
        const leftPercent = (leftMs / totalMs) * 100;
        const isWeekStart = current.getDay() === 1;
        units.push({
          label: `${current.getMonth() + 1}/${current.getDate()}`,
          leftPercent,
          isWeekStart,
        });
        current = new Date(current.getTime() + dayMs);
      }
    } else if (zoomLevel === 'week') {
      const weekMs = MS_PER_WEEK;
      const totalMs = endDate.getTime() - startDate.getTime();
      let current = new Date(startDate);
      const dayOfWeek = current.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      current.setDate(current.getDate() - daysToMonday);

      while (current <= endDate) {
        if (current >= startDate) {
          const leftMs = current.getTime() - startDate.getTime();
          const leftPercent = (leftMs / totalMs) * 100;
          units.push({
            label: `${current.getMonth() + 1}/${current.getDate()}`,
            leftPercent,
            isWeekStart: true,
          });
        }
        current = new Date(current.getTime() + weekMs);
      }
    } else {
      const totalMs = endDate.getTime() - startDate.getTime();
      let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      while (current <= endDate) {
        if (current >= startDate || current.getMonth() === startDate.getMonth()) {
          const leftMs = current.getTime() - startDate.getTime();
          const leftPercent = Math.max(0, (leftMs / totalMs) * 100);
          units.push({
            label: `${current.getFullYear()}/${current.getMonth() + 1}`,
            leftPercent,
          });
        }
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }
    }

    return units;
  }, [startDate, endDate, zoomLevel]);

  const handleMouseEnter = (taskId: string, e: React.MouseEvent) => {
    setHoveredTask(taskId);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    setHoveredTask(null);
    setTooltipPosition(null);
  };

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <p>暂无任务数据</p>
        <p style={{ fontSize: '12px', marginTop: '4px' }}>添加任务后将显示甘特图</p>
      </div>
    );
  }

  const hoveredTaskData = hoveredTask
    ? tasks.find((t) => t.id === hoveredTask)
    : null;
  const hoveredPosition = hoveredTask
    ? taskPositions.find((p) => p.id === hoveredTask)
    : null;

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="gantt-container">
        <div className="gantt-header">
          <div className="gantt-header-label">任务</div>
          <div className="gantt-header-timeline">
            {timeUnits.map((unit, index) => (
              <div
                key={index}
                className="gantt-time-unit"
                style={{
                  position: 'absolute',
                  left: `${unit.leftPercent}%`,
                  transform: 'translateX(-50%)',
                  border: 'none',
                }}
              >
                {unit.label}
              </div>
            ))}
          </div>
        </div>

        <div>
          {tasks.map((task, index) => {
            const pos = taskPositions[index];
            if (!pos) return null;

            return (
              <div key={task.id} className="gantt-row">
                <div className="gantt-task-name" title={task.name}>
                  {task.name}
                </div>
                <div className="gantt-task-timeline">
                  {zoomLevel !== 'month' &&
                    timeUnits
                      .filter((u) => u.isWeekStart)
                      .map((unit, i) => (
                        <div
                          key={i}
                          className="gantt-week-divider"
                          style={{ left: `${unit.leftPercent}%` }}
                        />
                      ))}
                  <div
                    className="gantt-bar"
                    style={{
                      left: `${pos.leftPercent}%`,
                      width: `${pos.widthPercent}%`,
                      minWidth: '20px',
                    }}
                    onMouseEnter={(e) => handleMouseEnter(task.id, e)}
                    onMouseLeave={handleMouseLeave}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {hoveredTaskData && hoveredPosition && tooltipPosition && (
          <div
            className="gantt-tooltip"
            style={{
              position: 'fixed',
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y - 10}px`,
              transform: 'translate(-50%, -100%)',
              margin: 0,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '6px' }}>
              {hoveredTaskData.name}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.9 }}>
              开始: {formatDate(hoveredPosition.startDate)}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.9 }}>
              结束: {formatDate(hoveredPosition.endDate)}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '4px' }}>
              PERT估算: {hoveredTaskData.pert.toFixed(1)} 小时
            </div>
            <div style={{ fontSize: '11px', opacity: 0.9 }}>
              工期: {hoveredPosition.durationDays.toFixed(1)} 天
            </div>
          </div>
        )}
      </div>

      <div className="zoom-slider-container">
        <span className="zoom-label">缩放</span>
        <input
          type="range"
          min="0"
          max="100"
          value={zoomValue}
          onChange={(e) => setZoomValue(Number(e.target.value))}
          className="zoom-slider"
          aria-label="甘特图时间粒度缩放"
        />
        <span className="zoom-label" style={{ textAlign: 'right' }}>
          {zoomLevel === 'day' ? '天' : zoomLevel === 'week' ? '周' : '月'}
        </span>
      </div>
    </div>
  );
};

export default GanttChart;
