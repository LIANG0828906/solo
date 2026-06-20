import React from 'react';
import { useClockStore, DIAL_COLORS, type TickStyle } from '@/store/clockStore';

const TICK_STYLES: { value: TickStyle; label: string; icon: string }[] = [
  { value: 'dots', label: '点状', icon: '●' },
  { value: 'lines', label: '短线', icon: '─' },
  { value: 'roman', label: '罗马', icon: 'XII' },
  { value: 'arabic', label: '阿拉伯', icon: '12' },
];

export const ControlPanel: React.FC = () => {
  const {
    time,
    dialColor,
    tickStyle,
    showNumbers,
    setTime,
    setDialColor,
    setTickStyle,
    toggleNumbers,
    triggerScreenshot,
  } = useClockStore();

  const handleHourChange = (delta: number) => {
    const newHour = ((time.hour + delta) % 24 + 24) % 24;
    setTime({ ...time, hour: newHour });
  };

  const handleMinuteChange = (delta: number) => {
    const newMinute = ((time.minute + delta) % 60 + 60) % 60;
    let newHour = time.hour;
    if (time.minute === 59 && delta === 1) newHour = (newHour + 1) % 24;
    if (time.minute === 0 && delta === -1) newHour = (newHour + 23) % 24;
    setTime({ hour: newHour, minute: newMinute });
  };

  const handleHourInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setTime({ ...time, hour: Math.max(0, Math.min(23, val)) });
    }
  };

  const handleMinuteInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setTime({ ...time, minute: Math.max(0, Math.min(59, val)) });
    }
  };

  return (
    <div className="control-panel">
      <div className="panel-card">
        <div className="card-title">时间调节</div>
        <div className="time-inputs">
          <div className="time-input-group">
            <label className="input-label">时</label>
            <div className="number-input-wrapper">
              <button
                className="number-btn up"
                onClick={() => handleHourChange(1)}
                aria-label="增加小时"
              >
                ▲
              </button>
              <input
                type="number"
                className="number-input"
                min={0}
                max={23}
                value={time.hour}
                onChange={handleHourInput}
              />
              <button
                className="number-btn down"
                onClick={() => handleHourChange(-1)}
                aria-label="减少小时"
              >
                ▼
              </button>
            </div>
          </div>
          <div className="time-separator">:</div>
          <div className="time-input-group">
            <label className="input-label">分</label>
            <div className="number-input-wrapper">
              <button
                className="number-btn up"
                onClick={() => handleMinuteChange(1)}
                aria-label="增加分钟"
              >
                ▲
              </button>
              <input
                type="number"
                className="number-input"
                min={0}
                max={59}
                value={time.minute}
                onChange={handleMinuteInput}
              />
              <button
                className="number-btn down"
                onClick={() => handleMinuteChange(-1)}
                aria-label="减少分钟"
              >
                ▼
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="card-title">表盘颜色</div>
        <div className="color-picker">
          {DIAL_COLORS.map((color) => (
            <button
              key={color.value}
              className={`color-btn ${dialColor === color.value ? 'active' : ''}`}
              style={{ backgroundColor: color.value }}
              onClick={() => setDialColor(color.value)}
              title={color.name}
              aria-label={`选择${color.name}`}
            />
          ))}
        </div>
      </div>

      <div className="panel-card">
        <div className="card-title">刻度样式</div>
        <div className="tick-style-picker">
          {TICK_STYLES.map((style) => (
            <button
              key={style.value}
              className={`tick-style-btn ${tickStyle === style.value ? 'active' : ''}`}
              onClick={() => setTickStyle(style.value)}
              title={style.label}
            >
              <span className="tick-icon">{style.icon}</span>
              <span className="tick-label">{style.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-card">
        <div className="card-title">数字标签</div>
        <button
          className={`toggle-btn ${showNumbers ? 'on' : 'off'}`}
          onClick={toggleNumbers}
        >
          <span className="toggle-track">
            <span className="toggle-thumb" />
          </span>
          <span className="toggle-text">{showNumbers ? '数字开' : '数字关'}</span>
        </button>
      </div>

      <div className="panel-card">
        <button
          className="screenshot-btn"
          onClick={triggerScreenshot}
        >
          📷 截图保存 PNG
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
