import { useState, useEffect } from 'react';
import { X, Users, Hash, Info } from 'lucide-react';
import { ClubManager } from '@/modules/club/ClubManager';
import './JoinClubModal.css';

interface JoinClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined?: () => void;
}

export default function JoinClubModal({ isOpen, onClose, onJoined }: JoinClubModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInviteCode('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const result = ClubManager.joinClub(inviteCode.trim());
    setIsSubmitting(false);

    if (result) {
      onJoined?.();
      onClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setInviteCode(value.slice(0, 6));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content join-club-modal"
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className="modal-icon join-icon">
            <Users size={24} />
          </div>
          <h2>加入俱乐部</h2>
          <p>输入邀请码加入读书俱乐部</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="invite-code">邀请码</label>
            <input
              id="invite-code"
              type="text"
              value={inviteCode}
              onChange={handleInputChange}
              placeholder="请输入6位邀请码"
              maxLength={6}
              autoFocus
              className="invite-code-input"
            />
            <div className="form-hint">
              <Hash size={12} />
              <span>邀请码由字母和数字组成，共6位</span>
            </div>
          </div>

          <div className="join-club-tip">
            <Info size={16} />
            <span>加入后可以和俱乐部成员一起读书、分享感悟</span>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={inviteCode.length !== 6 || isSubmitting}
          >
            {isSubmitting ? '加入中...' : '加入俱乐部'}
          </button>
        </form>
      </div>
    </div>
  );
}
