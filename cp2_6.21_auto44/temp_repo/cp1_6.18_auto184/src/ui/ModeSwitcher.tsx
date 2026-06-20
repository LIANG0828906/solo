import React from 'react';
import { Cylinder, Sparkles, Layers } from 'lucide-react';
import { useAudioStore } from '../store/audioStore';
import { VisualMode } from '../types';

const modes: { mode: VisualMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'wave', icon: <Cylinder size={18} />, label: '波形柱体' },
  { mode: 'particle', icon: <Sparkles size={18} />, label: '粒子星云' },
  { mode: 'hybrid', icon: <Layers size={18} />, label: '混合模式' },
];

export const ModeSwitcher: React.FC = () => {
  const currentMode = useAudioStore((state) => state.mode);
  const setMode = useAudioStore((state) => state.setMode);

  const handleModeChange = (mode: VisualMode) => {
    setMode(mode);
    triggerHaptic();
  };

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  };

  return (
    <div className="mode-switcher">
      {modes.map(({ mode, icon, label }) => (
        <button
          key={mode}
          className={`mode-btn ${currentMode === mode ? 'active' : ''}`}
          onClick={() => handleModeChange(mode)}
          title={label}
        >
          {icon}
        </button>
      ))}
    </div>
  );
};
