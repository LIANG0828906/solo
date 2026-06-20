import { useMemo } from 'react';
import { Earthquake } from '../types/earthquake';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ControlPanelProps {
  earthquakes: Earthquake[];
  currentTime: string;
  minTime: string;
  maxTime: string;
  onTimeChange: (time: string) => void;
  onListClick: (earthquake: Earthquake) => void;
  loading: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const ControlPanel = ({
  earthquakes,
  currentTime,
  minTime,
  maxTime,
  onTimeChange,
  onListClick,
  loading,
  collapsed,
  onToggleCollapse,
}: ControlPanelProps) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    const startTime = new Date(minTime).getTime();
    const endTime = new Date(maxTime).getTime();
    const newTime = startTime + (value / 100) * (endTime - startTime);
    onTimeChange(new Date(newTime).toISOString());
  };

  const sliderValue = useMemo(() => {
    if (!minTime || !maxTime || !currentTime) return 100;
    const startTime = new Date(minTime).getTime();
    const endTime = new Date(maxTime).getTime();
    const current = new Date(currentTime).getTime();
    if (endTime === startTime) return 100;
    return ((current - startTime) / (endTime - startTime)) * 100;
  }, [currentTime, minTime, maxTime]);

  const formatTimeLabel = (dateStr: string) => {
    if (!dateStr) return '';
    return format(new Date(dateStr), 'MM/dd', { locale: zhCN });
  };

  const formatFullTime = (dateStr: string) => {
    if (!dateStr) return '';
    return format(new Date(dateStr), 'MM月dd日 HH:mm', { locale: zhCN });
  };

  const getMagColor = (mag: number) => {
    if (mag >= 6) return '#ff4444';
    if (mag >= 5) return '#ff6b6b';
    if (mag >= 4) return '#ffa94d';
    return '#51cf66';
  };

  const getDepthColor = (depth: number) => {
    if (depth < 70) return '#ff6b6b';
    if (depth < 300) return '#9c36b5';
    return '#1c7ed6';
  };

  return (
    <>
      <button 
        className="hamburger-btn" 
        onClick={onToggleCollapse}
        style={{ display: collapsed ? 'flex' : 'none' }}
        aria-label="展开面板"
      >
        <span></span>
      </button>

      <div className={`control-panel ${collapsed ? 'collapsed' : 'expanded'}`}>
        <button 
          className="hamburger-btn"
          style={{ display: collapsed ? 'none' : 'flex' }}
          onClick={onToggleCollapse}
          aria-label="收起面板"
        >
          <span></span>
        </button>

        <div className="panel-header">
          <h1 className="panel-title">全球地震监测</h1>
          <p className="panel-subtitle">近7天地震活动三维可视化</p>
        </div>

        <div className="panel-section">
          <h2 className="section-title">时间轴</h2>
          <div className="time-slider-container">
            <div className="current-time-display">{formatFullTime(currentTime)}</div>
            <div className="slider-wrapper">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={sliderValue}
                onChange={handleSliderChange}
                disabled={loading}
              />
            </div>
            <div className="time-range-labels">
              <span>{formatTimeLabel(minTime)}</span>
              <span>{formatTimeLabel(maxTime)}</span>
            </div>
          </div>
        </div>

        <div className="panel-section">
          <h2 className="section-title">深度图例</h2>
          <div className="legend-section">
            <div className="legend-row">
              <div className="legend-gradient"></div>
            </div>
            <div className="legend-row" style={{ justifyContent: 'space-between' }}>
              <span style={{ color: '#ff6b6b', fontSize: '11px' }}>浅源 0km</span>
              <span style={{ color: '#1c7ed6', fontSize: '11px' }}>深源 700km</span>
            </div>
          </div>
        </div>

        <div className="panel-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h2 className="section-title">地震列表</h2>
          <div className="list-count">
            共 {earthquakes.length} 条记录
          </div>
          <div className="earthquake-list">
            {loading ? (
              <div className="loading-spinner">加载中...</div>
            ) : earthquakes.length === 0 ? (
              <div className="loading-spinner">暂无数据</div>
            ) : (
              earthquakes.map((eq) => (
                <div
                  key={eq.id}
                  className="list-item"
                  onClick={() => onListClick(eq)}
                >
                  <div className="list-item-header">
                    <span className="list-item-mag" style={{ color: getMagColor(eq.mag) }}>
                      {eq.mag.toFixed(1)}
                    </span>
                    <span className="list-item-time">
                      {format(new Date(eq.time), 'MM-dd HH:mm', { locale: zhCN })}
                    </span>
                  </div>
                  <div className="list-item-place">{eq.place}</div>
                  <div className="list-item-depth">
                    <span
                      className="depth-indicator"
                      style={{ backgroundColor: getDepthColor(eq.depth) }}
                    ></span>
                    深度: {eq.depth.toFixed(0)} km
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ControlPanel;
