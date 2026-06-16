import React from 'react';
import { useAnimStore } from '../store';
import { AlertCircle, CheckCircle, X, Info } from 'lucide-react';

interface ToastItem {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export const ToastContainer: React.FC = () => {
  const toasts = useAnimStore(s => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast, idx) => (
        <ToastItem key={idx} message={toast.message} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ message: string }> = ({ message }) => {
  const Icon = message.includes('上限') || message.includes('已达') ? AlertCircle
    : message.includes('复制') || message.includes('成功') ? CheckCircle
    : Info;

  const iconColor = message.includes('上限') || message.includes('已达') ? 'text-[#e94560]'
    : message.includes('复制') || message.includes('成功') ? 'text-[#4ecdc4]'
    : 'text-[#ffe66d]';

  return (
    <div
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl
        bg-[#16213e]/95 backdrop-blur-md border border-white/10
        shadow-xl shadow-black/30
        animate-[toastIn_0.3s_ease-out_forwards]
        min-w-[200px] max-w-[380px]
      `}
      style={{
        animation: 'toastIn 0.3s ease-out, toastOut 0.3s ease-in 1.7s forwards'
      }}
    >
      <Icon size={16} className={`${iconColor} flex-shrink-0`} />
      <span className="text-sm text-[#e0e0e0] font-medium">{message}</span>
    </div>
  );
};

export const CopyToast: React.FC<{ show: boolean; message?: string }> = ({ show, message = '已复制！' }) => {
  if (!show) return null;
  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999]
        flex items-center gap-2 px-4 py-2 rounded-xl
        bg-[#4ecdc4]/95 backdrop-blur-md
        shadow-xl shadow-[#4ecdc4]/30
        animate-[copyToast_1.5s_ease-in-out_forwards]"
    >
      <CheckCircle size={16} className="text-white flex-shrink-0" />
      <span className="text-sm text-white font-semibold">{message}</span>
    </div>
  );
};
