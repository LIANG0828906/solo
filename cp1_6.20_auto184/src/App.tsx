import { useState, useCallback, useMemo } from 'react';
import PolygonCanvas from './PolygonCanvas';
import Sidebar from './Sidebar';
import type { Vertex, PolygonStyles } from './types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEFAULT_VERTEX_COLOR,
  DEFAULT_STROKE_COLOR,
  VERTEX_RADIUS,
} from './types';
import './App.css';

let vertexIdCounter = 0;

const generateVertexId = (): string => {
  vertexIdCounter += 1;
  return `vertex-${Date.now()}-${vertexIdCounter}`;
};

const createVertex = (x: number, y: number): Vertex => ({
  id: generateVertexId(),
  x,
  y,
  color: DEFAULT_VERTEX_COLOR,
  strokeColor: DEFAULT_STROKE_COLOR,
  scale: 0,
  isDeleting: false,
});

const defaultStyles: PolygonStyles = {
  fillColor: 'rgba(52, 152, 219, 0.2)',
  strokeColor: '#3498db',
  strokeWidth: 2,
  vertexRadius: VERTEX_RADIUS,
  vertexStrokeWidth: 2,
};

export default function App() {
  const [vertices, setVertices] = useState<Vertex[]>([]);
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(null);
  const [styles] = useState<PolygonStyles>(defaultStyles);

  const handleAddVertex = useCallback((x: number, y: number) => {
    setVertices((prev) => [...prev, createVertex(x, y)]);
  }, []);

  const handleAddVertexFromSidebar = useCallback(() => {
    const x = CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 200;
    const y = CANVAS_HEIGHT / 2 + (Math.random() - 0.5) * 200;
    setVertices((prev) => [...prev, createVertex(x, y)]);
  }, []);

  const handleUpdateVertex = useCallback((index: number, x: number, y: number) => {
    setVertices((prev) => {
      const newVertices = [...prev];
      newVertices[index] = { ...newVertices[index], x, y };
      return newVertices;
    });
  }, []);

  const handleDeleteVertex = useCallback((index: number) => {
    setVertices((prev) => {
      const newVertices = [...prev];
      newVertices[index] = { ...newVertices[index], isDeleting: true };
      return newVertices;
    });
  }, []);

  const handleSelectVertex = useCallback((index: number | null) => {
    setSelectedVertexIndex(index);
  }, []);

  const handleUpdateVertexColor = useCallback((index: number, color: string) => {
    setVertices((prev) => {
      const newVertices = [...prev];
      newVertices[index] = { ...newVertices[index], color };
      return newVertices;
    });
  }, []);

  const handleUpdateVertexStrokeColor = useCallback((index: number, strokeColor: string) => {
    setVertices((prev) => {
      const newVertices = [...prev];
      newVertices[index] = { ...newVertices[index], strokeColor };
      return newVertices;
    });
  }, []);

  const handleUpdateVertexPosition = useCallback((index: number, x: number, y: number) => {
    setVertices((prev) => {
      const newVertices = [...prev];
      newVertices[index] = { ...newVertices[index], x, y };
      return newVertices;
    });
  }, []);

  const handleUpdateVertexScale = useCallback((index: number, scale: number) => {
    setVertices((prev) => {
      const newVertices = [...prev];
      newVertices[index] = { ...newVertices[index], scale };
      return newVertices;
    });
  }, []);

  const handleRemoveVertexAfterAnimation = useCallback((index: number) => {
    setVertices((prev) => prev.filter((_, i) => i !== index));
    setSelectedVertexIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      return prev > index ? prev - 1 : prev;
    });
  }, []);

  const canvasProps = useMemo(
    () => ({
      vertices,
      selectedVertexIndex,
      styles,
      onAddVertex: handleAddVertex,
      onUpdateVertex: handleUpdateVertex,
      onDeleteVertex: handleDeleteVertex,
      onSelectVertex: handleSelectVertex,
      onUpdateVertexScale: handleUpdateVertexScale,
      onRemoveVertexAfterAnimation: handleRemoveVertexAfterAnimation,
    }),
    [
      vertices,
      selectedVertexIndex,
      styles,
      handleAddVertex,
      handleUpdateVertex,
      handleDeleteVertex,
      handleSelectVertex,
      handleUpdateVertexScale,
      handleRemoveVertexAfterAnimation,
    ]
  );

  const sidebarProps = useMemo(
    () => ({
      vertices,
      selectedVertexIndex,
      styles,
      onSelectVertex: handleSelectVertex,
      onAddVertex: handleAddVertexFromSidebar,
      onDeleteVertex: handleDeleteVertex,
      onUpdateVertexColor: handleUpdateVertexColor,
      onUpdateVertexStrokeColor: handleUpdateVertexStrokeColor,
      onUpdateVertexPosition: handleUpdateVertexPosition,
    }),
    [
      vertices,
      selectedVertexIndex,
      styles,
      handleSelectVertex,
      handleAddVertexFromSidebar,
      handleDeleteVertex,
      handleUpdateVertexColor,
      handleUpdateVertexStrokeColor,
      handleUpdateVertexPosition,
    ]
  );

  return (
    <div className="app-container">
      <div className="main-layout">
        <div className="canvas-wrapper">
          <div className="canvas-container">
            <PolygonCanvas {...canvasProps} />
          </div>
          <div className="canvas-info">
            画布尺寸：{CANVAS_WIDTH} × {CANVAS_HEIGHT}px
          </div>
        </div>
        <Sidebar {...sidebarProps} />
      </div>
    </div>
  );
}
