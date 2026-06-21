import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CalendarGrid from './components/CalendarGrid';
import Sidebar from './components/Sidebar';
import ScheduleModal from './components/ScheduleModal';
import DayDetailModal from './components/DayDetailModal';
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleComplete,
  getMonthlyStats
} from './api';
import type { Schedule, DayStats, FreeSlot } from './types';

const App: React.FC = () => {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<DayStats[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>('');
  
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  const [draggingId, setDraggingId] = useState<string | null>(null);
  
  const [smartSuggestions, setSmartSuggestions] = useState<{ date: string; slots: FreeSlot[] }[]>([]);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSchedules(currentYear, currentMonth);
      setSchedules(data);
    } catch (error) {
      console.error('获取日程失败:', error);
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  const fetchStats = useCallback(async () => {
    try {
      const stats = await getMonthlyStats(currentYear, currentMonth);
      setMonthlyStats(stats);
    } catch (error) {
      console.error('获取月度统计失败:', error);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchSchedules();
    fetchStats();
  }, [fetchSchedules, fetchStats]);

  const todaySchedules = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return schedules.filter(s => s.date === today);
  }, [schedules]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setDefaultDate(date);
    setEditingSchedule(null);
    setIsModalOpen(true);
  };

  const handleScheduleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleScheduleDelete = async (id: string) => {
    try {
      await deleteSchedule(id);
      setSchedules(prev => prev.filter(s => s.id !== id));
      fetchStats();
    } catch (error) {
      console.error('删除日程失败:', error);
    }
  };

  const handleScheduleToggle = async (id: string) => {
    try {
      const updated = await toggleComplete(id);
      setSchedules(prev => prev.map(s => s.id === id ? updated : s));
      fetchStats();
    } catch (error) {
      console.error('更新日程状态失败:', error);
    }
  };

  const handleScheduleSave = async (data: Partial<Schedule>) => {
    try {
      if (editingSchedule) {
        const updated = await updateSchedule(editingSchedule.id, data);
        setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? updated : s));
      } else {
        const newSchedule = await createSchedule(data);
        setSchedules(prev => [...prev, newSchedule]);
      }
      fetchStats();
    } catch (error) {
      console.error('保存日程失败:', error);
    }
  };

  const handleScheduleDrop = async (scheduleId: string, targetDate: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule || schedule.date === targetDate) return;

    try {
      const updated = await updateSchedule(scheduleId, { date: targetDate });
      setSchedules(prev => prev.map(s => s.id === scheduleId ? updated : s));
      fetchStats();
    } catch (error) {
      console.error('移动日程失败:', error);
    }
  };

  const handleQuickAdd = async (data: Partial<Schedule>) => {
    try {
      const newSchedule = await createSchedule(data);
      setSchedules(prev => [...prev, newSchedule]);
      fetchStats();
    } catch (error) {
      console.error('快速添加失败:', error);
    }
  };

  const handleSmartSuggestClick = (suggestion: { date: string; startTime: string; endTime: string }) => {
    setDefaultDate(suggestion.date);
    setEditingSchedule(null);
    setIsModalOpen(true);
  };

  const handleProgressBarClick = (date: string) => {
    setSelectedDate(date);
    setIsDayDetailOpen(true);
  };

  const monthName = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
  }, [currentYear, currentMonth]);

  const getProgressColor = (rate: number) => {
    if (rate === 0) return '#E5E7EB';
    const startColor = { r: 249, g: 115, b: 22 };
    const endColor = { r: 34, g: 197, b: 94 };
    
    const r = Math.round(startColor.r + (endColor.r - startColor.r) * rate);
    const g = Math.round(startColor.g + (endColor.g - startColor.g) * rate);
    const b = Math.round(startColor.b + (endColor.b - startColor.b) * rate);
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  const schedulesForSelectedDate = useMemo(() => {
    return schedules.filter(s => s.date === selectedDate);
  }, [schedules, selectedDate]);

  return (
    <div className="app-container">
      <Sidebar
        todaySchedules={todaySchedules}
        onQuickAdd={handleQuickAdd}
        onSmartSuggestClick={handleSmartSuggestClick}
      />
      
      <div className="main-content">
        <div className="calendar-header">
          <div className="month-nav">
            <button className="nav-btn" onClick={handlePrevMonth} title="上个月">
              ‹
            </button>
            <h1>{monthName}</h1>
            <button className="nav-btn" onClick={handleNextMonth} title="下个月">
              ›
            </button>
            <button className="btn-secondary" onClick={handleGoToday}>
              今天
            </button>
          </div>
          
          <div className="progress-section">
            <span className="label">本月完成进度</span>
            <div className="progress-bars">
              {monthlyStats.map((stat, idx) => (
                <div
                  key={idx}
                  className="progress-bar"
                  style={{
                    height: `${Math.max(4, stat.rate * 36)}px`,
                    backgroundColor: getProgressColor(stat.rate)
                  }}
                  onClick={() => handleProgressBarClick(stat.date)}
                  title={`${stat.date}: ${stat.completed}/${stat.total}`}
                >
                  <div className="tooltip">
                    {stat.date.split('-').slice(1).join('/')}: {stat.completed}/{stat.total}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <CalendarGrid
            year={currentYear}
            month={currentMonth}
            schedules={schedules}
            onDayClick={handleDayClick}
            onScheduleEdit={handleScheduleEdit}
            onScheduleDelete={handleScheduleDelete}
            onScheduleToggle={handleScheduleToggle}
            onScheduleDrop={handleScheduleDrop}
            draggingId={draggingId}
            setDraggingId={setDraggingId}
          />
        )}
      </div>

      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleScheduleSave}
        initialData={editingSchedule}
        defaultDate={defaultDate}
      />

      <DayDetailModal
        isOpen={isDayDetailOpen}
        date={selectedDate}
        schedules={schedulesForSelectedDate}
        onClose={() => setIsDayDetailOpen(false)}
        onEdit={handleScheduleEdit}
        onDelete={handleScheduleDelete}
        onToggleComplete={handleScheduleToggle}
        onDragStart={(e, s) => {
          setDraggingId(s.id);
          e.dataTransfer.setData('text/plain', s.id);
        }}
        onDragEnd={() => setDraggingId(null)}
      />
    </div>
  );
};

export default App;
