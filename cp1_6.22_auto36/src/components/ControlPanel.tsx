import { useSceneStore } from '@/store/useSceneStore';
import { Building } from '@/types';

export function ControlPanel() {
  const { selectedBuildingId, buildings, updateBuilding, selectBuilding } = useSceneStore();

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);

  if (!selectedBuilding) return null;

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const height = parseFloat(e.target.value);
    updateBuilding(selectedBuilding.id, {
      height,
      position: [
        selectedBuilding.position[0],
        height / 2,
        selectedBuilding.position[2],
      ],
    });
  };

  const handleXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const x = parseFloat(e.target.value);
    updateBuilding(selectedBuilding.id, {
      position: [x, selectedBuilding.position[1], selectedBuilding.position[2]],
    });
  };

  const handleZChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const z = parseFloat(e.target.value);
    updateBuilding(selectedBuilding.id, {
      position: [selectedBuilding.position[0], selectedBuilding.position[1], z],
    });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateBuilding(selectedBuilding.id, { color: e.target.value });
  };

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h3>建筑属性编辑</h3>
        <button className="close-btn" onClick={() => selectBuilding(null)}>
          ×
        </button>
      </div>

      <div className="control-group">
        <label>
          <span className="label-text">高度: {selectedBuilding.height.toFixed(0)}m</span>
          <input
            type="range"
            min="10"
            max="80"
            step="1"
            value={selectedBuilding.height}
            onChange={handleHeightChange}
            className="slider"
          />
        </label>
      </div>

      <div className="control-group">
        <label>
          <span className="label-text">X 轴位置: {selectedBuilding.position[0].toFixed(1)}m</span>
          <input
            type="range"
            min="-20"
            max="20"
            step="0.5"
            value={selectedBuilding.position[0]}
            onChange={handleXChange}
            className="slider"
          />
        </label>
      </div>

      <div className="control-group">
        <label>
          <span className="label-text">Z 轴位置: {selectedBuilding.position[2].toFixed(1)}m</span>
          <input
            type="range"
            min="-20"
            max="20"
            step="0.5"
            value={selectedBuilding.position[2]}
            onChange={handleZChange}
            className="slider"
          />
        </label>
      </div>

      <div className="control-group">
        <label>
          <span className="label-text">颜色</span>
          <div className="color-picker-wrapper">
            <input
              type="color"
              value={selectedBuilding.color}
              onChange={handleColorChange}
              className="color-picker"
            />
            <span className="color-value">{selectedBuilding.color}</span>
          </div>
        </label>
      </div>

      <style>{`
        .control-panel {
          position: absolute;
          top: 80px;
          right: 20px;
          width: 280px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: #fff;
          z-index: 100;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .panel-header h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: #fff;
        }

        .close-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border-radius: 6px;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        .control-group {
          margin-bottom: 18px;
        }

        .control-group label {
          display: block;
          cursor: pointer;
        }

        .label-text {
          display: block;
          font-size: 13px;
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        .slider {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: #fff;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.6);
          transition: all 0.2s ease;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
        }

        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: #fff;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.6);
          transition: all 0.2s ease;
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
        }

        .color-picker-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .color-picker {
          width: 40px;
          height: 40px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          cursor: pointer;
          background: none;
          padding: 0;
          transition: all 0.2s ease;
        }

        .color-picker:hover {
          transform: scale(1.05);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .color-picker::-webkit-color-swatch-wrapper {
          padding: 0;
        }

        .color-picker::-webkit-color-swatch {
          border: none;
          border-radius: 6px;
        }

        .color-value {
          font-size: 13px;
          font-family: monospace;
          color: rgba(255, 255, 255, 0.6);
        }

        @media (max-width: 768px) {
          .control-panel {
            top: auto;
            bottom: 100px;
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            width: calc(100% - 40px);
            max-width: 360px;
          }
        }
      `}</style>
    </div>
  );
}
