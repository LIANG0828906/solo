import { useExhibitStore } from '@/store/exhibitStore';
import { Sun, Thermometer, RotateCcw } from 'lucide-react';

export default function ControlPanel() {
  const { lightConfig, updateLightAngle, updateLightColorTemp, resetExhibits } = useExhibitStore();

  const handleAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateLightAngle(parseFloat(e.target.value));
  };

  const handleColorTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateLightColorTemp(parseFloat(e.target.value));
  };

  return (
    <div className="control-panel">
      <h3 className="panel-title">灯光控制</h3>
      
      <div className="control-group">
        <div className="control-label">
          <RotateCcw size={16} />
          <span>光源角度</span>
          <span className="value">{lightConfig.angle.toFixed(0)}°</span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          value={lightConfig.angle}
          onChange={handleAngleChange}
          className="custom-slider"
        />
        <div className="slider-labels">
          <span>0°</span>
          <span>180°</span>
          <span>360°</span>
        </div>
      </div>

      <div className="control-group">
        <div className="control-label">
          <Thermometer size={16} />
          <span>色温调节</span>
          <span className="value">{lightConfig.colorTemp.toFixed(0)}K</span>
        </div>
        <input
          type="range"
          min="2700"
          max="6500"
          step="100"
          value={lightConfig.colorTemp}
          onChange={handleColorTempChange}
          className="custom-slider temp-slider"
        />
        <div className="slider-labels">
          <span>暖色 2700K</span>
          <span>冷色 6500K</span>
        </div>
      </div>

      <div className="color-preview">
        <div className="preview-label">光源颜色预览</div>
        <div 
          className="color-circle" 
          style={{ backgroundColor: lightConfig.color }}
        />
      </div>

      <button className="reset-btn" onClick={resetExhibits}>
        重置展品位置
      </button>

      <style>{`
        .control-panel {
          position: fixed;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          width: 280px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          z-index: 1000;
        }

        .panel-title {
          margin: 0 0 20px 0;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-align: center;
          color: #4FC3F7;
        }

        .control-group {
          margin-bottom: 24px;
        }

        .control-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 14px;
          color: #e0e0e0;
        }

        .control-label .value {
          margin-left: auto;
          font-weight: 600;
          color: #4FC3F7;
        }

        .custom-slider {
          width: 100%;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: #333;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }

        .custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #fff;
          border: 2px solid #4FC3F7;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .custom-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 10px rgba(79, 195, 247, 0.5);
        }

        .custom-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #fff;
          border: 2px solid #4FC3F7;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .custom-slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 10px rgba(79, 195, 247, 0.5);
        }

        .custom-slider:active::-webkit-slider-thumb {
          background: #4FC3F7;
        }

        .temp-slider {
          background: linear-gradient(to right, #ff8a00, #ffffff, #87ceeb);
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #888;
          margin-top: 6px;
        }

        .color-preview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .preview-label {
          font-size: 12px;
          color: #aaa;
        }

        .color-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 15px currentColor;
          transition: background-color 0.3s ease;
        }

        .reset-btn {
          width: 100%;
          padding: 10px 16px;
          background: #333;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .reset-btn:hover {
          background: #555;
        }

        @media (max-width: 768px) {
          .control-panel {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
