import React from 'react';
import { usePixelStore } from '../pixelBoard/store';

export const PixelList: React.FC = () => {
  const { pixels } = usePixelStore();

  const sortedPixels = [...pixels].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  return (
    <div className="pixel-list-panel">
      <div className="pixel-list-header">
        <h3>像素列表</h3>
        <span className="pixel-count">{pixels.length} 个像素</span>
      </div>
      <div className="pixel-list-content">
        {sortedPixels.length === 0 ? (
          <div className="pixel-list-empty">暂无像素，点击画布开始绘制</div>
        ) : (
          sortedPixels.map((pixel) => (
            <div key={pixel.id} className="pixel-list-item">
              <div
                className="pixel-list-color"
                style={{ backgroundColor: pixel.color }}
              />
              <span className="pixel-list-coords">
                ({pixel.x}, {pixel.y})
              </span>
              <span className="pixel-list-color-hex">{pixel.color}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
