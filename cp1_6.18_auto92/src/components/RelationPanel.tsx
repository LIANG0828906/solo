import React, { useState } from 'react';
import { useCharacterStore } from '../stores/characterStore';
import { RELATION_TYPES, RelationStyle } from '../types';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export const RelationPanel: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [relationType, setRelationType] = useState(RELATION_TYPES[0].type);
  const [isAnimating, setIsAnimating] = useState(false);

  const characters = useCharacterStore((s) => s.characters);
  const addRelation = useCharacterStore((s) => s.addRelation);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);

  React.useEffect(() => {
    if (selectedCharacterId && !sourceId) {
      setSourceId(selectedCharacterId);
    }
  }, [selectedCharacterId]);

  const handleAddRelation = () => {
    if (!sourceId || !targetId || sourceId === targetId) {
      alert('请选择两个不同的角色');
      return;
    }

    const relationInfo = RELATION_TYPES.find((r) => r.type === relationType);
    if (!relationInfo) return;

    setIsAnimating(true);
    addRelation({
      sourceId,
      targetId,
      type: relationType,
      style: relationInfo.style as RelationStyle,
    });

    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  if (isCollapsed) {
    return (
      <div className="relation-panel collapsed">
        <button
          className="panel-toggle"
          onClick={() => setIsCollapsed(false)}
          title="展开"
        >
          <ChevronLeft size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className={`relation-panel ${isAnimating ? 'animating' : ''}`}>
      <button
        className="panel-toggle"
        onClick={() => setIsCollapsed(true)}
        title="收起"
      >
        <ChevronRight size={20} />
      </button>

      <div className="panel-content">
        <h3 className="panel-title">添加关系</h3>

        <div className="form-group">
          <label className="form-label">源角色</label>
          <select
            className="form-select"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
          >
            <option value="">选择角色...</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">目标角色</label>
          <select
            className="form-select"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            <option value="">选择角色...</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">关系类型</label>
          <select
            className="form-select"
            value={relationType}
            onChange={(e) => setRelationType(e.target.value)}
          >
            {RELATION_TYPES.map((r) => (
              <option key={r.type} value={r.type}>
                {r.type}
              </option>
            ))}
          </select>
        </div>

        <button className="btn add-relation-btn" onClick={handleAddRelation}>
          <Plus size={16} />
          添加关系
        </button>

        <div className="relation-preview">
          <div className="preview-title">关系样式预览</div>
          <div className="preview-line">
            <div className={`line ${RELATION_TYPES.find(r => r.type === relationType)?.style === 'dashed' ? 'dashed' : 'solid'}`} />
            <span>{relationType}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelationPanel;
