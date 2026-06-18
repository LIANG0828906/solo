import React, { useState } from 'react';
import { ColorPicker } from './components/ColorPicker';
import { GradientPreview } from './components/GradientPreview';
import { ExportModal } from './components/ExportModal';
import { useGradientStore, GradientType, RadialShape } from './store/gradientStore';

const App: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const {
    startColor,
    endColor,
    gradientType,
    angle,
    radius,
    radialShape,
    aspectRatio,
    setStartColor,
    setEndColor,
    setGradientType,
    setAngle,
    setRadius,
    setRadialShape,
    setAspectRatio,
  } = useGradientStore();

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">🎨 PalettePilot</h1>
        <p className="app-subtitle">渐变色彩生成与CSS工具</p>
        <button className="export-btn" onClick={() => setShowModal(true)}>
          导出CSS
        </button>
      </header>

      <main className="app-main">
        <section className="top-section">
          <div className="pickers-container">
            <ColorPicker label="起点颜色" color={startColor} onChange={setStartColor} />
            <div className="picker-divider" />
            <ColorPicker label="终点颜色" color={endColor} onChange={setEndColor} />
          </div>

          <div className="gradient-controls card">
            <h3 className="section-title">渐变设置</h3>
            
            <div className="control-row">
              <span className="control-label">渐变类型</span>
              <div className="type-toggle-group">
                <button
                  className={`type-toggle-btn ${gradientType === 'linear' ? 'active' : ''}`}
                  onClick={() => setGradientType('linear' as GradientType)}
                >
                  线性
                </button>
                <button
                  className={`type-toggle-btn ${gradientType === 'radial' ? 'active' : ''}`}
                  onClick={() => setGradientType('radial' as GradientType)}
                >
                  径向
                </button>
              </div>
            </div>

            {gradientType === 'linear' ? (
              <div className="control-row">
                <span className="control-label">角度</span>
                <div className="slider-control">
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={angle}
                    onChange={(e) => setAngle(Number(e.target.value))}
                    className="range-slider"
                  />
                  <span className="slider-value">{angle}°</span>
                </div>
              </div>
            ) : (
              <>
                <div className="control-row">
                  <span className="control-label">形状</span>
                  <div className="type-toggle-group">
                    <button
                      className={`type-toggle-btn ${radialShape === 'circle' ? 'active' : ''}`}
                      onClick={() => setRadialShape('circle' as RadialShape)}
                    >
                      圆形
                    </button>
                    <button
                      className={`type-toggle-btn ${radialShape === 'ellipse' ? 'active' : ''}`}
                      onClick={() => setRadialShape('ellipse' as RadialShape)}
                    >
                      椭圆
                    </button>
                  </div>
                </div>
                <div className="control-row">
                  <span className="control-label">半径</span>
                  <div className="slider-control">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className="range-slider"
                    />
                    <span className="slider-value">{radius}%</span>
                  </div>
                </div>
                {radialShape === 'ellipse' && (
                  <div className="control-row">
                    <span className="control-label">宽高比</span>
                    <div className="slider-control">
                      <input
                        type="range"
                        min={0.1}
                        max={2}
                        step={0.1}
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(Number(e.target.value))}
                        className="range-slider"
                      />
                      <span className="slider-value">{aspectRatio.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="bottom-section">
          <div className="card preview-card">
            <GradientPreview />
          </div>
        </section>
      </main>

      <ExportModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};

export default App;
