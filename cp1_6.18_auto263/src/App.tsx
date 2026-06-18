import { useRef } from 'react';
import Canvas from './Canvas';
import ControlPanel from './ControlPanel';

export default function App() {
  const thumbnailRef = useRef<(() => string) | null>(null);

  const getThumbnail = () => {
    return thumbnailRef.current ? thumbnailRef.current() : '';
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🛠 皮具定制工坊</h1>
        <p>打造专属于你的手工皮具</p>
      </header>
      <div className="app-body">
        <div className="canvas-section">
          <div className="canvas-wrapper">
            <Canvas onThumbnailRef={thumbnailRef} />
          </div>
          <div className="canvas-hint">提示：拖拽皮带右端圆圈调整长度，拖拽刻字文字调整位置</div>
        </div>
        <div className="panel-section">
          <ControlPanel getThumbnail={getThumbnail} />
        </div>
      </div>
    </div>
  );
}
