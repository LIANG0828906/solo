import React, { useState } from 'react';
import type { Dimension } from '../types';
import '../styles/CreateTemplateModal.css';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, dimensions: Omit<Dimension, 'id'>[]) => void;
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [dimensions, setDimensions] = useState<Omit<Dimension, 'id'>[]>([
    { name: '技术能力', weight: 3 },
    { name: '沟通协作', weight: 3 },
    { name: '进度管理', weight: 3 },
  ]);

  const handleAddDimension = () => {
    setDimensions([...dimensions, { name: '', weight: 3 }]);
  };

  const handleRemoveDimension = (index: number) => {
    if (dimensions.length <= 1) return;
    setDimensions(dimensions.filter((_, i) => i !== index));
  };

  const handleDimensionNameChange = (index: number, value: string) => {
    const newDims = [...dimensions];
    newDims[index].name = value;
    setDimensions(newDims);
  };

  const handleDimensionWeightChange = (index: number, value: number) => {
    const newDims = [...dimensions];
    newDims[index].weight = value;
    setDimensions(newDims);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('请输入模板名称');
      return;
    }
    const validDims = dimensions.filter(d => d.name.trim());
    if (validDims.length === 0) {
      alert('请至少添加一个维度');
      return;
    }
    onCreate(name.trim(), validDims);
    setName('');
    setDimensions([
      { name: '技术能力', weight: 3 },
      { name: '沟通协作', weight: 3 },
      { name: '进度管理', weight: 3 },
    ]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>创建复盘模板</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">模板名称</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例如：Sprint 复盘模板"
            />
          </div>

          <div className="form-group">
            <label className="form-label">评分维度</label>
            <div className="dimension-list">
              {dimensions.map((dim, index) => (
                <div key={index} className="dimension-row">
                  <input
                    type="text"
                    className="form-input dimension-input"
                    value={dim.name}
                    onChange={e => handleDimensionNameChange(index, e.target.value)}
                    placeholder="维度名称"
                  />
                  <div className="weight-selector">
                    <span className="weight-label">权重</span>
                    <select
                      className="form-select"
                      value={dim.weight}
                      onChange={e => handleDimensionWeightChange(index, parseInt(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5].map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="dim-remove-btn"
                    onClick={() => handleRemoveDimension(index)}
                    disabled={dimensions.length <= 1}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="add-dim-btn"
              onClick={handleAddDimension}
            >
              + 添加维度
            </button>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn--primary">
              创建模板
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTemplateModal;
