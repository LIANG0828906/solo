import { useEffect, useRef } from 'react';
import { ThreeRenderer, SelectedPathInfo, ThemeType } from '../modules/ThreeRenderer';
import { PathPoint } from '../modules/SampleApi';

interface ThreeCanvasProps {
  paths: PathPoint[][];
  originalImage: HTMLCanvasElement | null;
  theme: ThemeType;
  onPathClick: (info: SelectedPathInfo) => void;
  rendererRef: React.MutableRefObject<ThreeRenderer | null>;
}

export function ThreeCanvas({
  paths,
  originalImage,
  theme,
  onPathClick,
  rendererRef
}: ThreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const renderer = new ThreeRenderer({
      container: containerRef.current,
      onPathClick
    });
    
    rendererRef.current = renderer;
    
    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [onPathClick, rendererRef]);
  
  useEffect(() => {
    if (rendererRef.current && paths.length > 0) {
      rendererRef.current.renderSketch(paths, originalImage || undefined);
    }
  }, [paths, originalImage, rendererRef]);
  
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setTheme(theme);
    }
  }, [theme, rendererRef]);
  
  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
