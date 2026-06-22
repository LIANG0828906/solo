import React, { useEffect, useRef } from 'react';
import { initScene } from './scene';
import Controls from './controls';
import { useParticleStore } from './store';
import { formatCoord } from './utils';

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ReturnType<typeof initScene> | null>(null);

  const {
    morphology,
    turbulence,
    colorTemp,
    clickedParticle,
    setFps,
    setClickedParticle,
  } = useParticleStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = initScene(
      containerRef.current,
      () => useParticleStore.getState().morphology,
      () => useParticleStore.getState().turbulence,
      () => useParticleStore.getState().colorTemp,
      (fps) => setFps(fps),
      (data) => setClickedParticle(data)
    );

    sceneRef.current = scene;
    scene.animate();

    const canvas = containerRef.current.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('mousemove', scene.handleMouseMove);
      canvas.addEventListener('click', scene.handleClick);
      canvas.addEventListener('mousedown', scene.handleMouseDown);
      canvas.addEventListener('mouseup', scene.handleMouseUp);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', scene.handleMouseMove);
        canvas.removeEventListener('click', scene.handleClick);
        canvas.removeEventListener('mousedown', scene.handleMouseDown);
        canvas.removeEventListener('mouseup', scene.handleMouseUp);
      }
      scene.dispose();
    };
  }, [setFps, setClickedParticle]);

  const getMorphologyLabel = () => {
    if (morphology < 0.33) return '球状 Sphere';
    if (morphology < 0.66) return '螺旋状 Spiral';
    return '环状 Ring';
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />

      <Controls />

      {clickedParticle && (
        <div
          style={{
            position: 'fixed',
            left: clickedParticle.screenX + 15,
            top: clickedParticle.screenY + 15,
            width: '200px',
            height: '100px',
            backgroundColor: '#1F2833',
            borderRadius: '8px',
            border: '1px solid #FFFFFF',
            padding: '12px',
            color: 'white',
            fontFamily: 'monospace, sans-serif',
            fontSize: '11px',
            zIndex: 200,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ color: '#66FF66', marginBottom: '6px', fontSize: '10px', letterSpacing: '0.5px' }}>
            粒子光谱数据
          </div>
          <div style={{ lineHeight: '1.6' }}>
            <div>
              X: {formatCoord(clickedParticle.x)} Y: {formatCoord(clickedParticle.y)} Z: {formatCoord(clickedParticle.z)}
            </div>
            <div>
              RGB: ({Math.round(clickedParticle.r * 255)}, {Math.round(clickedParticle.g * 255)}, {Math.round(clickedParticle.b * 255)})
            </div>
            <div>
              半径 Radius: {formatCoord(clickedParticle.radius)}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          color: '#66FF66',
          fontFamily: 'monospace, sans-serif',
          fontSize: '11px',
          letterSpacing: '0.5px',
          opacity: 0.7,
          zIndex: 100,
        }}
      >
        <div>拖拽旋转 | 滚轮缩放 | 点击粒子查看数据</div>
        <div style={{ marginTop: '4px', color: '#C5C6C7' }}>
          当前形态: {getMorphologyLabel()}
        </div>
      </div>
    </div>
  );
};

export default App;
