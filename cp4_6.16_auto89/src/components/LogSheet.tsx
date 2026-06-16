import React, { useState, useMemo } from 'react';
import { useGardenStore, ActivityType } from '../store/gardenStore';
import { format } from 'date-fns';

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  sowing: '🌱',
  watering: '💧',
  fertilizing: '🧪',
  weeding: '🧹',
  harvesting: '🍎',
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  sowing: '播种',
  watering: '浇水',
  fertilizing: '施肥',
  weeding: '除草',
  harvesting: '收获',
};

const LogSheet: React.FC = () => {
  const plots = useGardenStore((s) => s.plots);
  const logs = useGardenStore((s) => s.logs);
  const users = useGardenStore((s) => s.users);
  const currentUserId = useGardenStore((s) => s.currentUserId);
  const selectedPlotId = useGardenStore((s) => s.selectedPlotId);
  const isLogPanelOpen = useGardenStore((s) => s.isLogPanelOpen);
  const addLog = useGardenStore((s) => s.addLog);
  const toggleLogPanel = useGardenStore((s) => s.toggleLogPanel);
  const selectPlot = useGardenStore((s) => s.selectPlot);

  const [activityType, setActivityType] = useState<ActivityType>('watering');
  const [note, setNote] = useState('');
  const [cropName, setCropName] = useState('');
  const [weight, setWeight] = useState('');
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const selectedPlot = useMemo(
    () => plots.find((p) => p.id === selectedPlotId),
    [plots, selectedPlotId]
  );

  const plotLogs = useMemo(
    () =>
      logs
        .filter((l) => l.plotId === selectedPlotId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [logs, selectedPlotId]
  );

  const owner = useMemo(
    () => users.find((u) => u.id === selectedPlot?.ownerId),
    [users, selectedPlot]
  );

  const isMyPlot = selectedPlot?.ownerId === currentUserId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlotId || !isMyPlot) return;

    const entry: Omit<import('../store/gardenStore').LogEntry, 'id' | 'userId'> = {
      plotId: selectedPlotId,
      date: logDate,
      activityType,
      note,
    };

    if (activityType === 'harvesting') {
      entry.cropName = cropName;
      entry.weight = parseFloat(weight) || 0;
    }

    addLog(entry);
    setNote('');
    setCropName('');
    setWeight('');
    setActivityType('watering');
    setLogDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleClose = () => {
    toggleLogPanel(false);
    selectPlot(null);
  };

  if (!selectedPlot) return null;

  return (
    <div className={`log-panel ${isLogPanelOpen ? 'open' : ''}`}>
      <div className="log-panel-header">
        <h3>
          📋 种植日志
        </h3>
        <button className="close-btn" onClick={handleClose}>
          ✕
        </button>
      </div>

      <div className="plot-info-bar">
        <div
          className="plot-info-color"
          style={{ background: selectedPlot.color || '#999' }}
        />
        <span className="plot-info-name">{owner?.name || '未知'}</span>
        <span className="plot-info-yield">
          总产量 {selectedPlot.totalYield}g · {plotLogs.length} 条日志
        </span>
      </div>

      <div className="log-list">
        {plotLogs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📝</span>
            <p>暂无日志记录</p>
          </div>
        ) : (
          plotLogs.map((log) => {
            const logUser = users.find((u) => u.id === log.userId);
            return (
              <div className="log-entry" key={log.id}>
                <div className="log-icon">{ACTIVITY_ICONS[log.activityType]}</div>
                <div className="log-content">
                  <div className="log-activity">
                    {ACTIVITY_LABELS[log.activityType]}
                    <span className="log-date">{log.date}</span>
                  </div>
                  {log.note && <div className="log-note">{log.note}</div>}
                  {log.activityType === 'harvesting' && log.cropName && (
                    <div className="log-harvest-info">
                      🌾 {log.cropName} · {log.weight}g
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {isMyPlot && (
        <div className="log-form">
          <h4>添加记录</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>日期</label>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>活动类型</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as ActivityType)}
              >
                <option value="sowing">🌱 播种</option>
                <option value="watering">💧 浇水</option>
                <option value="fertilizing">🧪 施肥</option>
                <option value="weeding">🧹 除草</option>
                <option value="harvesting">🍎 收获</option>
              </select>
            </div>
            {activityType === 'harvesting' && (
              <div className="harvest-fields">
                <div className="form-group">
                  <label>作物名称</label>
                  <input
                    type="text"
                    placeholder="如：番茄"
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>预估重量（克）</label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            <div className="form-group">
              <label>备注</label>
              <textarea
                placeholder="记录今天的劳作感想..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              保存记录
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default LogSheet;
