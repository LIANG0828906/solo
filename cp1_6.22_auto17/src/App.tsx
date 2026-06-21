import { useMemo } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { DEFAULT_CARDS } from '@/types';
import DashboardCard from '@/components/DashboardCard';
import StatusBar from '@/components/StatusBar';
import TopMenu from '@/components/TopMenu';
import WsConnector from '@/components/WsConnector';

function SidebarMetric({ cardId, type, title, unit }: { cardId: string; type: string; title: string; unit: string }) {
  const metrics = useDashboardStore((s) => s.metrics);
  const valMap: Record<string, number | undefined> = {
    cpu: metrics?.cpu,
    memory: metrics?.memory,
    network: metrics?.networkIn,
    disk: metrics?.diskRead,
  };
  const v = valMap[type];
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-cyber-cyan/5 border border-cyber-cyan/10">
      <span className="text-xs text-cyber-cyan/60">{title}</span>
      <span className="text-xs text-cyber-cyan font-bold tabular-nums">
        {v != null ? `${v.toFixed(1)}${unit}` : '--'}
      </span>
    </div>
  );
}

export default function App() {
  const cardOrder = useDashboardStore((s) => s.cardOrder);
  const scanEffect = useDashboardStore((s) => s.scanEffect);
  const showDownloadToast = useDashboardStore((s) => s.showDownloadToast);
  const pulseEffect = useDashboardStore((s) => s.pulseEffect);

  const cardMap = useMemo(() => {
    return new Map(DEFAULT_CARDS.map(c => [c.id, c]));
  }, []);

  const orderedCards = cardOrder.map(id => cardMap.get(id)).filter(Boolean);

  return (
    <div className="h-screen w-screen flex flex-col bg-cyber-bg font-mono text-cyber-cyan overflow-hidden">
      {pulseEffect && <div className="fixed inset-0 pointer-events-none z-50 animate-pulse-global" />}

      {scanEffect && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute inset-0 bg-cyber-cyan/5" />
          <div className="absolute left-0 right-0 h-2 bg-cyber-cyan/60 shadow-[0_0_40px_rgba(0,240,255,0.8)] animate-scan-line" />
        </div>
      )}

      <header className="h-12 border-b border-cyber-cyan/10 bg-cyber-bg/80 backdrop-blur-md flex items-center px-4 gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyber-cyan shadow-[0_0_6px_rgba(0,240,255,0.6)]" />
          <span className="text-sm font-semibold tracking-wider text-cyber-cyan/90">CYBERPUNK</span>
          <span className="text-sm font-light tracking-wider text-cyber-magenta/70">DASHBOARD</span>
        </div>
        <div className="w-px h-6 bg-cyber-cyan/10" />
        <WsConnector />
        <div className="flex-1" />
        <TopMenu />
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-[240px] border-r border-cyber-cyan/10 bg-cyber-bg/40 p-4 hidden lg:block shrink-0">
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-cyber-cyan/40 mb-3">系统指标</div>
            {orderedCards.map((card) => (
              <SidebarMetric
                key={card!.id}
                cardId={card!.id}
                type={card!.type}
                title={card!.title}
                unit={card!.unit}
              />
            ))}
            <div className="pt-4 mt-4 border-t border-cyber-cyan/10">
              <div className="text-[10px] uppercase tracking-widest text-cyber-cyan/40 mb-3">快捷操作</div>
              <div className="text-xs text-cyber-cyan/40 leading-relaxed">
                拖拽卡片交换位置<br />
                点击箭头收起/展开<br />
                支持实时数据监控
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 overflow-auto">
          <div
            id="dashboard-grid"
            className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min"
          >
            {orderedCards.map((card, index) => (
              <DashboardCard key={card!.id} card={card!} index={index} />
            ))}
          </div>
        </main>
      </div>

      <StatusBar />

      {showDownloadToast && (
        <div className="fixed bottom-14 right-4 z-50 animate-slide-in-right">
          <div className="px-4 py-3 rounded-lg bg-green-500/20 border border-green-400/40 text-green-400 text-xs font-mono backdrop-blur-md shadow-[0_0_20px_rgba(0,255,100,0.15)]">
            截图已生成并开始下载
          </div>
        </div>
      )}
    </div>
  );
}
