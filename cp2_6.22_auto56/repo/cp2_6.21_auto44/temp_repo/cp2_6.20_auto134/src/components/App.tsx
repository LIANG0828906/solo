import { useEffect } from 'react';
import GeometryPanel from '@/components/GeometryPanel';
import PropertyPanel from '@/components/PropertyPanel';
import SceneCanvas from '@/components/SceneCanvas';
import { useEditorStore } from '@/store/editorStore';

const App = () => {
  const setTransformMode = useEditorStore((s) => s.setTransformMode);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 't' || e.key === 'T') {
        setTransformMode('translate');
      } else if (e.key === 'r' || e.key === 'R') {
        setTransformMode('rotate');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTransformMode]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
      }}
    >
      <GeometryPanel />
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <SceneCanvas />
      </div>
      <PropertyPanel />
    </div>
  );
};

export default App;
