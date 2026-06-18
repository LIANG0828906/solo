import { useParticleStore } from './particleStore';

export default function UIOverlay() {
  const {
    maxParticles,
    colorOffset,
    rotationSpeed,
    setMaxParticles,
    setColorOffset,
    setRotationSpeed,
    reset,
  } = useParticleStore();

  return (
    <>
      <div className="control-panel">
        <div className="title">星云调色盘</div>

        <div className="slider-group">
          <div className="slider-label">
            <span>粒子密度</span>
            <span className="slider-value">{maxParticles}</span>
          </div>
          <input
            type="range"
            min={1000}
            max={5000}
            step={100}
            value={maxParticles}
            onChange={(e) => setMaxParticles(Number(e.target.value))}
          />
        </div>

        <div className="slider-group">
          <div className="slider-label">
            <span>颜色偏移</span>
            <span className="slider-value">{colorOffset}°</span>
          </div>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={colorOffset}
            onChange={(e) => setColorOffset(Number(e.target.value))}
          />
        </div>

        <div className="slider-group">
          <div className="slider-label">
            <span>旋转速度</span>
            <span className="slider-value">{rotationSpeed.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.01}
            value={rotationSpeed}
            onChange={(e) => setRotationSpeed(Number(e.target.value))}
          />
        </div>

        <button className="reset-btn" onClick={reset}>
          重置星云
        </button>
      </div>

      <div className="hint">点击画布并拖拽鼠标绘制星云 ✨</div>
    </>
  );
}
