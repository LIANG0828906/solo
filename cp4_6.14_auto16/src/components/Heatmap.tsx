import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Info } from 'lucide-react';
import type { HeatmapCell, ActivityType } from '@/utils/types';
import { WEEKDAYS, HOURS } from '@/utils/types';

interface HeatmapProps {
  data: HeatmapCell[];
}

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  create: '创建任务',
  update: '更新任务',
  complete: '完成任务',
  comment: '评论讨论',
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  create: '#6366f1',
  update: '#f59e0b',
  complete: '#10b981',
  comment: '#ec4899',
};

function getHeatmapClass(count: number): string {
  if (count === 0) return 'heatmap-0';
  if (count <= 1) return 'heatmap-1';
  if (count <= 2) return 'heatmap-2';
  if (count <= 3) return 'heatmap-3';
  if (count <= 4) return 'heatmap-4';
  if (count <= 5) return 'heatmap-5';
  if (count <= 6) return 'heatmap-6';
  return 'heatmap-7';
}

export function Heatmap({ data }: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const heatmapGrid = useMemo(() => {
    const grid: (HeatmapCell | undefined)[][] = Array(7)
      .fill(null)
      .map(() => Array(24).fill(undefined));

    data.forEach((cell) => {
      if (cell.day >= 0 && cell.day < 7 && cell.hour >= 0 && cell.hour < 24) {
        grid[cell.day][cell.hour] = cell;
      }
    });

    return grid;
  }, [data]);

  const handleMouseMove = (e: React.MouseEvent, cell: HeatmapCell) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left + 10,
      y: e.clientY - rect.top - 10,
    });
    setHoveredCell(cell);
  };

  const totalActivities = useMemo(
    () => data.reduce((sum, cell) => sum + cell.count, 0),
    [data]
  );

  const peakHour = useMemo(() => {
    let max = 0;
    let peak = { day: 0, hour: 0 };
    data.forEach((cell) => {
      if (cell.count > max) {
        max = cell.count;
        peak = { day: cell.day, hour: cell.hour };
      }
    });
    return peak;
  }, [data]);

  const mostActiveDay = useMemo(() => {
    const dayCounts = WEEKDAYS.map((_, i) => ({
      day: i,
      count: data.filter((c) => c.day === i).reduce((s, c) => s + c.count, 0),
    }));
    return dayCounts.sort((a, b) => b.count - a.count)[0];
  }, [data]);

  return (
    <div className="p-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <CalendarDays size={18} className="text-indigo-600" />
          团队效率热力图
        </h4>
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <div className="flex items-center gap-1">
            <span>总活动</span>
            <span className="font-semibold text-gray-800">{totalActivities}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>最活跃</span>
            <span className="font-semibold text-indigo-600">
              {WEEKDAYS[mostActiveDay?.day || 0]}
            </span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="grid" style={{ gridTemplateColumns: '40px repeat(24, 1fr)' }}>
          <div className="w-10" />
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="text-[8px] text-gray-400 text-center h-4"
            >
              {hour % 4 === 0 ? `${hour}:00` : ''}
            </div>
          ))}

          {heatmapGrid.map((dayRow, dayIndex) => (
            <>
              <div
                key={`label-${dayIndex}`}
                className="text-[10px] text-gray-500 pr-2 text-right h-5 leading-5"
              >
                {WEEKDAYS[dayIndex]}
              </div>
              {dayRow.map((cell, hourIndex) => (
                <div
                  key={`cell-${dayIndex}-${hourIndex}`}
                  className={`
                    m-0.5 rounded-sm cursor-pointer transition-all duration-200
                    hover:scale-125 hover:z-10 hover:shadow-md
                    ${cell ? getHeatmapClass(cell.count) : 'heatmap-0'}
                  `}
                  style={{ height: '18px' }}
                  onMouseEnter={(e) => cell && handleMouseMove(e, cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                />
              ))}
            </>
          ))}
        </div>

        <AnimatePresence>
          {hoveredCell && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50 pointer-events-none bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs"
              style={{
                left: mousePos.x,
                top: mousePos.y,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="font-medium text-white mb-1">
                {WEEKDAYS[hoveredCell.day]} {hoveredCell.hour}:00 -{' '}
                {hoveredCell.hour + 1}:00
              </div>
              <div className="text-gray-300 mb-1">
                <span className="text-white font-semibold">
                  {hoveredCell.peopleCount}
                </span>{' '}
                人参与，共{' '}
                <span className="text-white font-semibold">
                  {hoveredCell.count}
                </span>{' '}
                次活动
              </div>
              {hoveredCell.activities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {hoveredCell.activities.map((activity) => (
                    <span
                      key={activity}
                      className="px-1.5 py-0.5 rounded text-[9px]"
                      style={{ backgroundColor: ACTIVITY_COLORS[activity] }}
                    >
                      {ACTIVITY_LABELS[activity]}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">活跃度</span>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((level) => (
              <div
                key={level}
                className={`w-4 h-4 rounded-sm ${getHeatmapClass(level)}`}
              />
            ))}
          </div>
          <span className="text-[10px] text-gray-500">高</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <Info size={12} className="text-gray-400" />
          <span className="text-gray-500">
            峰值: {WEEKDAYS[peakHour.day]} {peakHour.hour}:00
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
        {(Object.entries(ACTIVITY_LABELS) as [ActivityType, string][]).map(
          ([type, label]) => (
            <div key={type} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ACTIVITY_COLORS[type] }}
              />
              <span className="text-[9px] text-gray-600">{label}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default Heatmap;
