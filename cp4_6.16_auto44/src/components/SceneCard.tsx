import { useRef, useEffect, useState, memo } from 'react';
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

function SceneCard({
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
  const commitScenePosition = useStoryStore((state) => state.commitScenePosition);
  const selectScene = useStoryStore((state) => state.selectScene);
  const [isDragging, setIsDragging] = useState(false);

  const sceneCharacters = characters.filter((c) =>
    scene.characterIds.includes(c.id)
  );
  const sceneProps = props.filter((p) => scene.propIds.includes(p.id));

  useEffect(() => {
    if (!cardRef.current) return;

    const node = select(cardRef.current);
    let startClientX = 0;
    let startClientY = 0;
    let initialX = 0;
    let initialY = 0;

    const dragBehavior = drag<HTMLDivElement, unknown>()
      .on('start', function (event) {
        setIsDragging(true);
        select(this).classed('dragging', true);
        event.sourceEvent.stopPropagation();
        startClientX = event.sourceEvent.clientX;
        startClientY = event.sourceEvent.clientY;
        initialX = scene.x;
        initialY = scene.y;
      })
      .on('drag', function (event) {
        const dx = event.sourceEvent.clientX - startClientX;
        const dy = event.sourceEvent.clientY - startClientY;
        const newX = Math.max(0, initialX + dx);
        const newY = Math.max(0, initialY + dy);
        if (cardRef.current) {
          cardRef.current.style.transform = `translate(${newX - scene.x}px, ${newY - scene.y}px)`;
        }
      })
      .on('end', function (event) {
        setIsDragging(false);
        select(this).classed('dragging', false);
        const dx = event.sourceEvent.clientX - startClientX;
        const dy = event.sourceEvent.clientY - startClientY;
        const finalX = Math.max(0, Math.round(initialX + dx));
        const finalY = Math.max(0, Math.round(initialY + dy));
        if (cardRef.current) {
          cardRef.current.style.transform = '';
        }
        commitScenePosition(scene.id, finalX, finalY);
      });

    node.call(dragBehavior);

    return () => {
      node.on('.drag', null);
    };
  }, [scene.id, scene.x, scene.y, commitScenePosition]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragging) return;
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
    const startX = scene.x + CARD_WIDTH;
    const startY = scene.y + CARD_HEIGHT / 2;
    onStartConnection(scene.id, startX, startY);
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
      <div
        className="connection-point right"
        onMouseDown={handleRightPointMouseDown}
      />
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
                <div
                  key={prop.id}
                  className="prop-icon-small"
                  title={prop.name}
                >
                  {prop.icon}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="scene-card-actions">
        <button
          className="card-action-btn"
          onClick={handleEditClick}
          title="编辑"
        >
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

export default memo(SceneCard);
