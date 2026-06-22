import './styles.css';
import GameScene from './components/GameScene';
import CluePanel from './CluePanel';
import InventoryBar from './components/InventoryBar';

export default function App() {
  return (
    <div
      className="w-full h-full min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      }}
    >
      <h1
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-4xl md:text-5xl font-bold tracking-wider"
        style={{
          fontFamily: "'Cinzel Decorative', serif",
          color: 'var(--color-accent-gold)',
          textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
        }}
      >
        Hidden Quest
      </h1>

      <div className="w-full h-full flex items-center justify-center pt-20 pb-28">
        <GameScene />
      </div>

      <CluePanel />
      <InventoryBar />
    </div>
  );
}
