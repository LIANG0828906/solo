import { useState } from 'react';
import type { Card } from '../types';
import { useCardStore } from '../store/useCardStore';

interface DeleteConfirmModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

const DeleteConfirmModal = ({ card, isOpen, onClose, onDeleted }: DeleteConfirmModalProps) => {
  const [closing, setClosing] = useState(false);
  const deleteCard = useCardStore((s) => s.deleteCard);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 300);
  };

  const handleConfirm = async () => {
    if (!card) return;
    try {
      await deleteCard(card.id);
      handleClose();
      onDeleted?.();
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  if (!isOpen && !closing) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className={`modal-content confirm-modal-content ${closing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">确认删除</h2>
        <p className="confirm-text">
          确定要删除这张卡片吗？此操作无法撤销。
        </p>
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={handleClose}>
            取消
          </button>
          <button
            type="button"
            className="btn-confirm-delete"
            onClick={handleConfirm}
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
