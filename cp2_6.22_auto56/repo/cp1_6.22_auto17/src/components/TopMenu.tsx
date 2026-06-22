import { useCallback } from 'react';
import { Trash2, LayoutGrid, Download } from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { captureDashboard, downloadScreenshot } from '@/utils/screenshot';

export default function TopMenu() {
  const clearData = useDashboardStore((s) => s.clearData);
  const resetLayout = useDashboardStore((s) => s.resetLayout);
  const triggerExplosion = useDashboardStore((s) => s.triggerExplosion);
  const triggerBounce = useDashboardStore((s) => s.triggerBounce);
  const triggerScan = useDashboardStore((s) => s.triggerScan);
  const setShowDownloadToast = useDashboardStore((s) => s.setShowDownloadToast);
  const explosionEffect = useDashboardStore((s) => s.explosionEffect);
  const bounceEffect = useDashboardStore((s) => s.bounceEffect);
  const scanEffect = useDashboardStore((s) => s.scanEffect);

  const handleClear = useCallback(() => {
    triggerExplosion();
    setTimeout(() => {
      clearData();
      useDashboardStore.setState({ explosionEffect: false });
    }, 500);
  }, [clearData, triggerExplosion]);

  const handleReset = useCallback(() => {
    triggerBounce();
    setTimeout(() => {
      resetLayout();
      useDashboardStore.setState({ bounceEffect: false });
    }, 600);
  }, [resetLayout, triggerBounce]);

  const handleExport = useCallback(async () => {
    triggerScan();
    setTimeout(async () => {
      const dataUrl = await captureDashboard();
      useDashboardStore.setState({ scanEffect: false });
      if (dataUrl) {
        downloadScreenshot(dataUrl);
        setShowDownloadToast(true);
        setTimeout(() => setShowDownloadToast(false), 3000);
      }
    }, 800);
  }, [triggerScan, setShowDownloadToast]);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClear}
        className="cyber-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-cyber-cyan border border-cyber-cyan/30 hover:border-cyber-cyan/60 bg-cyber-cyan/5 hover:bg-cyber-cyan/10 transition-all duration-200 hover:scale-105 relative overflow-hidden btn-shimmer"
      >
        <Trash2 size={13} />
        <span>清空数据</span>
        {explosionEffect && <span className="absolute inset-0 animate-explode-ring" />}
      </button>
      <button
        onClick={handleReset}
        className={`cyber-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-cyber-magenta border border-cyber-magenta/30 hover:border-cyber-magenta/60 bg-cyber-magenta/5 hover:bg-cyber-magenta/10 transition-all duration-200 hover:scale-105 relative overflow-hidden btn-shimmer ${bounceEffect ? 'animate-bounce-in' : ''}`}
      >
        <LayoutGrid size={13} />
        <span>重置布局</span>
      </button>
      <button
        onClick={handleExport}
        className="cyber-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-green-400 border border-green-400/30 hover:border-green-400/60 bg-green-400/5 hover:bg-green-400/10 transition-all duration-200 hover:scale-105 relative overflow-hidden btn-shimmer"
      >
        <Download size={13} />
        <span>导出报告</span>
      </button>
    </div>
  );
}
