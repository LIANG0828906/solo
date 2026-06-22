import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Calendar, TrendingUp } from 'lucide-react';
import BarChart from './components/BarChart';
import DonutChart from './components/DonutChart';
import { api } from './services/api';
import { storage } from './services/storage';
import {
  getWeekDates,
  formatDate,
  getStreakDays,
  getTotalDays,
} from './utils/date';
import type { StudyRecord, Project } from './types';
import './analysis-page.css';

export default function AnalysisPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recordsRes, projectsRes] = await Promise.all([
        api.getRecords(),
        api.getProjects(),
      ]);
      if (recordsRes.success && recordsRes.data) {
        setRecords(recordsRes.data);
        storage.setRecords(recordsRes.data);
      }
      if (projectsRes.success && projectsRes.data) {
        setProjects(projectsRes.data);
        storage.setProjects(projectsRes.data);
      }
    } catch {
      setRecords(storage.getRecords());
      setProjects(storage.getProjects());
    }
  };

  const weekDates = getWeekDates();
  const weekLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  const barData = weekDates.map((date: Date, index: number) => {
    const dateStr = formatDate(date);
    const dayRecords = records.filter((r) => r.date === dateStr);
    const totalMinutes = dayRecords.reduce((sum, r) => sum + r.minutes, 0);
    const topProject = dayRecords
      .filter((r) => r.projectId)
      .sort((a, b) => b.minutes - a.minutes)[0];
    const project = topProject
      ? projects.find((p) => p.id === topProject.projectId)
      : null;

    return {
      label: weekLabels[date.getDay()],
      value: totalMinutes,
      color: project?.color || '#667eea',
      projectName: project?.name,
    };
  });

  const donutData = projects.map((project) => {
    const projectRecords = records.filter((r) => r.projectId === project.id);
    const totalMinutes = projectRecords.reduce((sum, r) => sum + r.minutes, 0);
    return {
      id: project.id,
      label: project.name,
      value: totalMinutes,
      color: project.color,
    };
  }).filter((d) => d.value > 0);

  const streak = getStreakDays(records);
  const totalStudyDays = getTotalDays(records);
  const totalMinutes = records.reduce((sum, r) => sum + r.minutes, 0);
  const avgMinutes = totalStudyDays > 0 ? Math.round(totalMinutes / totalStudyDays) : 0;

  const handleSliceClick = (projectId: string) => {
    navigate('/projects');
  };

  const today = new Date();
  const monthDays = [];
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const startPadding = firstDay.getDay();

  for (let i = 0; i < startPadding; i++) {
    monthDays.push(null);
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    monthDays.push(i);
  }

  const recordDateSet = new Set(
    records.filter((r) => r.minutes > 0).map((r) => r.date)
  );

  return (
    <div className="analysis-page">
      <div className="page-header">
        <h1 className="page-title">数据分析</h1>
        <p className="page-subtitle">了解你的学习模式，持续进步</p>
      </div>

      <div className="stats-row">
        <div className="stat-card glass-card streak-card">
          <div className="streak-icon">
            <Flame size={32} />
          </div>
          <div className="streak-info">
            <div className="streak-number">{streak}</div>
            <div className="streak-label">连续学习天数</div>
          </div>
          <div className="fire-particles">
            {[...Array(8)].map((_, i) => (
              <span key={i} className={`particle particle-${i}`} />
            ))}
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon-wrap calendar-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-info-wrap">
            <div className="stat-num">{totalStudyDays}</div>
            <div className="stat-desc">累计学习天数</div>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon-wrap trend-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info-wrap">
            <div className="stat-num">{avgMinutes}</div>
            <div className="stat-desc">日均学习（分钟）</div>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card glass-card">
          <h3 className="chart-title">最近7天学习时长</h3>
          <BarChart data={barData} height={220} />
        </div>

        <div className="chart-card glass-card">
          <h3 className="chart-title">各项目学习占比</h3>
          <DonutChart
            data={donutData.length > 0 ? donutData : [{ id: 'none', label: '暂无数据', value: 1, color: '#4b5563' }]}
            size={180}
            thickness={28}
            centerLabel="学习天数"
            centerValue={totalStudyDays}
            onSliceClick={donutData.length > 0 ? handleSliceClick : undefined}
          />
        </div>
      </div>

      <div className="calendar-card glass-card">
        <h3 className="chart-title">本月学习签到</h3>
        <div className="streak-calendar">
          <div className="calendar-weekdays">
            {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
              <div key={d} className="weekday-label">
                {d}
              </div>
            ))}
          </div>
          <div className="calendar-grid">
            {monthDays.map((day, index) => {
              if (day === null) {
                return <div key={index} className="calendar-cell empty" />;
              }
              const dateStr = `${today.getFullYear()}-${String(
                today.getMonth() + 1
              ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasRecord = recordDateSet.has(dateStr);
              const isToday = day === today.getDate();

              return (
                <div
                  key={index}
                  className={`calendar-cell ${hasRecord ? 'checked' : ''} ${
                    isToday ? 'today' : ''
                  }`}
                >
                  {hasRecord && <Flame size={12} className="cell-flame" />}
                  <span className="cell-day">{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
