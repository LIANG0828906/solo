import { useState, useEffect } from 'react';
import { Copy, Check, Play, Pause, RotateCcw } from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { calcSunPosition, calcLocalTime, calcSunriseSunset } from '@/utils/geoCalculator';

function formatTime(totalMinutes: number): string {
  const minutes = Math.round(((totalMinutes % 1440) + 1440) % 1440);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

const SEASON_LABELS: Record<'vernal' | 'summer' | 'autumnal' | 'winter', string> = {
  vernal: '春分',
  summer: '夏至',
  autumnal: '秋分',
  winter: '冬至',
};

export default function ControlPanel() {
  const time = useSimulationStore((s) => s.time);
  const selectedLat = useSimulationStore((s) => s.selectedLat);
  const selectedLon = useSimulationStore((s) => s.selectedLon);
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const seasonPreset = useSimulationStore((s) => s.seasonPreset);
  const sunDeclination = useSimulationStore((s) => s.sunDeclination);
  const setTime = useSimulationStore((s) => s.setTime);
  const togglePlay = useSimulationStore((s) => s.togglePlay);
  const resetCamera = useSimulationStore((s) => s.resetCamera);
  const setSeasonPreset = useSimulationStore((s) => s.setSeasonPreset);

  const [isCopied, setIsCopied] = useState(false);

  const sunPosition = calcSunPosition(time, sunDeclination);
  const hasSelection = selectedLat !== null && selectedLon !== null;

  let localTime = '';
  let sunrise = '';
  let sunset = '';

  if (hasSelection) {
    localTime = calcLocalTime(selectedLat!, selectedLon!, sunPosition.lon);
    const sunData = calcSunriseSunset(selectedLat!, selectedLon!, time, sunDeclination);
    sunrise = sunData.sunrise;
    sunset = sunData.sunset;
  }

  const handleCopyCoords = async () => {
    if (!hasSelection) return;
    const text = `纬度: ${selectedLat!.toFixed(1)}°, 经度: ${selectedLon!.toFixed(1)}°`;
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
    } catch {
      setIsCopied(true);
    }
  };

  useEffect(() => {
    if (!isCopied) return;
    const timer = setTimeout(() => setIsCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [isCopied]);

  const currentTimeStr = formatTime(time);

  return (
    <>
      <style>{`
        @keyframes controlPulse {
          0% { box-shadow: 0 0 0 0 rgba(102, 204, 255, 0.6); }
          100% { box-shadow: 0 0 0 12px rgba(102, 204, 255, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .control-panel {
          position: fixed;
          right: 0;
          top: 0;
          width: 280px;
          height: 100vh;
          background: rgba(10, 14, 26, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-left: 2px solid rgba(255, 255, 255, 0.1);
          padding: 20px;
          box-sizing: border-box;
          color: #ffffff;
          overflow-y: auto;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 18px;
          font-family: inherit;
        }
        @media (max-width: 1024px) {
          .control-panel {
            top: auto;
            bottom: 0;
            height: 120px;
            width: 100%;
            border-left: none;
            border-top: 2px solid rgba(255, 255, 255, 0.1);
            overflow-x: auto;
            overflow-y: hidden;
            display: flex;
            flex-direction: row;
            gap: 16px;
          }
          .control-panel > * {
            flex-shrink: 0;
            width: 240px;
          }
        }
        .panel-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 0;
          white-space: nowrap;
          color: #ffffff;
          letter-spacing: 0.5px;
        }
        .section-block {
          animation: fadeIn 0.3s ease;
        }
        .section-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 8px;
          display: block;
        }
        .time-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .time-big-display {
          font-family: 'Courier New', Consolas, Monaco, monospace;
          font-size: 20px;
          font-weight: 700;
          color: #88ff88;
          text-shadow: 0 0 8px rgba(136, 255, 136, 0.5);
          letter-spacing: 1px;
        }
        .time-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          background: linear-gradient(to right, #2a3a4a, #3a4a5a);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        .time-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #66ccff;
          border: none;
          cursor: pointer;
          transition: box-shadow 0.3s ease;
        }
        .time-slider::-webkit-slider-thumb:active {
          animation: controlPulse 0.3s ease-out;
        }
        .time-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #66ccff;
          border: none;
          cursor: pointer;
        }
        .time-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 4px;
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          font-family: 'Courier New', Consolas, Monaco, monospace;
        }
        .btn-row {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        .btn-primary {
          flex: 1;
          padding: 8px 12px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, #4488ff, #2a5fff);
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #66aaff, #4488ff);
        }
        .btn-primary:active {
          transform: scale(0.95);
        }
        .btn-secondary {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          color: #ffffff;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        .btn-secondary:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.35);
        }
        .btn-secondary:active {
          transform: scale(0.95);
        }
        .season-select {
          width: 100%;
          padding: 8px 10px;
          border-radius: 8px;
          background: rgba(42, 58, 74, 0.8);
          border: 1px solid rgba(255,255,255,0.15);
          color: #ffffff;
          font-size: 13px;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .season-select:hover {
          border-color: rgba(102, 204, 255, 0.5);
        }
        .season-select option {
          background: #1a2538;
          color: #ffffff;
        }
        .location-panel {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .empty-tip {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          text-align: center;
          padding: 16px 0;
          font-style: italic;
        }
        .data-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .data-label {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
        }
        .data-value {
          font-family: 'Courier New', Consolas, Monaco, monospace;
          font-size: 14px;
          color: #88ff88;
          text-shadow: 0 0 6px rgba(136, 255, 136, 0.4);
          font-weight: 600;
        }
        .copy-btn {
          width: 100%;
          height: 28px;
          padding: 0 10px;
          border: none;
          border-radius: 6px;
          background: linear-gradient(135deg, #4488ff, #2a5fff);
          color: #ffffff;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          transition: all 0.2s ease;
          margin-top: 4px;
        }
        .copy-btn:hover {
          background: linear-gradient(135deg, #66aaff, #4488ff);
        }
        .copy-btn:active {
          transform: scale(0.97);
        }
        .copy-btn.copied {
          background: linear-gradient(135deg, #22cc66, #11aa55);
        }
        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent);
          margin: 2px 0;
        }
      `}</style>

      <div className="control-panel">
        <div className="section-block">
          <div className="panel-title">🌍 地球昼夜模拟器</div>
        </div>

        <div className="section-block">
          <div className="time-header">
            <span className="section-label" style={{ marginBottom: 0 }}>时间控制</span>
            <span className="time-big-display">{currentTimeStr}</span>
          </div>
          <input
            type="range"
            className="time-slider"
            min={0}
            max={1439}
            step={1}
            value={time}
            onChange={(e) => setTime(parseInt(e.target.value, 10))}
          />
          <div className="time-labels">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
          <div className="btn-row">
            <button className="btn-primary" onClick={togglePlay}>
              {isPlaying ? (
                <>
                  <Pause size={14} />
                  <span>暂停</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>播放</span>
                </>
              )}
            </button>
            <button className="btn-secondary" onClick={resetCamera}>
              <RotateCcw size={14} />
              <span>重置视角</span>
            </button>
          </div>
        </div>

        <div className="divider" />

        <div className="section-block">
          <span className="section-label">日期预设</span>
          <select
            className="season-select"
            value={seasonPreset}
            onChange={(e) => setSeasonPreset(e.target.value as 'vernal' | 'summer' | 'autumnal' | 'winter')}
          >
            <option value="vernal">{SEASON_LABELS.vernal}</option>
            <option value="summer">{SEASON_LABELS.summer}</option>
            <option value="autumnal">{SEASON_LABELS.autumnal}</option>
            <option value="winter">{SEASON_LABELS.winter}</option>
          </select>
        </div>

        <div className="divider" />

        <div className="section-block">
          <span className="section-label">位置信息</span>
          {hasSelection ? (
            <div className="location-panel">
              <div className="data-row">
                <span className="data-label">纬度</span>
                <span className="data-value">{selectedLat!.toFixed(1)}°</span>
              </div>
              <div className="data-row">
                <span className="data-label">经度</span>
                <span className="data-value">{selectedLon!.toFixed(1)}°</span>
              </div>
              <div className="divider" />
              <div className="data-row">
                <span className="data-label">当地时间</span>
                <span className="data-value">{localTime}</span>
              </div>
              <div className="data-row">
                <span className="data-label">日出</span>
                <span className="data-value">{sunrise}</span>
              </div>
              <div className="data-row">
                <span className="data-label">日落</span>
                <span className="data-value">{sunset}</span>
              </div>
              <button
                className={`copy-btn ${isCopied ? 'copied' : ''}`}
                onClick={handleCopyCoords}
                disabled={isCopied}
              >
                {isCopied ? (
                  <>
                    <Check size={13} />
                    <span>已复制</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>复制经纬度</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="empty-tip">
              点击地球表面查看当地时间与日出日落
            </div>
          )}
        </div>
      </div>
    </>
  );
}
