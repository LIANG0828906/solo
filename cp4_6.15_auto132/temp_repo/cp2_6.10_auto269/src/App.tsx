import React from 'react';
import { CloudScene } from '@/scene/CloudScene';
import { ControlPanel } from '@/ui/ControlPanel';
import { ScorePanel } from '@/ui/ScorePanel';

const App: React.FC = () => {
  return (
    <div className="w-full h-screen relative overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-white">
      <div className="absolute inset-0">
        <CloudScene />
      </div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-center">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg tracking-wider">
          空灵编钟
        </h1>
        <p className="text-white/80 mt-2 text-sm tracking-widest">
          云端之上 · 天籁之音
        </p>
      </div>

      <ControlPanel />
      <ScorePanel />

      <div className="absolute top-6 right-6 z-10">
        <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 text-xs text-white/80 border border-white/30">
          🖱️ 拖拽旋转视角 · 滚轮缩放
        </div>
      </div>
    </div>
  );
};

export default App;
