import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Sprint, DailyBurndown } from '../types';
import { on } from '../utils/socket';
import './components.css';

interface BurndownData {
  date: string;
  ideal: number;
  actual: number;
}

const formatDate = (dateStr: string): string => {
  const parts = dateStr.split('-');
  return `${parts[1]}/${parts[2]}`;
};

const transformBurndownData = (sprint: Sprint): BurndownData[] => {
  return sprint.dailyBurndown.map((day: DailyBurndown) => ({
    date: formatDate(day.date),
    ideal: Math.round(day.ideal * 10) / 10,
    actual: day.actual
  }));
};

export default function SprintPanel() {
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    totalStoryPoints: 0
  });

  const fetchSprint = async () => {
    try {
      const res = await fetch('/api/sprint');
      const data = await res.json();
      setSprint(data);
    } catch (error) {
      console.error('Failed to fetch sprint:', error);
    }
  };

  useEffect(() => {
    fetchSprint();
  }, []);

  useEffect(() => {
    const offSprintUpdated = on<Sprint>('sprint:updated', (updatedSprint) => {
      setSprint(updatedSprint);
    });
    return () => offSprintUpdated();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newSprint = await res.json();
        setSprint(newSprint);
        setShowModal(false);
        setFormData({ name: '', startDate: '', endDate: '', totalStoryPoints: 0 });
      }
    } catch (error) {
      console.error('Failed to create sprint:', error);
    }
  };

  const burndownData = sprint ? transformBurndownData(sprint) : [];

  return (
    <div className="sprint-panel-card">
      <div className="sprint-panel-header">
        <h3 className="sprint-panel-title">Sprint 规划</h3>
        <button className="sprint-panel-button" onClick={() => setShowModal(true)}>
          创建 Sprint
        </button>
      </div>

      {sprint ? (
        <>
          <div className="sprint-info">
            <div className="sprint-name">{sprint.name}</div>
            <div className="sprint-dates">{sprint.startDate} ~ {sprint.endDate}</div>
            <div className="sprint-points">总故事点数: {sprint.totalStoryPoints}</div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#7f8c8d" />
                <YAxis tick={{ fontSize: 11 }} stroke="#7f8c8d" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="ideal" stroke="#95a5a6" strokeWidth={2} strokeDasharray="5 5" dot={false} name="理想" />
                <Line type="monotone" dataKey="actual" stroke="#3498db" strokeWidth={2} dot={false} name="实际" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="sprint-empty">暂无 Sprint 数据</div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4 className="modal-title">创建 Sprint</h4>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Sprint 名称</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">开始日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">结束日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">总故事点数</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.totalStoryPoints}
                  onChange={(e) => setFormData({ ...formData, totalStoryPoints: Number(e.target.value) })}
                  min={0}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="sprint-panel-button cancel" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="sprint-panel-button">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
