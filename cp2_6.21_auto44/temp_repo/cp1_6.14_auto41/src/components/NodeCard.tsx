import React, { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import type { DialogueNode, Character, Emotion } from '../types';
import { EMOTION_COLORS, EMOTION_LABELS, NODE_WIDTH, NODE_HEIGHT, AVATAR_SIZE } from '../types';

interface NodeCardProps {
  node: DialogueNode;
  characters: Character[];
  selected: boolean;
  isDragging: boolean;
  onUpdate: (id: string, updates: Partial<DialogueNode>) => void;
  onRemove: (id: string) => void;
  onPortMouseDown: (nodeId: string, portIndex: number, e: React.MouseEvent) => void;
  onTargetPortMouseUp: (nodeId: string, e: React.MouseEvent) => void;
  onTargetPortMouseEnter: (nodeId: string) => void;
  onTargetPortMouseLeave: () => void;
  activeTargetNodeId: string | null;
  connectingSourceId: string | null;
}

const NodeCard: React.FC<NodeCardProps> = memo(function NodeCard({
  node,
  characters,
  selected,
  isDragging,
  onUpdate,
  onRemove,
  onPortMouseDown,
  onTargetPortMouseUp,
  onTargetPortMouseEnter,
  onTargetPortMouseLeave,
  activeTargetNodeId,
  connectingSourceId,
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: node.id,
  });

  const character = characters.find((c) => c.id === node.characterId);

  const style: React.CSSProperties = {
    left: node.x,
    top: node.y,
    width: NODE_WIDTH,
    transform: transform ? CSS.Translate.toString(transform) : undefined,
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(node.id, { text: e.target.value });
  };

  const handleCharacterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(node.id, { characterId: e.target.value });
  };

  const handleEmotionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(node.id, { emotion: e.target.value as Emotion });
  };

  const handleBranchLabelChange = (index: number, value: string) => {
    const newLabels = [...node.branchLabels];
    newLabels[index] = value;
    onUpdate(node.id, { branchLabels: newLabels });
  };

  const handleAddBranch = () => {
    if (node.branchLabels.length < 3) {
      onUpdate(node.id, { branchLabels: [...node.branchLabels, ''] });
    }
  };

  const handleRemoveBranch = (index: number) => {
    const newLabels = node.branchLabels.filter((_, i) => i !== index);
    onUpdate(node.id, { branchLabels: newLabels });
  };

  const emotionColor = EMOTION_COLORS[node.emotion];

  return (
    <div
      ref={setNodeRef}
      className={`node-card ${isDragging ? 'dragging' : ''} ${selected ? 'selected' : ''}`}
      style={style}
    >
      {connectingSourceId && connectingSourceId !== node.id && (
        <div
          className={`target-port ${activeTargetNodeId === node.id ? 'active' : ''}`}
          onMouseUp={(e) => onTargetPortMouseUp(node.id, e)}
          onMouseEnter={() => onTargetPortMouseEnter(node.id)}
          onMouseLeave={onTargetPortMouseLeave}
        />
      )}

      <div className="node-header" {...attributes} {...listeners}>
        <div
          className={`avatar-wrap emotion-${node.emotion}`}
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderColor: emotionColor,
          }}
        >
          {character?.avatar || '👤'}
        </div>
        <div className="node-meta">
          <select
            className="node-character-select"
            value={node.characterId}
            onChange={handleCharacterChange}
            onClick={(e) => e.stopPropagation()}
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="node-emotion-select"
            value={node.emotion}
            onChange={handleEmotionChange}
            onClick={(e) => e.stopPropagation()}
          >
            {(['neutral', 'angry', 'happy'] as Emotion[]).map((em) => (
              <option key={em} value={em}>
                {EMOTION_LABELS[em]}
              </option>
            ))}
          </select>
        </div>
        <button
          className="remove-node-btn"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(node.id);
          }}
          title="删除节点"
        >
          <X size={14} />
        </button>
      </div>

      <div className="node-body">
        <textarea
          className="node-text"
          value={node.text}
          onChange={handleTextChange}
          onClick={(e) => e.stopPropagation()}
          placeholder="输入对话内容..."
        />
      </div>

      <div className="node-branches">
        {node.branchLabels.map((label, index) => (
          <div key={index} className="branch-row">
            <input
              type="text"
              className="branch-input"
              value={label}
              onChange={(e) => handleBranchLabelChange(index, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder={`分支 ${index + 1}`}
            />
            <div
              className="port"
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onPortMouseDown(node.id, index, e);
              }}
              title="拖拽连接到目标节点"
            />
            {node.branchLabels.length > 1 && (
              <button
                className="icon-btn"
                style={{ width: 20, height: 20, fontSize: 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveBranch(index);
                }}
                title="删除分支"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        {node.branchLabels.length < 3 && (
          <button className="add-branch-btn" onClick={(e) => e.stopPropagation()} onClickCapture={handleAddBranch}>
            + 添加分支选项
          </button>
        )}
      </div>
    </div>
  );
});

export default NodeCard;
