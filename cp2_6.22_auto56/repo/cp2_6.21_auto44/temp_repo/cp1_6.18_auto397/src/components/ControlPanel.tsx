import { useState } from 'react';
import { Sun, Circle, Trash2, Play, Pause, Gauge, Settings, Sparkles } from 'lucide-react';
import { useSimulationStore, PRESET_SCENES, type SimulationMode } from '../store/SimulationStore';

const modeLabels: Record<SimulationMode, string> = {
  free: '自由模式',
  stable: '稳定模式',
  demo: '演示模式',
};

const modeDescriptions: Record<SimulationMode, string> = {
  free: '无边界限制，天体可飞出可视区域',
  stable: '画布边缘反弹，速度衰减80%',
  demo: '加载预设场景进行观看',
};

export function ControlPanel() {
  const {
    mode,
    speed,
    maxBodies,
    bodies,
    setMode,
    setSpeed,
    clearBodies,
    createBody,
    loadPresetScene,
  } = useSimulationStore();

  const [showDemoScenes, setShowDemoScenes] = useState(false);
  const [isCreating, setIsCreating] = useState<'star' | 'planet' | null>(null);

  const handleCreateBody = (type: 'star' | 'planet') => {
    if (bodies.length >= maxBodies) return;
    setIsCreating(type);
    const x = 200 + Math.random() * 800;
    const y = 100 + Math.random() * 600;
    const vx = (Math.random() - 0.5) * 2;
    const vy = (Math.random() - 0.5) * 2;
    createBody(type, { x, y }, { x: vx, y: vy });
    setTimeout(() => setIsCreating(null), 200);
  };

  const handleLoadPreset = (index: number) => {
    loadPresetScene(index);
    setShowDemoScenes(false);
  };

  return (
    <div className="control-panel">
      <div className="panel-header">
        <Sparkles size={20} className="text-accent" />
        <h2 className="panel-title">引力沙盒</h2>
      </div>

      <div className="section">
        <h3 className="section-title">
          <Settings size={14} />
          模拟模式
        </h3>
        <div className="mode-buttons">
          {(['free', 'stable', 'demo'] as SimulationMode[]).map((m) => (
            <button
              key={m}
              className={`mode-btn ${mode === m ? 'active' : ''}`}
              onClick={() => {
                setMode(m);
                if (m === 'demo') setShowDemoScenes(true);
              }}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>
        <p className="mode-description">{modeDescriptions[mode]}</p>
      </div>

      {mode === 'demo' && (
        <div className={`section demo-section ${showDemoScenes ? 'show' : 'hide'}`}>
          <h3 className="section-title">
            <Play size={14} />
            预设场景
          </h3>
          <div className="demo-buttons">
            {PRESET_SCENES.map((scene, index) => (
              <button
                key={scene.name}
                className="demo-btn"
                onClick={() => handleLoadPreset(index)}
              >
                {scene.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <h3 className="section-title">
          <Circle size={14} />
          创建天体
        </h3>
        <div className="create-buttons">
          <button
            className={`create-btn star-btn ${isCreating === 'star' ? 'creating' : ''}`}
            onClick={() => handleCreateBody('star')}
            disabled={bodies.length >= maxBodies}
          >
            <Sun size={18} />
            <span>创建恒星</span>
          </button>
          <button
            className={`create-btn planet-btn ${isCreating === 'planet' ? 'creating' : ''}`}
            onClick={() => handleCreateBody('planet')}
            disabled={bodies.length >= maxBodies}
          >
            <Circle size={18} />
            <span>创建行星</span>
          </button>
        </div>
        <p className="body-count">
          天体数量: {bodies.length} / {maxBodies}
          {bodies.length >= maxBodies && (
            <span className="warning">已达上限</span>
          )}
        </p>
      </div>

      <div className="section">
        <h3 className="section-title">
          <Gauge size={14} />
          模拟速度
        </h3>
        <div className="speed-control">
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="speed-slider"
          />
          <div className="speed-value">{speed.toFixed(1)}x</div>
        </div>
        <div className="speed-labels">
          <span>0.1x</span>
          <span>1.0x</span>
          <span>3.0x</span>
        </div>
      </div>

      <div className="section">
        <button
          className="clear-btn"
          onClick={clearBodies}
          disabled={bodies.length === 0}
        >
          <Trash2 size={16} />
          <span>清除所有天体</span>
        </button>
      </div>

      <div className="section tips">
        <h3 className="section-title">操作提示</h3>
        <ul>
          <li>点击画布空白处创建天体</li>
          <li>拖动鼠标可调整初始速度方向</li>
          <li>点击天体可选中并拖拽</li>
          <li>拖动选中天体可调整速度矢量</li>
        </ul>
      </div>

      <style>{`
        .control-panel {
          width: 260px;
          padding: 16px;
          background: rgba(26, 26, 46, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 16px;
          color: #E0E0FF;
          font-family: 'Segoe UI', system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          user-select: none;
        }

        .control-panel::-webkit-scrollbar {
          width: 6px;
        }

        .control-panel::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .control-panel::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 170, 0.3);
          border-radius: 3px;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0, 255, 170, 0.2);
        }

        .panel-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          background: linear-gradient(135deg, #00FFAA, #44AAFF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .text-accent {
          color: #00FFAA;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #E0E0FF;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.9;
        }

        .mode-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }

        .mode-btn {
          padding: 8px 6px;
          font-size: 11px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #E0E0FF;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .mode-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 12px rgba(0, 255, 170, 0.4);
          border-color: #00FFAA;
        }

        .mode-btn:active {
          transform: scale(0.95);
          transition: transform 0.1s ease;
        }

        .mode-btn.active {
          background: rgba(0, 255, 170, 0.2);
          border-color: #00FFAA;
          color: #00FFAA;
          box-shadow: 0 0 8px rgba(0, 255, 170, 0.3);
        }

        .mode-description {
          font-size: 11px;
          color: rgba(224, 224, 255, 0.6);
          margin: 0;
          line-height: 1.4;
        }

        .demo-section {
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .demo-section.hide {
          max-height: 0;
          opacity: 0;
          margin: 0;
          padding: 0;
        }

        .demo-section.show {
          max-height: 200px;
          opacity: 1;
        }

        .demo-buttons {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .demo-btn {
          padding: 10px 12px;
          font-size: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #E0E0FF;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          font-weight: 500;
        }

        .demo-btn:hover {
          transform: scale(1.02);
          background: rgba(0, 255, 170, 0.1);
          border-color: #00FFAA;
          box-shadow: 0 0 12px rgba(0, 255, 170, 0.3);
        }

        .demo-btn:active {
          transform: scale(0.98);
        }

        .create-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .create-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: white;
        }

        .create-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 0 16px rgba(0, 255, 170, 0.5);
        }

        .create-btn:active:not(:disabled) {
          transform: scale(0.95);
          transition: transform 0.1s ease;
        }

        .create-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .create-btn.creating {
          animation: pulse 0.3s ease;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.95); }
        }

        .star-btn {
          background: linear-gradient(135deg, #FF8800, #FF5500);
          box-shadow: 0 4px 12px rgba(255, 136, 0, 0.3);
        }

        .star-btn:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(255, 136, 0, 0.5);
        }

        .planet-btn {
          background: linear-gradient(135deg, #44AAFF, #4466FF);
          box-shadow: 0 4px 12px rgba(68, 170, 255, 0.3);
        }

        .planet-btn:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(68, 170, 255, 0.5);
        }

        .body-count {
          font-size: 12px;
          color: rgba(224, 224, 255, 0.7);
          margin: 0;
          text-align: center;
        }

        .warning {
          color: #FF6666;
          margin-left: 6px;
          font-weight: 600;
        }

        .speed-control {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .speed-slider {
          flex: 1;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }

        .speed-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #00FFAA, #00CC88);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(0, 255, 170, 0.5);
          transition: all 0.2s ease;
        }

        .speed-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 16px rgba(0, 255, 170, 0.7);
        }

        .speed-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #00FFAA, #00CC88);
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 8px rgba(0, 255, 170, 0.5);
        }

        .speed-value {
          min-width: 45px;
          padding: 4px 8px;
          background: rgba(0, 255, 170, 0.15);
          border: 1px solid rgba(0, 255, 170, 0.3);
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #00FFAA;
          text-align: center;
        }

        .speed-labels {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: rgba(224, 224, 255, 0.4);
          padding: 0 2px;
        }

        .clear-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 600;
          background: rgba(255, 100, 100, 0.15);
          border: 1px solid rgba(255, 100, 100, 0.3);
          border-radius: 10px;
          color: #FF8888;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clear-btn:hover:not(:disabled) {
          background: rgba(255, 100, 100, 0.25);
          transform: scale(1.02);
          box-shadow: 0 0 12px rgba(255, 100, 100, 0.3);
        }

        .clear-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .clear-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .tips {
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tips ul {
          margin: 0;
          padding-left: 18px;
          font-size: 11px;
          color: rgba(224, 224, 255, 0.5);
          line-height: 1.8;
        }

        .tips li {
          margin-bottom: 2px;
        }

        @media (max-width: 768px) {
          .control-panel {
            width: 100%;
            max-height: 300px;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 12px;
          }

          .panel-header {
            width: 100%;
          }

          .section {
            flex: 1;
            min-width: 200px;
          }

          .tips {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
