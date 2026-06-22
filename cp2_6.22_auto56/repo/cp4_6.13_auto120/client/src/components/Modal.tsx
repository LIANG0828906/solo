interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  confirmText?: string;
}

function Modal({ isOpen, title, message, onClose, confirmText = '确定' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>
          {confirmText}
        </button>
      </div>
    </div>
  );
}

export default Modal;
