import React from 'react';
import { Keyframe } from '../types';
import { KeyframeItem } from './KeyframeItem';

interface KeyframeListProps {
  keyframes: Keyframe[];
  selectedKeyframeId: string | null;
  onAddKeyframe: () => void;
  onSelectKeyframe: (id: string) => void;
  onDeleteKeyframe: (id: string) => void;
  onUpdateKeyframe: (id: string, updates: Partial<Keyframe>) => void;
}

export const KeyframeList: React.FC<KeyframeListProps> = ({
  keyframes,
  selectedKeyframeId,
  onAddKeyframe,
  onSelectKeyframe,
  onDeleteKeyframe,
  onUpdateKeyframe,
}) => {
  const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);

  return (
    <>
      <div className="panel-header">
        <span className="panel-title">关键帧列表</span>
        <button className="btn btn-primary" onClick={onAddKeyframe}>
          + 添加
        </button>
      </div>
      <div className="panel-content">
        {sortedKeyframes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏱</div>
            <div className="empty-state-text">
              还没有关键帧，点击上方"添加"按钮创建第一个关键帧
            </div>
          </div>
        ) : (
          <div className="keyframe-list">
            {sortedKeyframes.map((keyframe) => (
              <KeyframeItem
                key={keyframe.id}
                keyframe={keyframe}
                isSelected={keyframe.id === selectedKeyframeId}
                onSelect={() => onSelectKeyframe(keyframe.id)}
                onDelete={() => onDeleteKeyframe(keyframe.id)}
                onUpdate={(updates) => onUpdateKeyframe(keyframe.id, updates)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
