import { useState } from 'react';
import type { HSLColor } from '@/modules/colorEngine/colorSpace';
import { useGameStore } from '@/store/gameStore';
import ColorPicker from '@/modules/ui/ColorPicker';
import ColorBlock from '@/modules/ui/ColorBlock';
import StatsPanel from '@/modules/ui/StatsPanel';

export default function App() {
  const [currentColor, setCurrentColor] = useState<HSLColor>({ h: 0, s: 50, l: 50 });
  const targetBlocks = useGameStore(s => s.targetBlocks);
  const matchResults = useGameStore(s => s.matchResults);
  const currentBlockIndex = useGameStore(s => s.currentBlockIndex);

  return (
    <div style={{ minHeight: '100vh', background: '#FAF0E6', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        height: 80,
        background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 12px #00000015',
        flexShrink: 0,
      }}>
        <h1 style={{
          color: '#FFFFFF',
          fontSize: 32,
          fontWeight: 300,
          letterSpacing: 4,
        }}>
          色彩记忆拼图
        </h1>
      </header>

      {/* Animated divider */}
      <div className="divider-gradient" style={{ width: '100%', height: 2, flexShrink: 0 }} />

      {/* Main content */}
      <main style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 32,
        gap: 32,
        flexWrap: 'wrap',
      }}>
        {/* Puzzle area */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}>
          <div style={{ fontSize: 14, color: '#888' }}>
            {currentBlockIndex < targetBlocks.length
              ? `匹配第 ${currentBlockIndex + 1} / ${targetBlocks.length} 个色块`
              : '今日匹配已完成 🎉'}
          </div>
          <div style={{
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {targetBlocks.map((block, i) => {
              const result = matchResults.find(r => r.blockId === block.id);
              return (
                <ColorBlock
                  key={block.id}
                  targetColor={block.color}
                  userColor={result?.userColor ?? null}
                  deltaE={result?.deltaE ?? null}
                  feedback={result?.feedback ?? null}
                  index={i}
                  isActive={i === currentBlockIndex}
                />
              );
            })}
          </div>
        </div>

        {/* Palette */}
        <ColorPicker
          onColorChange={setCurrentColor}
          currentColor={currentColor}
        />
      </main>

      {/* Stats */}
      <footer style={{ padding: '0 32px 24px' }}>
        <StatsPanel />
      </footer>
    </div>
  );
}
