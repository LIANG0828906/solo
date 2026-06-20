import { useEffect, useRef } from 'react';
import { CanvasEngine } from '../renderer/canvasEngine';
import { useAppStore } from '../store/appStore';

export function StarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);

  const ideas = useAppStore(state => state.ideas);
  const clusters = useAppStore(state => state.clusters);
  const selectedClusterId = useAppStore(state => state.selectedClusterId);
  const updateIdeaPosition = useAppStore(state => state.updateIdeaPosition);
  const setCanvasSize = useAppStore(state => state.setCanvasSize);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      canvas.width = width;
      canvas.height = height;
      setCanvasSize(width, height);
      if (engineRef.current) {
        engineRef.current.resize(width, height);
      }
    };

    resize();

    engineRef.current = new CanvasEngine({
      canvas,
      onStarDragEnd: (id, x, y) => {
        updateIdeaPosition(id, x, y);
      },
      getIdeas: () => useAppStore.getState().ideas,
      getClusters: () => useAppStore.getState().clusters,
      getSelectedClusterId: () => useAppStore.getState().selectedClusterId
    });

    engineRef.current.start();

    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateStarTargets();
    }
  }, [ideas]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
      
      {ideas.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
              opacity: 0.6
            }}
          >
            ✨
          </div>
          <h2
            style={{
              color: '#8888AA',
              fontSize: 20,
              margin: 0,
              marginBottom: 8,
              fontWeight: 300
            }}
          >
            你的灵感星群正在等待
          </h2>
          <p
            style={{
              color: '#555577',
              fontSize: 14,
              margin: 0
            }}
          >
            在左侧面板输入灵感，开始创造属于你的星群
          </p>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: '#8888AA',
          fontSize: 12,
          pointerEvents: 'none'
        }}
      >
        <span>灵感总数: {ideas.length}</span>
        <span style={{ opacity: 0.5 }}>|</span>
        <span>星群数量: {clusters.length}</span>
      </div>
    </div>
  );
}
