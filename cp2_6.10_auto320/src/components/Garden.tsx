import React, { useState } from 'react';
import { Calendar, Leaf, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Plot } from './Plot';
import { BlindBoxButton, BoxResultModal } from './BlindBox';
import { ParticleSystem } from './ParticleSystem';
import { useGardenStore } from '@/store/gardenStore';
import { SEASON_GRADIENTS, SEASON_LABELS } from '@/types';
import { DAILY_BOX_LIMIT, SEASONS } from '@/utils/constants';
import { playSound } from '@/utils/animations';
import type { Season } from '@/types';

export const Garden: React.FC = () => {
  const navigate = useNavigate();
  const {
    gameState,
    showBoxModal,
    currentBoxResult,
    closeBoxModal,
    error,
    reportHistory,
  } = useGardenStore();

  const [explosion, setExplosion] = useState<{ x: number; y: number; color: string } | null>(null);

  const remainingBoxes = DAILY_BOX_LIMIT - gameState.dailyBoxesUsed;
  const gradientClass = SEASON_GRADIENTS[gameState.currentSeason];

  const handleBoxClick = (season: Season, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    setExplosion({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      color: randomColor,
    });

    playSound('click');

    setTimeout(() => setExplosion(null), 100);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientClass} transition-all duration-1000`}>
      <ParticleSystem
        weatherEvent={gameState.weatherEvent}
        onExplosion={explosion}
      />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
            top: '-10%',
            right: '-10%',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)',
            bottom: '20%',
            left: '-5%',
            animation: 'float 10s ease-in-out infinite reverse',
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2d5016] mb-2 flex items-center justify-center gap-3">
            <Leaf className="text-[#2d5016]" />
            云种盲盒·时令花园
            <Leaf className="text-[#2d5016]" />
          </h1>
          <p className="text-[#2d5016]/70 text-lg">
            今日季节：{SEASON_LABELS[gameState.currentSeason]}
          </p>
        </header>

        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white/70 backdrop-blur rounded-full shadow-lg">
            <Sparkles size={20} className="text-amber-500" />
            <span className="font-bold text-[#2d5016]">
              已收集 {gameState.collectedFlowers.length} 种
            </span>
          </div>

          <div className="flex items-center gap-2 px-5 py-2.5 bg-white/70 backdrop-blur rounded-full shadow-lg">
            <span className="font-bold text-[#2d5016]">
              今日剩余：{remainingBoxes} / {DAILY_BOX_LIMIT}
            </span>
          </div>

          <button
            onClick={() => navigate('/report')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2d5016] to-[#4a7c23] text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <Calendar size={20} />
            <span className="font-bold">时令周报</span>
            {reportHistory.length > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {reportHistory.length}
              </span>
            )}
          </button>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-100/80 backdrop-blur rounded-2xl text-red-700 text-center font-medium animate-shake">
            {error}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#2d5016] mb-4 text-center flex items-center justify-center gap-2">
            🌱 我的花园
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {gameState.gardenPlots.map((plot, index) => (
              <Plot key={index} flower={plot} index={index} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#2d5016] mb-4 text-center flex items-center justify-center gap-2">
            🎁 选择季节盲盒
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {SEASONS.map((season) => (
              <div
                key={season}
                onClick={(e) => handleBoxClick(season, e)}
              >
                <BlindBoxButton
                  season={season}
                  disabled={remainingBoxes <= 0}
                />
              </div>
            ))}
          </div>
        </div>

        <footer className="mt-12 text-center text-[#2d5016]/50 text-sm">
          <p>🌿 每天5次机会，收集四季花卉，触发神奇天气 🌿</p>
        </footer>
      </div>

      <BoxResultModal
        isOpen={showBoxModal}
        flower={currentBoxResult}
        weatherEvent={gameState.weatherEvent}
        onClose={closeBoxModal}
      />
    </div>
  );
};
