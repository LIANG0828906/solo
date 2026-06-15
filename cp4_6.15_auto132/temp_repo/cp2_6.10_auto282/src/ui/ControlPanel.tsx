import { RotateCcw, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { NeonButton } from './NeonButton';
import { useGameStore } from '@/store/useGameStore';

export const ControlPanel = () => {
  const { isPaused, dispatch } = useGameStore();
  const [muted, setMuted] = useState(false);

  const handleReset = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      dispatch({ type: 'RESUME_GAME' });
    } else {
      dispatch({ type: 'PAUSE_GAME' });
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10">
      <div className="flex flex-col gap-3">
        <NeonButton variant="secondary" onClick={handlePauseToggle}>
          <span className="flex items-center gap-2">
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
            <span className="text-sm">{isPaused ? '继续' : '暂停'}</span>
          </span>
        </NeonButton>

        <NeonButton variant="danger" onClick={handleReset}>
          <span className="flex items-center gap-2">
            <RotateCcw size={18} />
            <span className="text-sm">重置</span>
          </span>
        </NeonButton>

        <NeonButton
          variant="secondary"
          onClick={() => setMuted(!muted)}
          className="opacity-80"
        >
          <span className="flex items-center gap-2">
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </span>
        </NeonButton>
      </div>

      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center">
            <h2
              className="text-5xl font-bold mb-6 animate-pulse"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                color: '#00e5ff',
                textShadow: '0 0 30px #00e5ff, 0 0 60px #b300ff',
              }}
            >
              游戏暂停
            </h2>
            <NeonButton variant="primary" onClick={handlePauseToggle}>
              <span className="text-lg">点击继续游戏</span>
            </NeonButton>
          </div>
        </div>
      )}
    </div>
  );
};
