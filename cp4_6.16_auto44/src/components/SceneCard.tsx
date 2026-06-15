import { useRef, useEffect } from 'react';
import { select } from 'd3-selection';
import { drag } from 'd3-drag';
import { useStoryStore } from '@/store/storyStore';
import type { Scene, Character, Prop } from '@/types';

interface SceneCardProps {
  scene: Scene;
  characters: Character[];
  props: Prop[];
  isSelected: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStartConnection: (sceneId: string, x: number, y: number) => void;
  onEndConnection: (sceneId: string) => void;
}

const CARD_WIDTH = 220;
const CARD_HEIGHT = 160;

export default function SceneCard({
  scene,
  characters,
  props,
  isSelected,
  onEdit,
  onDelete,
  onStartConnection,
  onEndConnection,
}: SceneCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const moveScene = useStoryStore((state) => state.moveScene);
  const saveToDB = useStoryStore((state) => state.saveToDB);
  const selectScene = useStoryStore((state) => state.selectScene);

  const sceneCharacters = characters.filter((c) =>
    scene.characterIds.includes(c.id)
  );
  const sceneProps = props.filter((p) => scene.propIds.includes(p.id));

  useEffect(() => {
    if (!cardRef.current) return;

    const node = select(cardRef.current);

    let startX = 0;
    let startY = 0;
    let initialSceneX = 0;
    let initialSceneY = 0;

    const dragBehavior = drag<HTMLDivElement, unknown>()
      .on('start', function (event) {
        select(this).classed('dragging', true);
        event.sourceEvent.stopPropagation();
        startX = event.sourceEvent.clientX;
        startY = event.sourceEvent.clientY;
        initialSceneX = scene.x;
        initialSceneY = scene.y;
      })
      .on('drag', function (event) {
        const dx = event.sourceEvent.clientX - startX;
        const dy = event.sourceEvent.clientY - startY;
        const newX = Math.max(0, initialSceneX + dx);
        const newY = Math.max(0, initialSceneY + dy);
        moveScene(scene.id, newX, newY);
      })
      .on('end', function () {
        select(this).classed('dragging', false);
        saveToDB();
      });

    node.call(dragBehavior);

    return () => {
      node.on('.drag', null);
    };
  }, [scene.id, scene.x, scene.y, moveScene, saveToDB]);

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectScene(scene.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`确定要删除场景 "${scene.title}" 吗？`)) {
      onDelete();
    }
  };

  const handleRightPointMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const canvas = cardRef.current?.closest('.canvas-inner');
      const canvasRect = canvas?.getBoundingClientRect();
      if (canvasRect) {
        const startX = scene.x + CARD_WIDTH;
        const startY = scene.y + CARD_HEIGHT / 2;
        onStartConnection(scene.id, startX, startY);
      }
    }
  };

  const handleLeftPointMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEndConnection(scene.id);
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div
      ref={cardRef}
      className={`scene-card ${isSelected ? 'selected' : ''}`}
      style={{
        left: scene.x,
        top: scene.y,
        width: CARD_WIDTH,
      }}
      onClick={handleCardClick}
    >
      <div className="connection-point right" onMouseDown={handleRightPointMouseDown} />
      <div className="connection-point left" onMouseUp={handleLeftPointMouseUp} />

      <h3 className="scene-card-title">{scene.title}</h3>
      <p className="scene-card-desc">
        {scene.description || '暂无描述，点击编辑添加...'}
      </p>

      <div className="scene-card-footer">
        <div className="scene-card-bottom-left">
          {sceneCharacters.length > 0 && (
            <div className="scene-card-chars">
              {sceneCharacters.slice(0, 4).map((char) => (
                <div
                  key={char.id}
                  className="char-avatar-small"
                  style={{ backgroundColor: char.color }}
                  title={char.name}
                >
                  {getInitial(char.name)}
                </div>
              ))}
            </div>
          )}
          {sceneProps.length > 0 && (
            <div className="scene-card-props">
              {sceneProps.slice(0, 3).map((prop) => (
                <div key={prop.id} className="prop-icon-small" title={prop.name}>
                  {prop.icon}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="scene-card-actions">
        <button className="card-action-btn" onClick={handleEditClick} title="编辑">
          ✏️
        </button>
        <button
          className="card-action-btn delete"
          onClick={handleDeleteClick}
          title="删除"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
