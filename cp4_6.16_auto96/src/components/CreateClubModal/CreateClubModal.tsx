import { useState, useEffect } from 'react';
import { X, Plus, Hash, Sparkles } from 'lucide-react';
import { ClubManager } from '@/modules/club/ClubManager';
import './CreateClubModal.css';

interface CreateClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function CreateClubModal({ isOpen, onClose, onCreated }: CreateClubModalProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    ClubManager.createClub(name.trim());
    setIsSubmitting(false);
    onCreated?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content create-club-modal"
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className="modal-icon">
            <Plus size={24} />
          </div>
          <h2>创建俱乐部</h2>
          <p>和朋友们一起开启读书之旅</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="club-name">俱乐部名称</label>
            <input
              id="club-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="请输入俱乐部名称"
              maxLength={20}
              autoFocus
            />
            <div className="form-hint">
              <Hash size={12} />
              <span>创建后将自动生成6位邀请码</span>
            </div>
          </div>

          <div className="create-club-tip">
            <Sparkles size={16} />
            <span>创建后你将成为俱乐部发起人，可以添加书籍、发起投票</span>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? '创建中...' : '创建俱乐部'}
          </button>
        </form>
      </div>
    </div>
  );
}
