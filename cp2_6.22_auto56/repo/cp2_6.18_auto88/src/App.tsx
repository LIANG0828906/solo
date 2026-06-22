import React, { useState, useRef } from 'react';
import Canvas from './Canvas';
import CardCreator from './CardCreator';
import ExportTools from './ExportTools';

export default function App() {
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const getDefaultPosition = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const scrollLeft = canvasRef.current?.scrollLeft || 0;
    const scrollTop = canvasRef.current?.scrollTop || 0;

    const x = (rect ? rect.width / 2 + scrollLeft : 800);
    const y = 80 + scrollTop;

    return { x, y };
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ExportTools
        canvasRef={canvasRef}
        onAddCard={() => setIsCreatorOpen(true)}
      />
      <Canvas canvasRef={canvasRef} />
      <CardCreator
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        defaultPosition={getDefaultPosition()}
      />
    </div>
  );
}
