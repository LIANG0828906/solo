import { useState, useEffect } from 'react';
import Calendar from '../components/Calendar';
import StudyModal from '../components/StudyModal';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { formatDate } from '../utils/date';
import type { StudyRecord, Project, User } from '../types';
import './HomePage.css';
import { Flame, Target, Clock } from 'lucide-react';
import { getStreakDays, getTotalDays } from '../utils/date';

export default function HomePage() {
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<StudyRecord | null>(null);
  const [updatedDate, setUpdatedDate] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recordsRes, projectsRes, userRes] = await Promise.all([
        api.getRecords(),
        api.getProjects(),
        api.getUser(),
      ]);
      if (recordsRes.success && recordsRes.data) {
        setRecords(recordsRes.data);
        storage.setRecords(recordsRes.data);
      }
      if (projectsRes.success && projectsRes.data) {
        setProjects(projectsRes.data);
        storage.setProjects(projectsRes.data);
      }
      if (userRes.success && userRes.data) {
        setUser(userRes.data);
        storage.setUser(userRes.data);
      }
    } catch {
      const localRecords = storage.getRecords();
      const localProjects = storage.getProjects();
      const localUser = storage.getUser();
      setRecords(localRecords);
      setProjects(localProjects);
      setUser(localUser);
    }
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date);
    const record = records.find((r) => r.date === dateStr) || null;
    setSelectedDate(date);
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const handleSave = async (data: {
    date: string;
    content: string;
    minutes: number;
    projectId?: string;
  }) => {
    try {
      const res = await api.saveRecord(data);
      if (res.success && res.data) {
        setRecords((prev) => {
          const filtered = prev.filter((r) => r.date !== data.date);
          return [...filtered, res.data!];
        });
        storage.setRecords(
          records.filter((r) => r.date !== data.date).concat(res.data!)
        );
        setUpdatedDate(data.date);
        setTimeout(() => setUpdatedDate(null), 500);
      }
    } catch {
      const newRecord: StudyRecord = {
        id: `local-${Date.now()}`,
        ...data,
      };
      setRecords((prev) => {
        const filtered = prev.filter((r) => r.date !== data.date);
        return [...filtered, newRecord];
      });
      const localRecords = storage.getRecords();
      const filtered = localRecords.filter((r) => r.date !== data.date);
      storage.setRecords([...filtered, newRecord]);
      setUpdatedDate(data.date);
      setTimeout(() => setUpdatedDate(null), 500);
    }
    setModalOpen(false);
  };

  const streak = getStreakDays(records);
  const totalDays = getTotalDays(records);
  const totalMinutes = records.reduce((sum, r) => sum + r.minutes, 0);
  const todayStr = formatDate(new Date());
  const todayRecord = records.find((r) => r.date === todayStr);
  const todayMinutes = todayRecord?.minutes || 0;
  const goalPercent = user ? Math.min(100, (todayMinutes / user.dailyGoal) * 100) : 0;

  return (
    <div className="home-page">
      <div className="page-header">
        <h1 className="page-title">学习日历</h1>
        <p className="page-subtitle">
          {user ? `你好，${user.nickname}！今天也要加油学习哦~` : '欢迎回来！'}
        </p>
      </div>

      <div className="stats-row">
        <div className="stat-card glass-card">
          <div className="stat-icon flame-icon">
            <Flame size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{streak}</div>
            <div className="stat-label">连续学习天数</div>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon target-icon">
            <Target size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalDays}</div>
            <div className="stat-label">累计学习天数</div>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon clock-icon">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{Math.floor(totalMinutes / 60)}h</div>
            <div className="stat-label">总学习时长</div>
          </div>
        </div>
      </div>

      <div className="calendar-wrapper">
        <Calendar
          records={records}
          onDateClick={handleDateClick}
          updatedDate={updatedDate}
        />
      </div>

      <div className="today-goal glass-card">
        <div className="goal-header">
          <span className="goal-label">今日学习目标</span>
          <span className="goal-value">
            {todayMinutes} / {user?.dailyGoal || 60} 分钟
          </span>
        </div>
        <div className="goal-progress-bar">
          <div
            className="goal-progress-fill"
            style={{ width: `${goalPercent}%` }}
          />
        </div>
        <div className="goal-hint">
          {goalPercent >= 100
            ? '🎉 太棒了！今日目标已完成！'
            : goalPercent >= 50
            ? '💪 已过半，继续加油！'
            : '📚 开始今天的学习吧！'}
        </div>
      </div>

      <StudyModal
        open={modalOpen}
        date={selectedDate}
        record={selectedRecord}
        projects={projects}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
