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
    let newHour = time.hour + delta;
    if (newHour >= 24) newHour = newHour - 24;
    if (newHour < 0) newHour = newHour + 24;
    setTime({ ...time, hour: newHour });
  };

  const handleMinuteChange = (delta: number) => {
    let newMinute = time.minute + delta;
    let newHour = time.hour;
    if (newMinute >= 60) {
      newMinute = newMinute - 60;
      newHour = newHour + 1;
      if (newHour >= 24) newHour = 0;
    }
    if (newMinute < 0) {
      newMinute = newMinute + 60;
      newHour = newHour - 1;
      if (newHour < 0) newHour = 23;
    }
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

  const displayHour12 = time.hour === 0 ? 12 : time.hour > 12 ? time.hour - 12 : time.hour;

  const handleQuickHourInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    val = Math.max(1, Math.min(12, val));
    const isPM = time.hour >= 12 && time.hour < 24;
    let newHour = val === 12 ? (isPM ? 12 : 0) : (isPM ? val + 12 : val);
    setTime({ ...time, hour: newHour });
  };

  const handleQuickMinuteInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setTime({ ...time, minute: Math.max(0, Math.min(59, val)) });
    }
  };

  const isPM = time.hour >= 12;

  const toggleAmPm = () => {
    let newHour = time.hour;
    if (isPM) {
      newHour = time.hour - 12;
    } else {
      newHour = time.hour + 12;
    }
    if (newHour === 24) newHour = 12;
    if (newHour === 12 && !isPM) newHour = 12;
    if (newHour === 0 && isPM) newHour = 12;
    setTime({ ...time, hour: newHour });
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
        <div className="card-title">精确时间输入（12小时制）</div>
        <div className="quick-time-inputs">
          <div className="quick-time-group">
            <label className="input-label">时 (1-12)</label>
            <input
              type="number"
              className="number-input quick-input"
              min={1}
              max={12}
              value={displayHour12}
              onChange={handleQuickHourInput}
            />
          </div>
          <div className="quick-time-separator">:</div>
          <div className="quick-time-group">
            <label className="input-label">分 (0-59)</label>
            <input
              type="number"
              className="number-input quick-input"
              min={0}
              max={59}
              value={time.minute.toString().padStart(2, '0')}
              onChange={handleQuickMinuteInput}
            />
          </div>
          <button
            className={`ampm-btn ${isPM ? 'pm' : 'am'}`}
            onClick={toggleAmPm}
          >
            {isPM ? 'PM' : 'AM'}
          </button>
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
