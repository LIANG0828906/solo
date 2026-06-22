import { useToastStore } from '@/store/toast';

export default function Toast() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`
            px-6 py-3 rounded-btn shadow-lg font-body text-sm font-medium
            animate-slide-up cursor-pointer transition-all duration-300
            ${toast.type === 'success' ? 'bg-green-600 text-white' : ''}
            ${toast.type === 'error' ? 'bg-red-600 text-white' : ''}
            ${toast.type === 'info' ? 'bg-oak-dark text-white' : ''}
          `}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
