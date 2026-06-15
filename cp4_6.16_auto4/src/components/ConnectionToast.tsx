import { useDocStore } from '../store/useDocStore';
import { WifiOff, Wifi } from 'lucide-react';

export default function ConnectionToast() {
  const isReconnecting = useDocStore((s) => s.isReconnecting);
  const isConnected = useDocStore((s) => s.isConnected);

  if (!isReconnecting && isConnected) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 toast-enter">
      <div className="flex items-center gap-2 px-5 py-2.5 bg-navy/85 backdrop-blur-md text-white rounded-full shadow-lg text-sm font-medium">
        {isReconnecting ? (
          <>
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span>重新连接中...</span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-emerald" />
            <span className="text-emerald">已连接</span>
          </>
        )}
      </div>
    </div>
  );
}
