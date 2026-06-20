import { useSceneStore } from '../store/sceneStore';
import { Sun, Lightbulb, Power, PowerOff } from 'lucide-react';

interface LightControlPanelProps {
  collapsed: boolean;
}

export function LightControlPanel({ collapsed }: LightControlPanelProps) {
  const lighting = useSceneStore((state) => state.lighting);
  const setAmbientIntensity = useSceneStore((state) => state.setAmbientIntensity);
  const updatePointLight = useSceneStore((state) => state.updatePointLight);
  const toggleLight = useSceneStore((state) => state.toggleLight);
  const setPointLightIntensity = useSceneStore((state) => state.setPointLightIntensity);

  if (collapsed) {
    return (
      <div className="light-control-panel collapsed">
        <div className="panel-icon">
          <Sun size={20} />
        </div>
      </div>
    );
  }

  return (
    <div className="light-control-panel">
      <h3 className="panel-title">
        <Sun size={18} />
        <span>灯光设置</span>
      </h3>

      <div className="light-section">
        <div className="light-section-header">
          <Lightbulb size={16} />
          <span>环境光</span>
          <button
            className={`toggle-button ${lighting.ambientEnabled ? 'on' : 'off'}`}
            onClick={() => toggleLight('ambient')}
            title={lighting.ambientEnabled ? '关闭' : '开启'}
          >
            {lighting.ambientEnabled ? <Power size={14} /> : <PowerOff size={14} />}
          </button>
        </div>
        <div className="slider-row small">
          <label>强度</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={lighting.ambientIntensity}
            onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
            className="slider"
            disabled={!lighting.ambientEnabled}
          />
          <span className="slider-value">{lighting.ambientIntensity.toFixed(1)}</span>
        </div>
      </div>

      {lighting.pointLights.map((light, index) => {
        const isEnabled = lighting.pointLightsEnabled[light.id] !== false;
        return (
          <div key={light.id} className="light-section">
            <div className="light-section-header">
              <div
                className="light-color-dot"
                style={{ backgroundColor: light.color, opacity: isEnabled ? 1 : 0.3 }}
              />
              <span style={{ opacity: isEnabled ? 1 : 0.5 }}>点光源 {index + 1}</span>
              <button
                className={`toggle-button ${isEnabled ? 'on' : 'off'}`}
                onClick={() => toggleLight(light.id)}
                title={isEnabled ? '关闭' : '开启'}
              >
                {isEnabled ? <Power size={14} /> : <PowerOff size={14} />}
              </button>
            </div>

            <div className="slider-row small">
              <label>颜色</label>
              <input
                type="color"
                value={light.color}
                onChange={(e) => updatePointLight(light.id, { color: e.target.value })}
                className="color-picker"
                disabled={!isEnabled}
              />
            </div>

            <div className="slider-row small">
              <label>强度</label>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={light.intensity}
                onChange={(e) => setPointLightIntensity(light.id, parseFloat(e.target.value))}
                className="slider"
                disabled={!isEnabled}
              />
              <span className="slider-value">{light.intensity.toFixed(1)}</span>
            </div>

            <div className="light-position">
              <span className="pos-label">
                X: {light.position.x.toFixed(1)} Y: {light.position.y.toFixed(1)} Z: {light.position.z.toFixed(1)}
              </span>
              <span className="pos-hint">在场景中拖拽移动</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
