interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full transition-transform duration-200 ease-out scale-100 animate-[scaleIn_200ms_ease-out]">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 bg-gray-200 hover:bg-gray-300 transition duration-150"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg px-4 py-2 bg-[#1976D2] text-white hover:bg-[#1565C0] transition duration-150"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
