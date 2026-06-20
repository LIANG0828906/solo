import React, { useState, useEffect } from 'react';
import { useBoardStore } from '@/stores/boardStore';
import { NodeType, NodeTypeColors, NodeTypeLabels } from '@/types';
import { FileText, User, Zap, Settings, Plus, X, LucideIcon } from 'lucide-react';

interface Props {
  onClose: () => void;
  initialPosition: { x: number; y: number };
}

const typeIcons: Record<NodeType, LucideIcon> = {
  scene: FileText,
  character: User,
  event: Zap,
  setting: Settings,
};

const CreateNodeModal: React.FC<Props> = ({ onClose, initialPosition }) => {
  const [selectedType, setSelectedType] = useState<NodeType>('scene');
  const [title, setTitle] = useState<string>('');
  const addNode = useBoardStore((state) => state.addNode);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCreate = () => {
    if (!title.trim() || !selectedType) return;
    addNode({
      type: selectedType,
      title: title.trim(),
      content: '',
      tags: [],
      x: initialPosition.x,
      y: initialPosition.y,
    });
    onClose();
  };

  const isDisabled = !title.trim() || !selectedType;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="modal-title">创建新节点</h2>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px', borderRadius: '50%' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">节点类型</label>
            <div className="type-selector">
              {(['scene', 'character', 'event', 'setting'] as NodeType[]).map((type) => {
                const Icon = typeIcons[type];
                return (
                  <div
                    key={type}
                    className={`type-option ${selectedType === type ? 'selected' : ''}`}
                    onClick={() => setSelectedType(type)}
                  >
                    <div
                      className="type-option-icon"
                      style={{ backgroundColor: `${NodeTypeColors[type]}20` }}
                    >
                      <Icon size={20} color={NodeTypeColors[type]} />
                    </div>
                    <div className="type-option-label">{NodeTypeLabels[type]}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">节点标题</label>
            <input
              type="text"
              className="form-input"
              placeholder="请输入节点标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={isDisabled}
          >
            <Plus size={16} />
            创建
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateNodeModal;
