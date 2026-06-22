import './ResetDialog.css';

interface ResetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetDialog({ isOpen, onClose, onConfirm }: ResetDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </div>
        <h3 className="dialog-title">确认重置</h3>
        <p className="dialog-description">
          此操作将所有令牌值恢复为预设默认值，您当前的所有修改将丢失。确定要继续吗？
        </p>
        <div className="dialog-actions">
          <button className="dialog-btn dialog-btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="dialog-btn dialog-btn-primary" onClick={handleConfirm}>
            确认重置
          </button>
        </div>
      </div>
    </div>
  );
}
