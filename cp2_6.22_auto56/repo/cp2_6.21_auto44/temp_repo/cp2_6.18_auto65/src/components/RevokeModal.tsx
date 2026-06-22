interface RevokeModalProps {
  isOpen: boolean;
  keyName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RevokeModal({ isOpen, keyName, onConfirm, onCancel }: RevokeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">确认吊销</h3>
        <p className="modal-message">
          确定要吊销密钥 <strong>{keyName}</strong> 吗？此操作不可撤销。
        </p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            确认吊销
          </button>
        </div>
      </div>
    </div>
  );
}
