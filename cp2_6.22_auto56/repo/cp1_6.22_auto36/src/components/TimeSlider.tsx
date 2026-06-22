import { useSceneStore } from '@/store/useSceneStore';

export function TimeSlider() {
  const { timeOfDay, setTimeOfDay } = useSceneStore();

  const formatTime = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setTimeOfDay(value);
  };

  return (
    <div className="time-slider-container">
      <div className="time-label">
        <span className="time-value">{formatTime(timeOfDay)}</span>
        <span className="time-icon">☀</span>
      </div>
      <div className="slider-wrapper">
        <span className="time-mark start">06:00</span>
        <input
          type="range"
          min="6"
          max="18"
          step="0.25"
          value={timeOfDay}
          onChange={handleChange}
          className="time-slider"
        />
        <span className="time-mark end">18:00</span>
      </div>

      <style>{`
        .time-slider-container {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          max-width: 600px;
          padding: 20px 28px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          z-index: 100;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .time-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .time-value {
          font-size: 24px;
          font-weight: 600;
          color: #fff;
          font-variant-numeric: tabular-nums;
          letter-spacing: 1px;
        }

        .time-icon {
          font-size: 20px;
        }

        .slider-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .time-mark {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }

        .time-slider {
          flex: 1;
          height: 8px;
          -webkit-appearance: none;
          appearance: none;
          background: linear-gradient(90deg, #ffd93d, #ff6b6b, #667eea, #4c6ef5);
          border-radius: 4px;
          outline: none;
          cursor: pointer;
        }

        .time-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          background: #fff;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.7);
          transition: all 0.2s ease;
        }

        .time-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.9);
        }

        .time-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          background: #fff;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.7);
          transition: all 0.2s ease;
        }

        .time-slider::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.9);
        }

        @media (max-width: 768px) {
          .time-slider-container {
            width: calc(100% - 30px);
            padding: 16px 20px;
            bottom: 16px;
          }

          .time-value {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}
