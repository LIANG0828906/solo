import React, { useCallback, useRef } from 'react';
import useStore, { ArtParams, computeHash } from './store';

interface SliderConfig {
  key: keyof ArtParams;
  label: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderConfig[] = [
  { key: 'lineDensity', label: '线条密度', min: 5, max: 50, step: 1 },
  { key: 'shapeComplexity', label: '形状复杂度', min: 1, max: 10, step: 1 },
  { key: 'hueShift', label: '色相偏移', min: 0, max: 360, step: 1 },
  { key: 'opacity', label: '透明度', min: 0.1, max: 1.0, step: 0.01 },
];

const ControlPanel: React.FC = () => {
  const params = useStore((s) => s.params);
  const setParams = useStore((s) => s.setParams);
  const favorites = useStore((s) => s.favorites);
  const addFavorite = useStore((s) => s.addFavorite);
  const removeFavorite = useStore((s) => s.removeFavorite);
  const panelCollapsed = useStore((s) => s.panelCollapsed);
  const togglePanel = useStore((s) => s.togglePanel);

  const [favOpen, setFavOpen] = React.useState(false);
  const thumbnailRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const handleSlider = useCallback(
    (key: keyof ArtParams, value: number) => {
      setParams({ [key]: value });
    },
    [setParams]
  );

  const handleColor = useCallback(
    (key: keyof ArtParams, value: string) => {
      setParams({ [key]: value });
    },
    [setParams]
  );

  const handleFavorite = useCallback(() => {
    const hash = computeHash(params);
    const item = {
      id: crypto.randomUUID?.() ?? Date.now().toString(),
      params: { ...params },
      hash,
      thumbnailDataUrl: '',
      createdAt: Date.now(),
    };
    addFavorite(item);
  }, [params, addFavorite]);

  const handleLoadFavorite = useCallback(
    (favParams: ArtParams) => {
      setParams(favParams);
    },
    [setParams]
  );

  return (
    <div className={`control-panel ${panelCollapsed ? 'collapsed' : ''}`}>
      <div className="panel-header">
        <h2>🎨 控制面板</h2>
        <button className="collapse-toggle" onClick={togglePanel}>
          {panelCollapsed ? '展开 ▾' : '收起 ▴'}
        </button>
      </div>

      {SLIDERS.map((slider) => (
        <div className="control-group" key={slider.key}>
          <label>
            {slider.label}
            <span className="value-display">
              {slider.key === 'opacity'
                ? params[slider.key].toFixed(2)
                : params[slider.key]}
            </span>
          </label>
          <input
            type="range"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={params[slider.key] as number}
            onChange={(e) =>
              handleSlider(slider.key, parseFloat(e.target.value))
            }
          />
        </div>
      ))}

      <div className="control-group">
        <label>背景色</label>
        <div className="color-picker-group">
          <div
            className="color-swatch"
            style={{ backgroundColor: params.bgColor }}
          >
            <input
              type="color"
              value={params.bgColor}
              onChange={(e) => handleColor('bgColor', e.target.value)}
            />
          </div>
          <span className="color-hex">{params.bgColor}</span>
        </div>
      </div>

      <div className="control-group">
        <label>主色调</label>
        <div className="color-picker-group">
          <div
            className="color-swatch"
            style={{ backgroundColor: params.primaryColor }}
          >
            <input
              type="color"
              value={params.primaryColor}
              onChange={(e) => handleColor('primaryColor', e.target.value)}
            />
          </div>
          <span className="color-hex">{params.primaryColor}</span>
        </div>
      </div>

      <div className="favorites-section">
        <button className="favorites-toggle" onClick={() => setFavOpen(!favOpen)}>
          <span className="arrow" style={{ transform: favOpen ? 'rotate(180deg)' : 'none' }}>
            {favOpen ? '▾' : '▸'}
          </span>
          收藏列表 ({favorites.length})
        </button>
        {favOpen && (
          <div className="favorites-list">
            {favorites.length === 0 && (
              <div style={{ color: '#666', fontSize: 12, padding: '8px 0' }}>
                暂无收藏
              </div>
            )}
            {favorites.map((fav) => (
              <div
                className="favorite-item"
                key={fav.id}
                onClick={() => handleLoadFavorite(fav.params)}
                style={{ cursor: 'pointer' }}
              >
                <canvas
                  ref={(el) => {
                    if (el) {
                      thumbnailRefs.current.set(fav.id, el);
                    }
                  }}
                  width={48}
                  height={36}
                  style={{ width: 48, height: 36 }}
                />
                <div className="fav-info">
                  <div className="fav-hash">#{fav.hash}</div>
                  <div className="fav-params">
                    密度:{fav.params.lineDensity} 复杂度:{fav.params.shapeComplexity}
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(fav.id);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
