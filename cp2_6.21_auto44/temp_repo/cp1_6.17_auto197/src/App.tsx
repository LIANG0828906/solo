import { useTimelineStore } from './store';
import Timeline from './Timeline';
import FilterPanel from './FilterPanel';
import Card from './Card';
import { CreativeCard } from './types';
import { useEffect } from 'react';

function App() {
  const selectedCard = useTimelineStore((state) => state.selectedCard as CreativeCard | null);
  const setSelectedCard = useTimelineStore((state) => state.setSelectedCard);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCard) {
        setSelectedCard(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCard, setSelectedCard]);

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '40px 20px 80px',
        position: 'relative',
      }}
    >
      <header
        style={{
          textAlign: 'center',
          marginBottom: '60px',
          paddingTop: '20px',
        }}
      >
        <h1
          style={{
            fontSize: '42px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #E0AAFF 0%, #C77DFF 50%, #9D4EDD 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '12px',
            letterSpacing: '-0.5px',
          }}
        >
          创作历程时间轴
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: '#C77DFF',
            opacity: 0.8,
            maxWidth: '520px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          记录每一次灵感迸发的瞬间，见证成长路上的点滴足迹
        </p>
      </header>

      <Timeline />
      <FilterPanel />

      {selectedCard && (
        <Card.Modal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}

export default App;
