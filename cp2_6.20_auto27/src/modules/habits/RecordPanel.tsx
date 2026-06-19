import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { habitApi, recordApi } from '../../services/api';
import type { Habit, HabitRecord, DayStatus, DayRecord } from './types';

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

export default function RecordPanel() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [records, setRecords] = useState<HabitRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [habitsData, recordsData] = await Promise.all([
        habitApi.getHabits(),
        recordApi.getRecordsByDateRange(
          format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
          format(endOfMonth(currentMonth), 'yyyy-MM-dd')
        ),
      ]);
      setHabits(habitsData);
      setRecords(recordsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDay = monthStart.getDay();
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const paddingStart = Array(startDay).fill(null);
    return [...paddingStart, ...days];
  }, [currentMonth]);

  const getDayRecord = (date: Date): DayRecord => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayRecords = records.filter(r => r.date === dateStr && r.completed);
    const completedCount = dayRecords.length;
    const totalCount = habits.length;
    
    let status: DayStatus = 'none';
    if (totalCount > 0) {
      if (completedCount === totalCount) {
        status = 'all';
      } else if (completedCount > 0) {
        status = 'partial';
      }
    }
    
    return { date: dateStr, status, completedCount, totalCount };
  };

  const getStatusColor = (status: DayStatus) => {
    switch (status) {
      case 'all': return 'bg-success';
      case 'partial': return 'bg-warning';
      case 'none': return 'bg-white/10';
    }
  };

  const getHabitCompletedOnDate = (habitId: string, dateStr: string): boolean => {
    return records.some(r => r.habitId === habitId && r.date === dateStr && r.completed);
  };

  const toggleHabit = async (habitId: string) => {
    if (toggling) return;
    
    setToggling(habitId);
    try {
      const result = await recordApi.toggleRecord(habitId, selectedDate);
      
      if (result.completed) {
        setRecords(prev => [...prev.filter(r => !(r.habitId === habitId && r.date === selectedDate)), result]);
      } else {
        setRecords(prev => prev.filter(r => !(r.habitId === habitId && r.date === selectedDate)));
      }
    } catch (error) {
      console.error('切换记录失败:', error);
    } finally {
      setToggling(null);
    }
  };

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const selectedDateRecords = habits.map(habit => ({
    habit,
    completed: getHabitCompletedOnDate(habit.id, selectedDate),
  }));

  const selectedDayInfo = getDayRecord(new Date(selectedDate));

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-text-primary mb-6">每日记录</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-bg-card rounded-2xl p-5 backdrop-blur-sm border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={prevMonth}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              <h2 className="text-xl font-semibold text-text-primary">
                {format(currentMonth, 'yyyy年 M月', { locale: zhCN })}
              </h2>
              
              <button
                onClick={nextMonth}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div
                  key={day}
                  className="text-center text-sm text-text-muted font-medium py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }
                
                const dayRecord = getDayRecord(date);
                const isSelected = format(date, 'yyyy-MM-dd') === selectedDate;
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isTodayDate = isToday(date);
                
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(format(date, 'yyyy-MM-dd'))}
                    className={`
                      aspect-square flex flex-col items-center justify-center rounded-xl
                      transition-all duration-300 ease-out relative
                      ${isSelected 
                        ? 'bg-accent/20 ring-2 ring-accent scale-105' 
                        : 'hover:bg-white/5'
                      }
                      ${!isCurrentMonth ? 'opacity-30' : ''}
                      ${isTodayDate && !isSelected ? 'ring-1 ring-accent/50' : ''}
                    `}
                  >
                    <span className={`text-sm font-medium mb-1 ${
                      isSelected ? 'text-accent' : 'text-text-primary'
                    }`}>
                      {format(date, 'd')}
                    </span>
                    
                    <div className={`w-2 h-2 rounded-full transition-all duration-500 ease-out ${getStatusColor(dayRecord.status)}`}
                      style={{
                        boxShadow: dayRecord.status !== 'none' 
                          ? `0 0 8px ${dayRecord.status === 'all' ? '#00d26a' : '#ffd93d'}80`
                          : 'none',
                      }}
                    />
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-xs text-text-secondary">全部完成</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-xs text-text-secondary">部分完成</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <span className="text-xs text-text-secondary">未完成</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-bg-card rounded-2xl p-5 backdrop-blur-sm border border-white/5">
            <div className="mb-5">
              <p className="text-sm text-text-muted mb-1">选中日期</p>
              <h3 className="text-lg font-semibold text-text-primary">
                {format(new Date(selectedDate), 'M月d日 EEEE', { locale: zhCN })}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(selectedDayInfo.status)}`} />
                <span className="text-sm text-text-secondary">
                  {selectedDayInfo.completedCount} / {selectedDayInfo.totalCount} 个习惯完成
                </span>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : habits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-muted text-sm">暂无习惯</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDateRecords.map(({ habit, completed }) => (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    disabled={toggling === habit.id}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-xl
                      transition-all duration-300 ease-out
                      ${completed 
                        ? 'bg-success/10 border border-success/30' 
                        : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10'
                      }
                      ${toggling === habit.id ? 'opacity-60' : ''}
                    `}
                  >
                    <span className={`font-medium ${
                      completed ? 'text-success' : 'text-text-primary'
                    }`}>
                      {habit.name}
                    </span>
                    
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center
                      transition-all duration-300 ease-out
                      ${completed 
                        ? 'bg-success text-white' 
                        : 'bg-white/10 text-text-muted'
                      }
                    `}>
                      {completed ? <Check size={14} /> : <X size={14} />}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-white/5">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-2xl font-bold text-success">
                    {records.filter(r => r.completed).length}
                  </p>
                  <p className="text-xs text-text-muted mt-1">本月完成</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-2xl font-bold text-accent">
                    {habits.length}
                  </p>
                  <p className="text-xs text-text-muted mt-1">习惯总数</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-2xl font-bold text-warning">
                    {Math.round((records.filter(r => r.completed).length / Math.max(habits.length * 30, 1)) * 100)}%
                  </p>
                  <p className="text-xs text-text-muted mt-1">完成率</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
