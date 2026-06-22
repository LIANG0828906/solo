import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Sprint, BurndownPoint } from '../types';
import { socketApi } from '../utils/socket';

interface SprintPanelProps {
  sprint: Sprint;
  onSprintUpdate: (sprint: Sprint) => void;
}

const SprintPanel: React.FC<SprintPanelProps> = ({ sprint, onSprintUpdate }) => {
  const [burndownData, setBurndownData] = useState<BurndownPoint[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(sprint.name);
  const [editStartDate, setEditStartDate] = useState(sprint.startDate);
  const [editEndDate, setEditEndDate] = useState(sprint.endDate);
  const [editTotalPoints, setEditTotalPoints] = useState(sprint.totalStoryPoints);

  useEffect(() => {
    fetchBurndown();
  }, []);

  useEffect(() => {
    const handleTaskUpdated = () => {
      fetchBurndown();
    };
    
    const handleTaskMoved = () => {
      fetchBurndown();
    };
    
    const handleTaskCreated = () => {
      fetchBurndown();
    };
    
    const handleTaskDeleted = () => {
      fetchBurndown();
    };

    socketApi.on('task:updated', handleTaskUpdated);
    socketApi.on('task:moved', handleTaskMoved);
    socketApi.on('task:created', handleTaskCreated);
    socketApi.on('task:deleted', handleTaskDeleted);

    return () => {
      socketApi.off('task:updated', handleTaskUpdated);
      socketApi.off('task:moved', handleTaskMoved);
      socketApi.off('task:created', handleTaskCreated);
      socketApi.off('task:deleted', handleTaskDeleted);
    };
  }, []);

  useEffect(() => {
    setEditName(sprint.name);
    setEditStartDate(sprint.startDate);
    setEditEndDate(sprint.endDate);
    setEditTotalPoints(sprint.totalStoryPoints);
  }, [sprint]);

  const fetchBurndown = async () => {
    try {
      const response = await fetch('/api/burndown');
      const data = await response.json();
      setBurndownData(data);
    } catch (error) {
      console.error('Failed to fetch burndown data:', error);
    }
  };

  const handleSave = () => {
    fetch('/api/sprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        startDate: editStartDate,
        endDate: editEndDate,
        totalStoryPoints: editTotalPoints,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        onSprintUpdate(data);
        setIsEditing(false);
        fetchBurndown();
      });
  };

  const totalDays = Math.ceil(
    (new Date(sprint.endDate).getTime() - new Date(sprint.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const chartData = burndownData.map((item) => ({
    ...item,
    date: item.date.slice(5),
    actual: item.actual,
  }));

  if (isEditing) {
    return (
      <div className="panel-section">
        <h3 className="panel-title">编辑 Sprint</h3>
        <div className="form-group">
          <label className="form-label">Sprint 名称</label>
          <input
            type="text"
            className="form-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">开始日期</label>
            <input
              type="date"
              className="form-input"
              value={editStartDate}
              onChange={(e) => setEditStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">结束日期</label>
            <input
              type="date"
              className="form-input"
              value={editEndDate}
              onChange={(e) => setEditEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">总故事点数</label>
          <input
            type="number"
            className="form-input"
            value={editTotalPoints}
            onChange={(e) => setEditTotalPoints(Number(e.target.value))}
            min={1}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1 }}>
            保存
          </button>
          <button className="btn btn-ghost" onClick={() => setIsEditing(false)} style={{ flex: 1 }}>
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="panel-title" style={{ marginBottom: 0 }}>
          Sprint 规划
        </h3>
        <button
          className="btn btn-ghost"
          style={{ padding: '4px 8px', fontSize: '12px' }}
          onClick={() => setIsEditing(true)}
        >
          编辑
        </button>
      </div>
      <div className="sprint-info" style={{ marginTop: '12px' }}>
        <div>
          <strong>{sprint.name}</strong>
        </div>
        <div>
          周期：{sprint.startDate} ~ {sprint.endDate}
        </div>
        <div>共 {totalDays} 天</div>
      </div>
      <div className="sprint-stats">
        <div className="sprint-stat">
          <div className="sprint-stat-value">{sprint.totalStoryPoints}</div>
          <div className="sprint-stat-label">总故事点</div>
        </div>
        <div className="sprint-stat">
          <div className="sprint-stat-value">
            {burndownData.length > 0
              ? sprint.totalStoryPoints - (burndownData[burndownData.length - 1]?.actual ?? 0)
              : 0}
          </div>
          <div className="sprint-stat-label">已完成</div>
        </div>
      </div>
      <h4 style={{ fontSize: '13px', marginTop: '16px', marginBottom: '8px' }}>燃尽图</h4>
      <div className="burndown-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#7f8c8d" />
            <YAxis tick={{ fontSize: 10 }} stroke="#7f8c8d" />
            <Tooltip
              contentStyle={{
                fontSize: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line
              type="monotone"
              dataKey="ideal"
              stroke="#bdc3c7"
              strokeDasharray="5 5"
              name="理想线"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#3498db"
              name="实际完成"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SprintPanel;
