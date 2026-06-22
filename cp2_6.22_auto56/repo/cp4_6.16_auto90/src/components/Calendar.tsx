import React, { memo, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  format,
  isToday,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useProjectStore, Version } from '@/store/projectStore';
import { cn } from '@/lib/utils';

interface CalendarProps {
  className?: string;
}

interface DayVersions {
  date: Date;
  versions: { version: Version; projectId: string; projectName: string; projectColor: string }[];
}

const VersionDot = memo(function VersionDot({ 
  color, 
  isFiltered 
}: { 
  color: string; 
  isFiltered: boolean;
}) {
  return (
    <div
      className={cn(
        'w-2 h-2 rounded-full transition-opacity duration-300',
        isFiltered ? 'opacity-30' : 'opacity-100'
      )}
      style={{ backgroundColor: color }}
    />
  );
});

const DayCell = memo(function DayCell({
  day,
  versions,
  isFiltered,
  onClick,
  delay,
}: {
  day: Date;
  versions: DayVersions['versions'];
  isFiltered: boolean;
  onClick: () => void;
  delay: number;
}) {
  const isCurrentMonth = isSameMonth(day, new Date());
  const isTodayDate = isToday(day);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.2 }}
      className={cn(
        'relative min-h-[80px] p-2 border border-gray-100 rounded-lg cursor-pointer',
        'hover:bg-white hover:shadow-sm transition-all duration-200',
        'group',
        isTodayDate && 'ring-2 ring-primary ring-offset-1',
        !isCurrentMonth && 'opacity-40'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'text-sm font-medium',
            isTodayDate ? 'text-primary font-bold' : 'text-gray-700'
          )}
        >
          {format(day, 'd')}
        </span>
        {versions.length > 0 && (
          <span className="text-xs text-gray-400">{versions.length}</span>
        )}
      </div>

      {versions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {versions.slice(0, 5).map((v, i) => (
            <VersionDot key={i} color={v.projectColor} isFiltered={isFiltered} />
          ))}
          {versions.length > 5 && (
            <span className="text-xs text-gray-400">+{versions.length - 5}</span>
          )}
        </div>
      )}
    </motion.div>
  );
});

const DayPopup = memo(function DayPopup({
  date,
  versions,
  isFiltered,
  onClose,
}: {
  date: Date;
  versions: DayVersions['versions'];
  isFiltered: boolean;
  onClose: () => void;
}) {
  if (versions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute z-50 w-72 p-4 bg-white/80 backdrop-blur-xl rounded-xl shadow-xl border border-gray-200"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-gray-800">
          {format(date, 'MM月dd日', { locale: zhCN })}
        </h4>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {versions.map((v, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              'p-3 rounded-lg cursor-pointer transition-colors',
              'hover:bg-primary/5',
              isFiltered && 'opacity-50'
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: v.projectColor }}
              />
              <span className="text-sm font-medium text-gray-700">
                {v.projectName}
              </span>
            </div>
            <p className="text-sm text-primary font-bold mt-1">
              {v.version.name}
            </p>
            {v.version.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {v.version.description}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});

export const Calendar = memo(function Calendar({ className }: CalendarProps) {
  const { projects, filteredProjectIds, toggleProjectFilter, currentMonth, setCurrentMonth } = useProjectStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const days = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);

  const calendarDays = useMemo(() => {
    const startDay = monthStart.getDay();
    const adjustedStart = startDay === 0 ? 6 : startDay - 1;
    const paddedDays = [];
    
    for (let i = 0; i < adjustedStart; i++) {
      paddedDays.push(null);
    }
    paddedDays.push(...days);
    
    while (paddedDays.length % 7 !== 0) {
      paddedDays.push(null);
    }
    
    return paddedDays;
  }, [days, monthStart]);

  const getVersionsForDate = useCallback((date: Date): DayVersions['versions'] => {
    const result: DayVersions['versions'] = [];

    projects.forEach((project) => {
      project.versions.forEach((version) => {
        try {
          const versionDate = new Date(version.releaseDate);
          if (isSameDay(versionDate, date)) {
            result.push({
              version,
              projectId: project.id,
              projectName: project.name,
              projectColor: project.color,
            });
          }
        } catch {
          // ignore
        }
      });
    });

    return result;
  }, [projects]);

  const isProjectFiltered = useCallback((projectId: string) => {
    if (filteredProjectIds.length === 0) return false;
    return !filteredProjectIds.includes(projectId);
  }, [filteredProjectIds]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(addMonths(currentMonth, -1));
    setSelectedDate(null);
  }, [currentMonth, setCurrentMonth]);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDate(null);
  }, [currentMonth, setCurrentMonth]);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate((prev) => (isSameDay(prev || new Date(0), date) ? null : date));
  }, []);

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className={cn('flex-1 flex flex-col bg-surface overflow-hidden', className)}>
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">发布日历</h2>
            <p className="text-sm text-gray-500">查看所有项目的版本发布计划</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200
                                 hover:border-gray-300 transition-colors text-sm">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">筛选项目</span>
                {filteredProjectIds.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-primary text-white text-xs rounded-full">
                    {filteredProjectIds.length}
                  </span>
                )}
              </button>

              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200
                              opacity-0 invisible group-hover:opacity-100 group-hover:visible
                              transition-all duration-200 z-50 py-2">
                {projects.map((project) => (
                  <label
                    key={project.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!isProjectFiltered(project.id)}
                      onChange={() => toggleProjectFilter(project.id)}
                      className="rounded"
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-sm text-gray-700 truncate">{project.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <h3 className="text-lg font-bold text-gray-800">
              {format(currentMonth, 'yyyy年 MM月', { locale: zhCN })}
            </h3>

            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 relative">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="min-h-[80px]" />;
              }

              const dayVersions = getVersionsForDate(day);
              const hasFilteredVersions = dayVersions.some((v) => isProjectFiltered(v.projectId));

              return (
                <div key={day.toISOString()} className="relative">
                  <DayCell
                    day={day}
                    versions={dayVersions}
                    isFiltered={hasFilteredVersions && dayVersions.every((v) => isProjectFiltered(v.projectId))}
                    onClick={() => handleDateClick(day)}
                    delay={index * 0.01}
                  />

                  <AnimatePresence>
                    {selectedDate && isSameDay(selectedDate, day) && (
                      <DayPopup
                        date={day}
                        versions={dayVersions}
                        isFiltered={false}
                        onClose={() => setSelectedDate(null)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
