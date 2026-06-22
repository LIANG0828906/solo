import { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff, Loader2, AlertTriangle } from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { ConnectionStatus } from '@/types';

const STATUS_CONFIG: Record<ConnectionStatus, { icon: React.ReactNode; label: string; color: string }> = {
  disconnected: { icon: <WifiOff size={14} />, label: '未连接', color: 'text-gray-500' },
  connecting: { icon: <Loader2 size={14} className="animate-spin" />, label: '连接中...', color: 'text-yellow-400' },
  connected: { icon: <Wifi size={14} />, label: '已连接', color: 'text-green-400' },
  error: { icon: <AlertTriangle size={14} />, label: '连接错误', color: 'text-red-400' },
};

export default function StatusBar() {
  const connectionStatus = useDashboardStore((s) => s.connectionStatus);
  const latency = useDashboardStore((s) => s.latency);
  const lastTimestamp = useDashboardStore((s) => s.lastTimestamp);

  const [latencyBounce, setLatencyBounce] = useState(false);
  const prevLatencyRef = useRef(0);

  useEffect(() => {
    if (latency !== prevLatencyRef.current && prevLatencyRef.current !== 0) {
      setLatencyBounce(true);
      const t = setTimeout(() => setLatencyBounce(false), 300);
      return () => clearTimeout(t);
    }
    prevLatencyRef.current = latency;
  }, [latency]);

  const status = STATUS_CONFIG[connectionStatus];
  const timeStr = lastTimestamp ? new Date(lastTimestamp).toLocaleTimeString('zh-CN') : '--:--:--';

  return (
    <div className="h-10 border-t border-cyber-cyan/10 bg-cyber-bg/80 backdrop-blur-md flex items-center px-4 gap-6 text-xs font-mono">
      <div className="flex items-center gap-2">
        {status.icon}
        <span className={status.color}>{status.label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">延迟:</span>
        <span
          className={`text-cyber-cyan tabular-nums inline-block transition-transform duration-200 ${
            latencyBounce ? 'scale-125' : 'scale-100'
          }`}
        >
          {latency > 0 ? `${latency}ms` : '--'}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">最近数据:</span>
        <span className="text-cyber-magenta tabular-nums">{timeStr}</span>
      </div>
    </div>
  );
}
