import { useEffect } from 'react';
import { Plus, Hexagon, Network, Sparkles } from 'lucide-react';
import { useHiveStore } from '@/store';
import { CardGrid } from '@/components/CardGrid';
import { CardPanel } from '@/components/CardPanel';
import { RelationGraph } from '@/components/RelationGraph';
import type { Card, TagInfo } from '@/types';

function NavHexDivider() {
  return (
    <svg width="32" height="28" viewBox="0 0 32 28" style={{ opacity: 0.35 }}>
      <polygon
        points="16,2 28,9 28,19 16,26 4,19 4,9"
        fill="none"
        stroke="#A1887F"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

function ViewToggle() {
  const { viewMode, setViewMode } = useHiveStore();
  const btn = (active: boolean) => ({
    padding: '8px 14px',
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 13,
    fontWeight: 500,
    fontFamily: '"Noto Sans SC", sans-serif',
    transition: 'all 0.25s ease',
    ...(active
      ? {
          background: 'linear-gradient(135deg, #F0B27A 0%, #FAD7A1 100%)',
          color: '#3E2723',
          boxShadow: '0 6px 16px -6px rgba(230,126,34,0.5)',
        }
      : {
          background: 'rgba(139,69,19,0.08)',
          color: '#6D4C41',
        }),
  });
  return (
    <div
      className="flex gap-1.5 p-1 rounded-full"
      style={{ background: 'rgba(139,69,19,0.05)' }}
    >
      <button
        style={btn(viewMode === 'honeycomb')}
        onClick={() => setViewMode('honeycomb')}
      >
        <Hexagon size={14} />
        蜂巢网格
      </button>
      <button
        style={btn(viewMode === 'graph')}
        onClick={() => setViewMode('graph')}
      >
        <Network size={14} />
        关系网络
      </button>
    </div>
  );
}

function TagsBar({ tags }: { tags: TagInfo[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto" style={{ maxWidth: 280 }}>
      {tags.slice(0, 6).map(t => (
        <span
          key={t.name}
          className="whitespace-nowrap flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
          style={{
            background: `${t.color}15`,
            color: t.color,
            border: `1px solid ${t.color}30`,
            fontFamily: '"Noto Sans SC", sans-serif',
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: t.color,
          }} />
          {t.name}
          <span style={{ opacity: 0.6 }}>·{t.count}</span>
        </span>
      ))}
    </div>
  );
}

export default function App() {
  const {
    viewMode,
    openNewPanel,
    setCards,
    setGraphData,
    setTags,
    cards,
    setLoading,
  } = useHiveStore();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cardsRes, tagsRes, relRes] = await Promise.all([
        fetch('/api/cards'),
        fetch('/api/tags'),
        fetch('/api/relations'),
      ]);
      const cardsData = await cardsRes.json();
      const tagsData = await tagsRes.json();
      const relData = await relRes.json();
      setCards(cardsData.cards as Card[]);
      setTags(tagsData.tags as TagInfo[]);
      const counts: Record<string, number> = {};
      (relData.cardRelationCounts as Array<{ id: string; count: number }>).forEach(
        c => { counts[c.id] = c.count; }
      );
      setGraphData(relData.graph, counts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const refreshRelations = async () => {
    try {
      const res = await fetch('/api/relations');
      const data = await res.json();
      const counts: Record<string, number> = {};
      (data.cardRelationCounts as Array<{ id: string; count: number }>).forEach(
        c => { counts[c.id] = c.count; }
      );
      setGraphData(data.graph, counts);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const t = setTimeout(refreshRelations, 400);
    return () => clearTimeout(t);
  }, [cards.length]);

  return (
    <div
      className="w-screen h-screen overflow-hidden flex flex-col"
      style={{
        background: viewMode === 'honeycomb' ? '#FFF8E7' : '#0D1B2A',
        fontFamily: '"Noto Sans SC", sans-serif',
        transition: 'background 0.5s ease',
      }}
    >
      <header
        className="relative z-20 flex items-center justify-between px-5 md:px-8 py-3.5 border-b"
        style={{
          background: viewMode === 'honeycomb'
            ? 'linear-gradient(180deg, rgba(255,248,231,0.98) 0%, rgba(255,248,231,0.9) 100%)'
            : 'linear-gradient(180deg, rgba(13,27,42,0.98) 0%, rgba(13,27,42,0.85) 100%)',
          borderColor: viewMode === 'honeycomb' ? 'rgba(224,213,193,0.7)' : 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center"
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'linear-gradient(135deg, #E67E22 0%, #F39C12 100%)',
                boxShadow: '0 6px 16px -4px rgba(230,126,34,0.55)',
              }}
            >
              <Hexagon size={20} style={{ color: '#FFF', strokeWidth: 2.5 }} />
            </div>
            <div>
              <div
                className="text-lg font-bold leading-tight"
                style={{
                  fontFamily: '"Noto Serif SC", serif',
                  color: viewMode === 'honeycomb' ? '#3E2723' : '#FFE082',
                }}
              >
                灵感蜂巢
              </div>
              <div
                className="text-[10px] tracking-[0.15em] uppercase leading-tight"
                style={{ color: viewMode === 'honeycomb' ? '#A1887F' : '#78909C' }}
              >
                Inspiration Hive
              </div>
            </div>
          </div>
          <NavHexDivider />
          {viewMode === 'honeycomb' && (
            <>
              <div className="hidden md:flex items-center gap-2">
                <Sparkles size={14} style={{ color: '#E67E22' }} />
                <span
                  className="text-sm"
                  style={{ color: '#6D4C41', fontFamily: '"Noto Serif SC", serif' }}
                >
                  共 <strong style={{ color: '#E67E22' }}>{cards.length}</strong> 份灵感在蜂巢中
                </span>
              </div>
            </>
          )}
        </div>

        <div className="hidden lg:block flex-1 px-8">
          {viewMode === 'honeycomb' && <TagsBar tags={useHiveStore.getState().tags} />}
        </div>

        <div className="flex items-center gap-3">
          <ViewToggle />
          <button
            onClick={openNewPanel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:scale-[0.97] active:scale-[0.94]"
            style={{
              background: 'linear-gradient(135deg, #E67E22 0%, #F39C12 100%)',
              boxShadow: '0 10px 24px -8px rgba(230,126,34,0.7)',
              fontFamily: '"Noto Sans SC", sans-serif',
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">新建灵感</span>
          </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {viewMode === 'honeycomb' ? <CardGrid /> : <RelationGraph />}
      </main>

      <CardPanel />
    </div>
  );
}
