import { useState, useMemo } from 'react';
import { FaFire } from 'react-icons/fa';
import { SeatMap } from './components/SeatMap';
import { StatsPanel } from './components/StatsPanel';
import { HeatMap } from './components/HeatMap';
import { useSseData, type Seat } from './hooks/useSseData';

interface ActivityConfig {
  name: string;
  date: string;
  rows: number;
  cols: number;
}

function generateSeats(rows: number, cols: number): Seat[] {
  const seats: Seat[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      seats.push({
        id: `seat-${r}-${c}`,
        row: r,
        col: c,
        checkedIn: false,
      });
    }
  }
  return seats;
}

function App() {
  const [config, setConfig] = useState<ActivityConfig>({
    name: '2024 年度技术分享会',
    date: new Date().toISOString().split('T')[0],
    rows: 10,
    cols: 15,
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [heatmapOpen, setHeatmapOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<ActivityConfig>(config);

  const initialSeats = useMemo(
    () => generateSeats(config.rows, config.cols),
    [config.rows, config.cols]
  );

  const { seats, manualCheckIn, recentSpeed } = useSseData(
    initialSeats, isConfigured);

  const checkInRate = seats.length > 0
    ? (seats.filter(s => s.checkedIn).length / seats.length) * 100
    : 0;

  const heatmapIconActive = checkInRate > 30;

  const handleApplyConfig = () => {
    const rows = Math.max(1, Math.min(30, tempConfig.rows));
    const cols = Math.max(1, Math.min(40, tempConfig.cols));
    setConfig({ ...tempConfig, rows, cols });
    setIsConfigured(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="nav-bar">
        <div className="nav-title">{config.name || '活动签到系统'}</div>
        <div className="nav-actions">
          <button
            className={`heatmap-icon-btn ${heatmapIconActive ? 'active' : ''}`}
            onClick={() => setHeatmapOpen(true)}
            title="查看热力图"
          >
            <FaFire />
          </button>
        </div>
      </nav>

      <div className="main-container">
        <div className="card config-section">
          <div className="config-field">
            <label>活动名称</label>
            <input
              type="text"
              value={tempConfig.name}
              onChange={(e) => setTempConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入活动名称"
            />
          </div>
          <div className="config-field">
            <label>活动日期</label>
            <input
              type="date"
              value={tempConfig.date}
              onChange={(e) => setTempConfig(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div className="config-field">
            <label>座位行数</label>
            <input
              type="number"
              min="1"
              max="30"
              value={tempConfig.rows}
              onChange={(e) => setTempConfig(prev => ({ ...prev, rows: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <div className="config-field">
            <label>座位列数</label>
            <input
              type="number"
              min="1"
              max="40"
              value={tempConfig.cols}
              onChange={(e) => setTempConfig(prev => ({ ...prev, cols: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <button className="primary-btn" onClick={handleApplyConfig}>
            {isConfigured ? '重新配置' : '开始签到'}
          </button>
        </div>

        {isConfigured && (
          <>
            <SeatMap
              seats={seats}
              rows={config.rows}
              cols={config.cols}
              onSeatClick={manualCheckIn}
            />
            <StatsPanel seats={seats} recentSpeed={recentSpeed} />
          </>
        )}
      </div>

      <HeatMap
        open={heatmapOpen}
        onClose={() => setHeatmapOpen(false)}
        seats={seats}
        rows={config.rows}
        cols={config.cols}
      />
    </div>
  );
}

export default App;
