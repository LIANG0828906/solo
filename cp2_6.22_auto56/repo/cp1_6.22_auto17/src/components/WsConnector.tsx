import { useState } from 'react';
import { Plug, Loader2, X } from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function WsConnector() {
  const wsUrl = useDashboardStore((s) => s.wsUrl);
  const setWsUrl = useDashboardStore((s) => s.setWsUrl);
  const connectionStatus = useDashboardStore((s) => s.connectionStatus);
  const errorMessage = useDashboardStore((s) => s.errorMessage);
  const pulseEffect = useDashboardStore((s) => s.pulseEffect);
  const { connect, disconnect } = useWebSocket();

  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';

  const handleConnect = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect(wsUrl);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Plug size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-cyan/50" />
          <input
            type="text"
            value={wsUrl}
            onChange={(e) => setWsUrl(e.target.value)}
            placeholder="ws://localhost:3001"
            disabled={isConnected || isConnecting}
            className="w-64 h-8 pl-8 pr-3 rounded-lg bg-cyber-bg/80 border border-cyber-cyan/20 focus:border-cyber-cyan/60 text-cyber-cyan text-xs font-mono placeholder:text-cyber-cyan/30 outline-none transition-all duration-200 focus:shadow-[0_0_10px_rgba(0,240,255,0.15)] disabled:opacity-50"
          />
        </div>
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`
            h-8 px-4 rounded-lg text-xs font-mono font-medium transition-all duration-200 hover:scale-105 relative overflow-hidden btn-shimmer
            ${isConnected
              ? 'text-red-400 border border-red-400/30 hover:border-red-400/60 bg-red-400/5 hover:bg-red-400/10'
              : 'text-cyber-cyan border border-cyber-cyan/30 hover:border-cyber-cyan/60 bg-cyber-cyan/5 hover:bg-cyber-cyan/10'
            }
          `}
        >
          {isConnecting ? (
            <span className="flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              连接中
            </span>
          ) : isConnected ? (
            <span className="flex items-center gap-1.5">
              <X size={12} />
              断开
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Plug size={12} />
              连接
            </span>
          )}
        </button>
      </div>

      {pulseEffect && (
        <div className="absolute inset-0 pointer-events-none animate-pulse-green rounded-lg" />
      )}

      {errorMessage && (
        <div className="absolute top-full mt-2 left-0 animate-shake">
          <div className="px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono backdrop-blur-sm">
            {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
}
