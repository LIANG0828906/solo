import { useEffect, useCallback, useState } from 'react';
import { useTimelineStore } from './store/useTimelineStore';
import TimelineCanvas from './components/TimelineCanvas';
import ThemePanel from './components/ThemePanel';
import NodeDetail from './components/NodeDetail';
import NodePreview from './components/NodePreview';
import ViewportInfo from './components/ViewportInfo';
import { TimelineNode } from './modules/timeline/TimelineEngine';

export default function App() {
  const [, setRenderTick] = useState(0);
  const theme = useTimelineStore(s => s.theme);
  const initEngine = useTimelineStore(s => s.initEngine);
  const setTheme = useTimelineStore(s => s.setTheme);
  const timelines = useTimelineStore(s => s.timelines);

  useEffect(() => {
    initEngine();
    document.documentElement.setAttribute('data-theme', theme);
    setTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNodePreview = useCallback(
    (_node: TimelineNode | null, _x: number, _y: number) => {
      setRenderTick(t => (t + 1) % 1000);
    },
    []
  );

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <TimelineCanvas onNodePreview={handleNodePreview} />

      {timelines.length === 0 && (
        <div className="empty-state">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <div className="empty-title">开始创建数据叙事</div>
          <div className="empty-hint">点击右上角设置图标 → 添加时间线</div>
        </div>
      )}

      <ViewportInfo />
      <NodePreview />
      <NodeDetail />
      <ThemePanel />
    </div>
  );
}
