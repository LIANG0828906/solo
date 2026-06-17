import { useFractalStore } from "../store/fractalStore";

export default function ControlPanel() {
  const {
    layers,
    rotation,
    scale,
    colorStart,
    colorEnd,
    setLayers,
    setRotation,
    setScale,
    setColorStart,
    setColorEnd,
    reset,
  } = useFractalStore();

  const handleExport = () => {
    console.log("Export");
  };

  return (
    <>
      <style>{`
        .control-panel {
          width: 320px;
          background-color: #1E1E2E;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .control-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .control-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #C9D1D9;
          font-size: 14px;
        }

        .control-value {
          font-weight: 600;
        }

        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          background: #3A3D42;
          border-radius: 3px;
          outline: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: #61AFEF;
          border-radius: 50%;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          background: #528BFF;
        }

        input[type="range"]:active::-webkit-slider-thumb {
          background: #3B82F6;
        }

        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: #61AFEF;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          transition: background-color 0.15s ease;
        }

        input[type="range"]::-moz-range-thumb:hover {
          background: #528BFF;
        }

        input[type="range"]:active::-moz-range-thumb {
          background: #3B82F6;
        }

        .color-picker-group {
          display: flex;
          gap: 16px;
        }

        .color-picker-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .color-picker-label {
          color: #C9D1D9;
          font-size: 14px;
        }

        input[type="color"] {
          -webkit-appearance: none;
          appearance: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          padding: 0;
          overflow: hidden;
        }

        input[type="color"]::-webkit-color-swatch-wrapper {
          padding: 0;
        }

        input[type="color"]::-webkit-color-swatch {
          border: none;
          border-radius: 50%;
        }

        input[type="color"]::-moz-color-swatch {
          border: none;
          border-radius: 50%;
        }

        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .btn-export {
          flex: 1;
          background-color: #238636;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .btn-export:hover {
          background-color: #2EA043;
        }

        .btn-reset {
          flex: 1;
          background-color: #30363D;
          color: #C9D1D9;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .btn-reset:hover {
          background-color: #484F58;
        }

        @media (max-width: 768px) {
          .control-panel {
            width: 100%;
          }
        }
      `}</style>
      <div className="control-panel">
        <div className="control-item">
          <div className="control-label">
            <span>层数</span>
            <span className="control-value">{layers}</span>
          </div>
          <input
            type="range"
            min="2"
            max="10"
            value={layers}
            onChange={(e) => setLayers(Number(e.target.value))}
          />
        </div>

        <div className="control-item">
          <div className="control-label">
            <span>旋转角度</span>
            <span className="control-value">{rotation}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
          />
        </div>

        <div className="control-item">
          <div className="control-label">
            <span>缩放比例</span>
            <span className="control-value">{scale.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
          />
        </div>

        <div className="color-picker-group">
          <div className="color-picker-item">
            <span className="color-picker-label">起始颜色</span>
            <input
              type="color"
              value={colorStart}
              onChange={(e) => setColorStart(e.target.value)}
            />
          </div>
          <div className="color-picker-item">
            <span className="color-picker-label">结束颜色</span>
            <input
              type="color"
              value={colorEnd}
              onChange={(e) => setColorEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="button-group">
          <button className="btn-export" onClick={handleExport}>
            导出
          </button>
          <button className="btn-reset" onClick={reset}>
            重置
          </button>
        </div>
      </div>
    </>
  );
}
