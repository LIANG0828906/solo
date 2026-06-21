import { useState, useRef, useEffect } from 'react';
import { CelestialBodyData } from './CelestialBody';

interface UIControlPanelProps {
  bodies: CelestialBodyData[];
  selectedBodyId: string | null;
  onAddBody: (body: Omit<CelestialBodyData, 'id'>) => void;
  onSelectBody: (id: string | null) => void;
  onDeleteBody: (id: string) => void;
  onUpdateBody: (id: string, updates: Partial<CelestialBodyData>) => void;
  onSwitchView: (view: 'top' | 'side' | 'front') => void;
  isMobile: boolean;
}

const PRESET_COLORS = [
  '#6c63ff',
  '#ff6b9d',
  '#4ecdc4',
  '#ffdd44',
  '#ff8c42',
  '#a8e6cf',
  '#8b7dff',
  '#ff6b6b'
];

export function UIControlPanel({
  bodies,
  selectedBodyId,
  onAddBody,
  onSelectBody,
  onDeleteBody,
  onUpdateBody,
  onSwitchView,
  isMobile
}: UIControlPanelProps) {
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newBodyType, setNewBodyType] = useState<'star' | 'planet'>('planet');
  const [newBodyMass, setNewBodyMass] = useState(10);
  const [newBodyColor, setNewBodyColor] = useState('#6c63ff');
  const [newBodyDistance, setNewBodyDistance] = useState(50);
  const [newBodySpeed, setNewBodySpeed] = useState(2.5);
  const [massDisplay, setMassDisplay] = useState(10);
  const [isFlipping, setIsFlipping] = useState(false);
  const flipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const planetCount = bodies.filter(b => b.type === 'planet').length;
  const starCount = bodies.filter(b => b.type === 'star').length;

  const handleMassChange = (value: number) => {
    setNewBodyMass(value);
    setIsFlipping(true);
    if (flipTimeoutRef.current) {
      clearTimeout(flipTimeoutRef.current);
    }
    flipTimeoutRef.current = setTimeout(() => {
      setMassDisplay(value);
      setIsFlipping(false);
    }, 150);
  };

  const handleCreateBody = () => {
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * newBodyDistance;
    const z = Math.sin(angle) * newBodyDistance;
    
    const vx = -Math.sin(angle) * newBodySpeed;
    const vz = Math.cos(angle) * newBodySpeed;

    const newBody: Omit<CelestialBodyData, 'id'> = {
      type: newBodyType,
      mass: newBodyMass,
      position: { x, y: 0, z },
      velocity: { x: vx, y: 0, z: vz },
      color: newBodyColor,
      name: newBodyType === 'star' ? `主星${starCount + 1}` : `行星${planetCount + 1}`
    };

    onAddBody(newBody);
    setIsFormExpanded(false);
  };

  const panelContent = (
    <div className="panel-content">
      <div className="panel-header">
        <h2>🌌 星体控制台</h2>
      </div>

      <div className="view-controls">
        <span className="view-label">视角切换</span>
        <div className="view-buttons">
          <button onClick={() => onSwitchView('top')} className="view-btn">俯视</button>
          <button onClick={() => onSwitchView('side')} className="view-btn">侧视</button>
          <button onClick={() => onSwitchView('front')} className="view-btn">正视</button>
        </div>
      </div>

      <button
        className={`add-btn ${isFormExpanded ? 'expanded' : ''}`}
        onClick={() => setIsFormExpanded(!isFormExpanded)}
      >
        {isFormExpanded ? '− 收起表单' : '+ 创建新天体'}
      </button>

      <div className={`create-form ${isFormExpanded ? 'expanded' : ''}`}>
        <div className="form-group">
          <label>类型</label>
          <div className="type-toggle">
            <button
              className={`type-btn ${newBodyType === 'star' ? 'active' : ''}`}
              onClick={() => setNewBodyType('star')}
            >
              ☀️ 主星
            </button>
            <button
              className={`type-btn ${newBodyType === 'planet' ? 'active' : ''}`}
              onClick={() => setNewBodyType('planet')}
            >
              🪐 行星
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>
            质量: 
            <span className={`mass-value ${isFlipping ? 'flip' : ''}`}>
              {massDisplay}
            </span>
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={newBodyMass}
            onChange={(e) => handleMassChange(Number(e.target.value))}
            className="slider"
          />
        </div>

        <div className="form-group">
          <label>轨道距离: {newBodyDistance}</label>
          <input
            type="range"
            min="20"
            max="150"
            value={newBodyDistance}
            onChange={(e) => setNewBodyDistance(Number(e.target.value))}
            className="slider"
          />
        </div>

        <div className="form-group">
          <label>初始速度: {newBodySpeed.toFixed(1)}</label>
          <input
            type="range"
            min="0.5"
            max="8"
            step="0.1"
            value={newBodySpeed}
            onChange={(e) => setNewBodySpeed(Number(e.target.value))}
            className="slider"
          />
        </div>

        <div className="form-group">
          <label>颜色</label>
          <div className="color-palette">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                className={`color-swatch ${newBodyColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setNewBodyColor(color)}
              />
            ))}
          </div>
        </div>

        <button className="submit-btn" onClick={handleCreateBody}>
          创建天体
        </button>
      </div>

      <div className="body-list-section">
        <h3>天体列表</h3>
        <div className="body-list">
          {bodies.map(body => (
            <div
              key={body.id}
              className={`body-item ${selectedBodyId === body.id ? 'selected' : ''}`}
              onClick={() => onSelectBody(body.id)}
            >
              <div
                className="body-dot"
                style={{ backgroundColor: body.color, boxShadow: `0 0 8px ${body.color}` }}
              />
              <span className="body-name">{body.name}</span>
              <span className="body-type">{body.type === 'star' ? '主星' : '行星'}</span>
              {body.type === 'planet' && (
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBody(body.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <button
          className={`mobile-toggle ${isDrawerOpen ? 'open' : ''}`}
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        >
          {isDrawerOpen ? '↓' : '控制面板'}
        </button>
        <div className={`mobile-drawer ${isDrawerOpen ? 'open' : ''}`}>
          {panelContent}
        </div>
        <style>{mobileStyles}</style>
      </>
    );
  }

  return (
    <>
      <div className="control-panel">
        {panelContent}
      </div>
      <style>{desktopStyles}</style>
    </>
  );
}

const desktopStyles = `
.control-panel {
  position: fixed;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 280px;
  background: rgba(20, 20, 60, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(108, 99, 255, 0.3);
  padding: 20px;
  color: white;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-height: 85vh;
  overflow-y: auto;
}

.control-panel::-webkit-scrollbar {
  width: 6px;
}

.control-panel::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.control-panel::-webkit-scrollbar-thumb {
  background: rgba(108, 99, 255, 0.5);
  border-radius: 3px;
}

.panel-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #6c63ff, #8b7dff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.view-controls {
  margin-bottom: 16px;
}

.view-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
  display: block;
}

.view-buttons {
  display: flex;
  gap: 8px;
}

.view-btn {
  flex: 1;
  padding: 8px 12px;
  background: rgba(108, 99, 255, 0.2);
  border: 1px solid rgba(108, 99, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn:hover {
  background: rgba(108, 99, 255, 0.4);
  box-shadow: 0 0 12px rgba(108, 99, 255, 0.3);
}

.view-btn:active {
  transform: scale(0.95);
}

.add-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #6c63ff, #8b7dff);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(108, 99, 255, 0.4);
}

.add-btn:active {
  transform: translateY(0);
}

.add-btn.expanded {
  background: rgba(108, 99, 255, 0.3);
  border: 1px solid rgba(108, 99, 255, 0.5);
}

.create-form {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s ease, opacity 0.3s ease;
  opacity: 0;
}

.create-form.expanded {
  max-height: 600px;
  opacity: 1;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mass-value {
  display: inline-block;
  font-weight: 600;
  color: #8b7dff;
  min-width: 30px;
  transition: transform 0.15s ease;
}

.mass-value.flip {
  transform: rotateX(90deg);
}

.type-toggle {
  display: flex;
  gap: 8px;
}

.type-btn {
  flex: 1;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-btn.active {
  background: rgba(108, 99, 255, 0.3);
  border-color: #6c63ff;
  color: white;
}

.type-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.1);
}

.slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #6c63ff, #8b7dff);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(108, 99, 255, 0.5);
  transition: transform 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.color-palette {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-swatch:hover {
  transform: scale(1.1);
}

.color-swatch.selected {
  border-color: white;
  box-shadow: 0 0 12px currentColor;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(78, 205, 196, 0.4);
}

.submit-btn:active {
  transform: translateY(0);
}

.body-list-section {
  margin-top: 16px;
}

.body-list-section h3 {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 10px;
}

.body-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.body-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.body-item:hover {
  background: rgba(108, 99, 255, 0.1);
  border-color: rgba(108, 99, 255, 0.3);
}

.body-item.selected {
  background: rgba(108, 99, 255, 0.2);
  border-color: #6c63ff;
}

.body-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.body-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
}

.body-type {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.delete-btn {
  width: 22px;
  height: 22px;
  border: none;
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: rgba(255, 107, 107, 0.4);
  transform: scale(1.1);
}
`;

const mobileStyles = `
.mobile-toggle {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: linear-gradient(135deg, #6c63ff, #8b7dff);
  border: none;
  border-radius: 30px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  z-index: 101;
  box-shadow: 0 4px 20px rgba(108, 99, 255, 0.4);
  transition: all 0.3s ease;
}

.mobile-toggle.open {
  bottom: calc(50vh + 20px);
}

.mobile-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 50vh;
  background: rgba(20, 20, 60, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px 20px 0 0;
  border: 1px solid rgba(108, 99, 255, 0.3);
  padding: 20px;
  color: white;
  z-index: 100;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  overflow-y: auto;
}

.mobile-drawer.open {
  transform: translateY(0);
}

.panel-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #6c63ff, #8b7dff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.view-controls {
  margin-bottom: 16px;
}

.view-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
  display: block;
}

.view-buttons {
  display: flex;
  gap: 8px;
}

.view-btn {
  flex: 1;
  padding: 8px 12px;
  background: rgba(108, 99, 255, 0.2);
  border: 1px solid rgba(108, 99, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn:hover {
  background: rgba(108, 99, 255, 0.4);
}

.add-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #6c63ff, #8b7dff);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.create-form {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s ease, opacity 0.3s ease;
  opacity: 0;
}

.create-form.expanded {
  max-height: 600px;
  opacity: 1;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mass-value {
  display: inline-block;
  font-weight: 600;
  color: #8b7dff;
  min-width: 30px;
  transition: transform 0.15s ease;
}

.mass-value.flip {
  transform: rotateX(90deg);
}

.type-toggle {
  display: flex;
  gap: 8px;
}

.type-btn {
  flex: 1;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-btn.active {
  background: rgba(108, 99, 255, 0.3);
  border-color: #6c63ff;
  color: white;
}

.slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #6c63ff, #8b7dff);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(108, 99, 255, 0.5);
}

.color-palette {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-swatch.selected {
  border-color: white;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.body-list-section {
  margin-top: 16px;
}

.body-list-section h3 {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 10px;
}

.body-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.body-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.body-item.selected {
  background: rgba(108, 99, 255, 0.2);
  border-color: #6c63ff;
}

.body-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.body-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
}

.body-type {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.delete-btn {
  width: 22px;
  height: 22px;
  border: none;
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
`;
