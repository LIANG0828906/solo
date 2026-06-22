import React, { useState, useEffect, useCallback } from 'react';
import FeedbackForm from './components/FeedbackForm';
import EmotionTrendChart from './components/EmotionTrendChart';
import TimelineBoard from './components/TimelineBoard';
import ActionItemList from './components/ActionItemList';

export interface Feedback {
  id: string;
  good: string;
  bad: string;
  improve: string;
  sentiment: { positive: number; negative: number; neutral: number };
  iteration: number;
  createdAt: string;
}

export interface ActionItem {
  id: string;
  description: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

export interface EmotionTrendPoint {
  iteration: number;
  date: string;
  positive: number;
  negative: number;
  neutral: number;
}

export const TEAM_MEMBERS = [
  { name: '张伟', avatar: '张' },
  { name: '李娜', avatar: '李' },
  { name: '王强', avatar: '王' },
  { name: '刘洋', avatar: '刘' },
  { name: '陈静', avatar: '陈' },
];

export default function App() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [emotionTrend, setEmotionTrend] = useState<EmotionTrendPoint[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);

  const fetchFeedbacks = useCallback(async () => {
    try {
      const res = await fetch('/api/feedback');
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch {}
  }, []);

  const fetchEmotionTrend = useCallback(async () => {
    try {
      const res = await fetch('/api/emotion-trend');
      if (res.ok) {
        const data = await res.json();
        setEmotionTrend(data);
      }
    } catch {}
  }, []);

  const fetchActions = useCallback(async () => {
    try {
      const res = await fetch('/api/actions');
      if (res.ok) {
        const data = await res.json();
        setActions(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchFeedbacks();
    fetchEmotionTrend();
    fetchActions();
  }, [fetchFeedbacks, fetchEmotionTrend, fetchActions]);

  const handleFeedbackSubmitted = useCallback(() => {
    fetchFeedbacks();
    fetchEmotionTrend();
    fetchActions();
  }, [fetchFeedbacks, fetchEmotionTrend, fetchActions]);

  const handleActionUpdated = useCallback(() => {
    fetchActions();
  }, [fetchActions]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>团队项目复盘看板</h1>
        <p>迭代回顾 · 情绪洞察 · 持续改进</p>
      </header>

      <div className="kanban-grid">
        <div className="left-column">
          <FeedbackForm onSubmitted={handleFeedbackSubmitted} />
        </div>

        <div className="right-column">
          <div className="card">
            <div className="card-title">情绪趋势</div>
            <EmotionTrendChart data={emotionTrend} />
          </div>

          <div className="card">
            <div className="card-title">关键事件时间线</div>
            <TimelineBoard feedbacks={feedbacks} />
          </div>

          <div className="card">
            <div className="card-title">行动项跟踪</div>
            <ActionItemList
              actions={actions}
              onUpdated={handleActionUpdated}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
