import { useRef, useState, useCallback, useMemo } from 'react';
import SceneCard from './SceneCard';
import { useStoryStore } from '@/store/storyStore';
import type { Scene } from '@/types';

const CARD_WIDTH = 220;
const CARD_HEIGHT = 160;

export default function StoryCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const scenes = useStoryStore((state) => state.scenes);
  const characters = useStoryStore((state) => state.characters);
  const props = useStoryStore((state) => state.props);
  const selectedSceneId = useStoryStore((state) => state.selectedSceneId);
  const addScene = useStoryStore((state) => state.addScene);
  const deleteScene = useStoryStore((state) => state.deleteScene);
  const selectScene = useStoryStore((state) => state.selectScene);
  const linkScenes = useStoryStore((state) => state.linkScenes);
  const unlinkScenes = useStoryStore((state) => state.unlinkScenes);
  const isInitialized = useStoryStore((state) => state.isInitialized);

  const [connecting, setConnecting] = useState<{
    fromSceneId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const getSceneRightCenter = useCallback((scene: Scene) => {
    return {
      x: scene.x + CARD_WIDTH,
      y: scene.y + CARD_HEIGHT / 2,
    };
  }, []);

  const getSceneLeftCenter = useCallback((scene: Scene) => {
    return {
      x: scene.x,
      y: scene.y + CARD_HEIGHT / 2,
    };
  }, []);

  const generateBezierPath = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      const dx = Math.abs(x2 - x1);
      const controlOffset = Math.max(50, dx * 0.4);
      return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
    },
    []
  );

  const links = useMemo(() => {
    const result: {
      id: string;
      fromScene: Scene;
      toScene: Scene;
      path: string;
    }[] = [];

    if (scenes.length === 0) return result;

    const sceneMap = new Map(scenes.map((s) => [s.id, s]));

    scenes.forEach((fromScene) => {
      fromScene.nextSceneIds.forEach((toId) => {
        const toScene = sceneMap.get(toId);
        if (toScene) {
          const from = getSceneRightCenter(fromScene);
          const to = getSceneLeftCenter(toScene);
          result.push({
            id: `${fromScene.id}-${toId}`,
            fromScene,
            toScene,
            path: generateBezierPath(from.x, from.y, to.x, to.y),
          });
        }
      });
    });

    if (result.length === 0 && scenes.length > 1) {
      const sorted = [...scenes].sort(
        (a, b) => a.createdAt - b.createdAt
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        const from = getSceneRightCenter(sorted[i]);
        const to = getSceneLeftCenter(sorted[i + 1]);
        result.push({
          id: `auto-${sorted[i].id}-${sorted[i + 1].id}`,
          fromScene: sorted[i],
          toScene: sorted[i + 1],
          path: generateBezierPath(from.x, from.y, to.x, to.y),
        });
      }
    }

    return result;
  }, [scenes, generateBezierPath, getSceneRightCenter, getSceneLeftCenter]);

  const handleCanvasClick = () => {
    selectScene(null);
  };

  const handleAddScene = (e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + canvas.scrollLeft - CARD_WIDTH / 2;
    const y = e.clientY - rect.top + canvas.scrollTop - CARD_HEIGHT / 2;
    addScene(Math.max(0, x), Math.max(0, y));
  };

  const handleStartConnection = useCallback(
    (sceneId: string, x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scrollLeft = canvas.scrollLeft;
      const scrollTop = canvas.scrollTop;
      setConnecting({
        fromSceneId: sceneId,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      });

      const handleMouseMove = (e: MouseEvent) => {
        const canvasX = e.clientX - rect.left + scrollLeft;
        const canvasY = e.clientY - rect.top + scrollTop;
        setConnecting((prev) =>
          prev
            ? {
                ...prev,
                currentX: canvasX,
                currentY: canvasY,
              }
            : null
        );
      };

      const handleMouseUp = () => {
        setConnecting(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    []
  );

  const handleEndConnection = useCallback(
    (toSceneId: string) => {
      if (!connecting) return;
      if (connecting.fromSceneId === toSceneId) return;

      const fromScene = scenes.find((s) => s.id === connecting.fromSceneId);
      if (fromScene && fromScene.nextSceneIds.includes(toSceneId)) {
        unlinkScenes(connecting.fromSceneId, toSceneId);
      } else {
        linkScenes(connecting.fromSceneId, toSceneId);
      }
    },
    [connecting, scenes, linkScenes, unlinkScenes]
  );

  const handleEdit = (sceneId: string) => {
    selectScene(sceneId);
  };

  const handleDelete = (sceneId: string) => {
    deleteScene(sceneId);
  };

  const svgWidth = useMemo(() => {
    if (scenes.length === 0) return 2000;
    return Math.max(2000, Math.max(...scenes.map((s) => s.x)) + CARD_WIDTH + 200);
  }, [scenes]);

  const svgHeight = useMemo(() => {
    if (scenes.length === 0) return 2000;
    return Math.max(2000, Math.max(...scenes.map((s) => s.y)) + CARD_HEIGHT + 200);
  }, [scenes]);

  return (
    <div className="story-canvas" ref={canvasRef} onClick={handleCanvasClick}>
      <button className="add-scene-btn" onClick={handleAddScene}>
        + 添加场景
      </button>

      <svg
        className="connections-svg"
        width={svgWidth}
        height={svgHeight}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(77, 166, 255, 0.5)" />
          </marker>
          <marker
            id="arrowhead-hover"
            markerWidth="12"
            markerHeight="9"
            refX="11"
            refY="4.5"
            orient="auto"
          >
            <polygon points="0 0, 12 4.5, 0 9" fill="#00e5ff" />
          </marker>
        </defs>

        {links.map((link) => (
          <path
            key={link.id}
            d={link.path}
            className={`connection-path ${hoveredLink === link.id ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredLink(link.id)}
            onMouseLeave={() => setHoveredLink(null)}
            markerEnd={hoveredLink === link.id ? 'url(#arrowhead-hover)' : 'url(#arrowhead)'}
          />
        ))}

        {connecting && (
          <path
            d={generateBezierPath(
              connecting.startX,
              connecting.startY,
              connecting.currentX,
              connecting.currentY
            )}
            className="connection-preview"
            strokeDasharray="5,5"
          />
        )}
      </svg>

      {isInitialized &&
        scenes.map((scene) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            characters={characters}
            props={props}
            isSelected={selectedSceneId === scene.id}
            onEdit={() => handleEdit(scene.id)}
            onDelete={() => handleDelete(scene.id)}
            onStartConnection={handleStartConnection}
            onEndConnection={handleEndConnection}
          />
        ))}

      {scenes.length === 0 && isInitialized && (
        <div className="canvas-empty">
          <p style={{ marginBottom: '16px' }}>画布还是空的</p>
          <p style={{ fontSize: '14px', opacity: 0.7 }}>
            点击左上角"添加场景"按钮来创建第一个场景
          </p>
        </div>
      )}
    </div>
  );
}
