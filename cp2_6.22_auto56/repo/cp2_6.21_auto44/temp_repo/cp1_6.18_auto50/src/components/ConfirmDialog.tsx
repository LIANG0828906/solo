interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
}

export default function ConfirmDialog({ isOpen, onConfirm, onCancel, message }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-base-card border border-base-border rounded-2xl p-6 w-[90%] max-w-sm animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🐾</span>
        </div>
        <p className="text-text-primary text-sm text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-base-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-accent text-base hover:bg-accent/90 transition-colors cursor-pointer"
            onClick={onConfirm}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
