import { useState, useRef, useCallback, useEffect } from 'react';
import SceneCard from './SceneCard';
import { useStoryStore } from '@/store/storyStore';
import type { Scene } from '@/types';

const CARD_WIDTH = 220;
const CARD_HEIGHT = 160;

interface ConnectionLine {
  fromId: string;
  toId: string;
  key: string;
}

export default function StoryCanvas() {
  const scenes = useStoryStore((state) => state.scenes);
  const characters = useStoryStore((state) => state.characters);
  const props = useStoryStore((state) => state.props);
  const selectedSceneId = useStoryStore((state) => state.selectedSceneId);
  const addScene = useStoryStore((state) => state.addScene);
  const deleteScene = useStoryStore((state) => state.deleteScene);
  const selectScene = useStoryStore((state) => state.selectScene);
  const linkScenes = useStoryStore((state) => state.linkScenes);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{
    sceneId: string;
    x: number;
    y: number;
  } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  const connectionLines: ConnectionLine[] = [];
  const sceneMap = new Map(scenes.map((s) => [s.id, s]));

  const sortedByOrder = [...scenes].sort((a, b) => a.order - b.order);

  for (let i = 0; i < sortedByOrder.length - 1; i++) {
    const from = sortedByOrder[i];
    const to = sortedByOrder[i + 1];
    if (!from.nextSceneIds.includes(to.id)) {
      connectionLines.push({
        fromId: from.id,
        toId: to.id,
        key: `default-${from.id}-${to.id}`,
      });
    }
  }

  scenes.forEach((scene) => {
    scene.nextSceneIds.forEach((toId) => {
      if (sceneMap.has(toId)) {
        connectionLines.push({
          fromId: scene.id,
          toId,
          key: `custom-${scene.id}-${toId}`,
        });
      }
    });
  });

  const uniqueLines = new Map<string, ConnectionLine>();
  connectionLines.forEach((line) => {
    const key = `${line.fromId}-${line.toId}`;
    if (!uniqueLines.has(key)) {
      uniqueLines.set(key, line);
    }
  });
  const finalLines = Array.from(uniqueLines.values());

  const getCardCenterRight = (scene: Scene) => ({
    x: scene.x + CARD_WIDTH,
    y: scene.y + CARD_HEIGHT / 2,
  });

  const getCardCenterLeft = (scene: Scene) => ({
    x: scene.x,
    y: scene.y + CARD_HEIGHT / 2,
  });

  const generateBezierPath = (
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    const dx = Math.abs(x2 - x1);
    const controlOffset = Math.max(50, dx * 0.4);
    return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
  };

  const handleCanvasClick = useCallback(() => {
    selectScene(null);
  }, [selectScene]);

  const handleAddScene = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scrollLeft = canvas.scrollLeft;
    const scrollTop = canvas.scrollTop;
    const x = scrollLeft + rect.width / 2 - CARD_WIDTH / 2;
    const y = scrollTop + rect.height / 2 - CARD_HEIGHT / 2;
    addScene(x, y);
  };

  const handleStartConnection = useCallback(
    (sceneId: string, x: number, y: number) => {
      setIsConnecting(true);
      setConnectionStart({ sceneId, x, y });
      setMousePos({ x, y });
    },
    []
  );

  const handleEndConnection = useCallback(
    (targetSceneId: string) => {
      if (isConnecting && connectionStart && connectionStart.sceneId !== targetSceneId) {
        linkScenes(connectionStart.sceneId, targetSceneId);
      }
      setIsConnecting(false);
      setConnectionStart(null);
    },
    [isConnecting, connectionStart, linkScenes]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isConnecting && canvasRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + canvas.scrollLeft;
        const y = e.clientY - rect.top + canvas.scrollTop;
        setMousePos({ x, y });
      }
    },
    [isConnecting]
  );

  const handleMouseUp = useCallback(() => {
    if (isConnecting) {
      setIsConnecting(false);
      setConnectionStart(null);
    }
  }, [isConnecting]);

  useEffect(() => {
    if (isConnecting) {
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isConnecting, handleMouseUp]);

  const handleEditScene = (sceneId: string) => {
    selectScene(sceneId);
  };

  const handleDeleteScene = (sceneId: string) => {
    deleteScene(sceneId);
  };

  return (
    <div
      className="story-canvas"
      ref={canvasRef}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
    >
      <button className="add-scene-btn" onClick={(e) => {
        e.stopPropagation();
        handleAddScene();
      }}>
        + 添加场景
      </button>

      <div className="canvas-inner">
        <svg className="canvas-svg">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
              className="arrow-marker"
            >
              <polygon points="0 0, 10 3.5, 0 7" />
            </marker>
            <marker
              id="arrowhead-highlight"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
              className="arrow-marker highlight"
            >
              <polygon points="0 0, 10 3.5, 0 7" />
            </marker>
          </defs>

          {finalLines.map((line) => {
            const fromScene = sceneMap.get(line.fromId);
            const toScene = sceneMap.get(line.toId);
            if (!fromScene || !toScene) return null;

            const start = getCardCenterRight(fromScene);
            const end = getCardCenterLeft(toScene);
            const path = generateBezierPath(start.x, start.y, end.x, end.y);
            const isHovered = hoveredLine === line.key;

            return (
              <path
                key={line.key}
                d={path}
                className={`connection-line ${isHovered ? 'highlight' : ''}`}
                markerEnd={isHovered ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
                onMouseEnter={() => setHoveredLine(line.key)}
                onMouseLeave={() => setHoveredLine(null)}
              />
            );
          })}

          {isConnecting && connectionStart && (
            <path
              d={generateBezierPath(
                connectionStart.x,
                connectionStart.y,
                mousePos.x,
                mousePos.y
              )}
              className="connection-line highlight"
              strokeDasharray="5,5"
              markerEnd="url(#arrowhead-highlight)"
            />
          )}
        </svg>

        {scenes.map((scene) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            characters={characters}
            props={props}
            isSelected={selectedSceneId === scene.id}
            onEdit={() => handleEditScene(scene.id)}
            onDelete={() => handleDeleteScene(scene.id)}
            onStartConnection={handleStartConnection}
            onEndConnection={handleEndConnection}
          />
        ))}
      </div>
    </div>
  );
}
