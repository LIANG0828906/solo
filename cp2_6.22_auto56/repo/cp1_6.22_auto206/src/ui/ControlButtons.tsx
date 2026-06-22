import React from 'react';
import { RotateCcw, Camera, Grid3X3, Play, Pause } from 'lucide-react';
import { useParticleStore } from '../store/useParticleStore';
import type { RenderMode } from '../store/useParticleStore';

interface ControlButtonsProps {
  onResetCamera: () => void;
  onScreenshot: () => void;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
  onResetCamera,
  onScreenshot,
}) => {
  const renderMode = useParticleStore((state) => state.renderMode);
  const toggleRenderMode = useParticleStore((state) => state.toggleRenderMode);
  const autoRotate = useParticleStore((state) => state.autoRotate);
  const toggleAutoRotate = useParticleStore((state) => state.toggleAutoRotate);

  const buttons = [
    {
      icon: <RotateCcw size={18} />,
      label: '重置视角',
      onClick: onResetCamera,
    },
    {
      icon: <Camera size={18} />,
      label: '截图保存',
      onClick: onScreenshot,
    },
    {
      icon: <Grid3X3 size={18} />,
      label: renderMode === 'points' ? '点阵模式' : '网格模式',
      onClick: toggleRenderMode,
      active: renderMode === 'mesh',
    },
    {
      icon: autoRotate ? <Pause size={18} /> : <Play size={18} />,
      label: autoRotate ? '停止旋转' : '自动旋转',
      onClick: toggleAutoRotate,
      active: autoRotate,
    },
  ];

  return (
    <div className="absolute top-6 right-6 glass-control rounded-xl p-2 flex gap-1 z-10">
      {buttons.map((btn, index) => (
        <button
          key={index}
          onClick={btn.onClick}
          className={`control-button flex flex-col items-center justify-center w-14 h-14 rounded-lg text-slate-400 ${
            btn.active ? 'bg-cyan-500/20 text-cyan-400' : ''
          }`}
          title={btn.label}
        >
          {btn.icon}
          <span className="text-[10px] mt-1">{btn.label}</span>
        </button>
      ))}
    </div>
  );
};
