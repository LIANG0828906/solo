import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Timer, Clock3 } from 'lucide-react';
import ProgressRing from '../components/ProgressRing';
import RecordTimeline from '../components/RecordTimeline';
import FloatingTimer from '../components/FloatingTimer';
import type { Goal, StudyRecord } from '../types';
import { recordsApi, goalsApi } from '../api';
import { formatMinutes, isToday } from '../utils';

interface Props {
  goals: Goal[];
  records: StudyRecord[];
  setRecords: React.Dispatch<React.SetStateAction<StudyRecord[]>>;
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}

const GoalDetailPage: React.FC<Props> = ({ goals, records, setRecords, setGoals }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStart, setTrackingStart] = useState<Date | null>(null);
  const [editingRecord, setEditingRecord] = useState<StudyRecord | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editMinutes, setEditMinutes] = useState('');

  const goal = useMemo(() => goals.find((g) => g.id === id), [goals, id]);

  const goalRecords = useMemo(
    () => records.filter((r) => r.goalId === id),
    [records, id]
  );

  const todayRecords = useMemo(
    () => goalRecords.filter((r) => isToday(r.startTime)),
    [goalRecords]
  );

  const todayMinutes = useMemo(
    () => todayRecords.reduce((sum, r) => sum + r.durationMinutes, 0),
    [todayRecords]
  );

  const todayProgress = useMemo(
    () => (goal ? Math.min((todayMinutes / goal.dailyGoalMinutes) * 100, 100) : 0),
    [goal, todayMinutes]
  );

  const overallProgress = useMemo(() => {
    if (!goal) return 0;
    const plannedMin = goal.totalPlannedHours * 60;
    if (plannedMin <= 0) return 0;
    return Math.min((goal.accumulatedMinutes / plannedMin) * 100, 100);
  }, [goal]);

  useEffect(() => {
    if (!goal) return;
    recordsApi.getAll(goal.id).then((data) => {
      setRecords((prev) => {
        const others = prev.filter((r) => r.goalId !== goal.id);
        return [...others, ...data];
      });
    });
  }, [goal?.id, setRecords]);

  const refreshGoals = async () => {
    const goalsData = await goalsApi.getAll();
    setGoals(goalsData);
  };

  const handleStartTracking = () => {
    setIsTracking(true);
    setTrackingStart(new Date());
  };

  const handleStopTracking = async (endTime: Date, durationMin: number) => {
    if (!goal || !trackingStart) return;
    await recordsApi.create({
      goalId: goal.id,
      startTime: trackingStart.toISOString(),
      endTime: endTime.toISOString(),
      durationMinutes: durationMin,
      note: '',
    });
    setIsTracking(false);
    setTrackingStart(null);
    const updated = await recordsApi.getAll(goal.id);
    setRecords((prev) => {
      const others = prev.filter((r) => r.goalId !== goal.id);
      return [...others, ...updated];
    });
    await refreshGoals();
  };

  const handleCancelTracking = () => {
    setIsTracking(false);
    setTrackingStart(null);
  };

  const handleEditRecord = (record: StudyRecord) => {
    setEditingRecord(record);
    setEditNote(record.note || '');
    setEditMinutes(String(record.durationMinutes));
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    await recordsApi.update(editingRecord.id, {
      note: editNote,
      durationMinutes: Number(editMinutes),
    });
    setEditingRecord(null);
    const data = await recordsApi.getAll();
    setRecords(data);
    await refreshGoals();
  };

  const handleDeleteRecord = async (recId: string) => {
    await recordsApi.remove(recId);
    setRecords((prev) => prev.filter((r) => r.id !== recId));
    await refreshGoals();
  };

  if (!goal) {
    return (
      <div className="goal-detail">
        <div className="page-header">
          <button className="nav-link" onClick={() => navigate('/')}>
            <ArrowLeft size={16} />
            返回
          </button>
        </div>
        <div className="empty-state">
          <p>目标不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="goal-detail fade-in">
      {isTracking && trackingStart && (
        <FloatingTimer
          startTime={trackingStart}
          onStop={handleStopTracking}
          onCancel={handleCancelTracking}
        />
      )}

      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">{goal.name}</h1>
            <p className="goal-sub">
              总进度 {Math.round(overallProgress)}% · 累计 {formatMinutes(goal.accumulatedMinutes)} / {goal.totalPlannedHours} 小时
            </p>
          </div>
        </div>
        <button className="btn-gradient start-btn" onClick={handleStartTracking}>
          <Play size={18} />
          开始学习
        </button>
      </div>

      <div className="detail-content">
        <div className="today-section glass">
          <div className="today-header">
            <h2 className="section-title">
              <Clock3 size={20} />
              今日学习
            </h2>
          </div>
          <div className="today-stats">
            <div className="today-ring">
              <ProgressRing
                progress={todayProgress}
                size={140}
                strokeWidth={12}
                labelInside={`${Math.round(todayProgress)}%`}
              />
            </div>
            <div className="today-info">
              <div className="today-minutes">
                <span className="today-num">{todayMinutes}</span>
                <span className="today-unit">分钟</span>
              </div>
              <div className="today-target">
                目标 {goal.dailyGoalMinutes} 分钟
              </div>
              <div className="today-sessions">
                {todayRecords.length} 次学习
              </div>
              <button
                className="btn-ghost focus-btn"
                onClick={() => navigate(`/focus/${goal.id}`)}
              >
                <Timer size={16} />
                进入专注模式
              </button>
            </div>
          </div>
        </div>

        <div className="records-section glass">
          <h2 className="section-title">
            <Timer size={20} />
            学习记录时间轴
          </h2>
          <RecordTimeline
            records={todayRecords}
            onEdit={handleEditRecord}
            onDelete={handleDeleteRecord}
          />
        </div>
      </div>

      {editingRecord && (
        <div className="modal-overlay" onClick={() => setEditingRecord(null)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <h3>编辑学习记录</h3>
            <div className="form-group">
              <label>学习时长 (分钟)</label>
              <input
                type="number"
                value={editMinutes}
                onChange={(e) => setEditMinutes(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>备注</label>
              <input
                type="text"
                placeholder="今天学了什么..."
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setEditingRecord(null)}>
                取消
              </button>
              <button className="btn-gradient" onClick={handleSaveEdit}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .goal-detail {
          position: relative;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .back-btn {
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 1