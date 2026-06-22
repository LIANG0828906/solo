import { useEffect, useState, useCallback } from 'react';
import { tripApi, Activity, SlideData } from '@/utils/api';
import MapView from '@/components/MapView';
import Timeline from '@/components/Timeline';
import SlideShow from '@/components/SlideShow';
import { Sparkles } from 'lucide-react';

type ViewMode = 'edit' | 'generate';

export default function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [slideData, setSlideData] = useState<SlideData[]>([]);
  const [mode, setMode] = useState<ViewMode>('edit');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tripApi
      .getActivities()
      .then(setActivities)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAddActivity = useCallback(
    async (payload: { date: string; city: string; summary: string; imageUrl?: string }) => {
      const newItem = await tripApi.addActivity(payload);
      setActivities(prev => [...prev, newItem].sort((a, b) => a.order - b.order));
    },
    [],
  );

  const handleReorder = useCallback(async (next: Activity[]) => {
    setActivities(next);
    const orders = next.map((a, i) => ({ id: a.id, order: i }));
    try {
      await tripApi.updateOrders(orders);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await tripApi.deleteActivity(id);
    setActivities(prev => prev.filter(a => a.id !== id).map((a, i) => ({ ...a, order: i })));
  }, []);

  const handleGenerate = useCallback(async () => {
    try {
      const slides = await tripApi.generateTrip();
      setSlideData(slides);
      setMode('generate');
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleExitSlide = useCallback(() => {
    setMode('edit');
    setSlideData([]);
  }, []);

  if (mode === 'generate' && slideData.length > 0) {
    return <SlideShow slides={slideData} onExit={handleExitSlide} />;
  }

  return (
    <div
      className="h-full w-full flex flex-col"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      <header
        className="flex items-center justify-between px-6 h-16 border-b flex-shrink-0"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#0000000D' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg,#FF7043,#FFA726)' }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-semibold" style={{ color: '#333' }}>
              旅行足迹规划器
            </div>
            <div className="text-xs" style={{ color: '#9E9E9E' }}>
              记录旅程，重温回忆
            </div>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={activities.length === 0 || loading}
          className="flex items-center justify-center gap-2 text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
          style={{
            height: 40,
            width: 120,
            borderRadius: 20,
            background: 'linear-gradient(135deg,#FF7043,#FFA726)',
            transition: 'filter 0.25s ease',
          }}
        >
          <Sparkles size={16} />
          <span>生成回忆</span>
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <section
          className="border-r relative flex-shrink-0"
          style={{ width: '35%', borderColor: '#0000000D', minWidth: 0 }}
        >
          <MapView activities={activities} />
        </section>

        <section className="flex-1 relative" style={{ width: '60%', minWidth: 0 }}>
          {loading ? (
            <div className="h-full w-full flex items-center justify-center text-base" style={{ color: '#9E9E9E' }}>
              加载中...
            </div>
          ) : (
            <Timeline
              activities={activities}
              onAdd={handleAddActivity}
              onReorder={handleReorder}
              onDelete={handleDelete}
            />
          )}
        </section>
      </main>
    </div>
  );
}
