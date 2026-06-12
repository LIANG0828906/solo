import { useEffect, useRef } from 'react';
import { GravityScene } from './scene/GravityScene';
import InfoPanel from './ui/InfoPanel';
import { EventBus } from './bus/EventBus';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GravityScene | null>(null);
  const busRef = useRef<EventBus>(new EventBus());

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new GravityScene(containerRef.current, busRef.current);
    sceneRef.current = scene;

    return () => {
      scene.dispose();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <InfoPanel bus={busRef.current} />
    </div>
  );
}
