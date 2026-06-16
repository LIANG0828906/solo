import React, { useState } from 'react';
import { SeedItem } from '../../types';

interface PublishModalProps {
  currentUser: string;
  onClose: () => void;
  onPublish: (item: Omit<SeedItem, 'id' | 'createdAt'>) => void;
}

const PublishModal: React.FC<PublishModalProps> = ({ currentUser, onClose, onPublish }) => {
  const [formData, setFormData] = useState({
    seedName: '',
    variety: '',
    quantity: 1,
    expectedExchange: '',
    photoUrl: '',
    location: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.seedName || !formData.variety || !formData.quantity || !formData.expectedExchange || !formData.location) {
      alert('请填写所有必填项');
      return;
    }
    setIsLoading(true);
    try {
      await onPublish({
        ...formData,
        ownerNickname: currentUser,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">发布交换条目</h2>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">种子名称 *</label>
                <input
                  type="text"
                  className="form-input"
                  name="seedName"
                  placeholder="如：向日葵种子"
                  value={formData.seedName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">品种 *</label>
                <input
                  type="text"
                  className="form-input"
                  name="variety"
                  placeholder="如：观赏向日葵"
                  value={formData.variety}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">可交换数量 *</label>
                <input
                  type="number"
                  className="form-input"
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">所在地 *</label>
                <input
                  type="text"
                  className="form-input"
                  name="location"
                  placeholder="如：北京市朝阳区"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">期望交换的物品 *</label>
                <textarea
                  className="form-input"
                  name="expectedExchange"
                  placeholder="描述您期望交换的种子或花苗..."
                  value={formData.expectedExchange}
                  onChange={handleChange}
                  required
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">照片URL（可选）</label>
                <input
                  type="url"
                  className="form-input"
                  name="photoUrl"
                  placeholder="https://..."
                  value={formData.photoUrl}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? '发布中...' : '发布'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublishModal;
