import { useSceneStore } from '../store/sceneStore';
import { Sun, Lightbulb } from 'lucide-react';

interface LightControlPanelProps {
  collapsed: boolean;
}

export function LightControlPanel({ collapsed }: LightControlPanelProps) {
  const lighting = useSceneStore((state) => state.lighting);
  const setAmbientIntensity = useSceneStore((state) => state.setAmbientIntensity);
  const updatePointLight = useSceneStore((state) => state.updatePointLight);

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
          />
          <span className="slider-value">{lighting.ambientIntensity.toFixed(1)}</span>
        </div>
      </div>

      {lighting.pointLights.map((light, index) => (
        <div key={light.id} className="light-section">
          <div className="light-section-header">
            <div
              className="light-color-dot"
              style={{ backgroundColor: light.color }}
            />
            <span>点光源 {index + 1}</span>
          </div>

          <div className="slider-row small">
            <label>颜色</label>
            <input
              type="color"
              value={light.color}
              onChange={(e) => updatePointLight(light.id, { color: e.target.value })}
              className="color-picker"
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
              onChange={(e) => updatePointLight(light.id, { intensity: parseFloat(e.target.value) })}
              className="slider"
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
      ))}
    </div>
  );
}
