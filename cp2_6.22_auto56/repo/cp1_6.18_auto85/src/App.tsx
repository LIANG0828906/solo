import { useEffect } from 'react';
import { PianoBoard } from './components/PianoBoard';
import { ScoreView } from './components/ScoreView';
import { StatsPanel } from './components/StatsPanel';
import { audioEngine } from './audio/audioEngine';

export default function App() {
  useEffect(() => {
    const initAudio = () => {
      audioEngine.init().catch((e) => console.warn('Audio init:', e));
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, []);

  return (
    <div className="min-h-screen bg-bgPrimary text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <header className="text-center py-4">
          <h1
            className="text-4xl md:text-5xl font-bold tracking-wider"
            style={{
              color: '#4ECDC4',
              textShadow: '0 0 20px rgba(78, 205, 196, 0.7), 0 0 40px rgba(78, 205, 196, 0.3)',
            }}
          >
            🎹 虚拟琴房
          </h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base">
            Virtual Piano Studio — 交互式钢琴学习与练习平台
          </p>
        </header>

        <ScoreView />

        <StatsPanel />

        <div className="pt-2">
          <div className="text-gray-400 text-sm mb-2 text-center">
            💡 点击任意位置启用音频，然后点击琴键开始弹奏
          </div>
          <PianoBoard />
        </div>

        <footer className="text-center text-gray-500 text-xs pt-4 pb-8">
          支持鼠标点击与触摸操作 · 使用 Tone.js 音频合成 · Zustand 状态管理
        </footer>
      </div>
    </div>
  );
}
