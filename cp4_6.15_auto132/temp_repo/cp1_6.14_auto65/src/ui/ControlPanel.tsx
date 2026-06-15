import { useState } from 'react';
import { Plus, RotateCcw, Zap, Bomb, Droplets, Video, Play, Square } from 'lucide-react';
import { AddObjectForm } from './AddObjectForm';
import { usePhysicsStore } from '@/store/usePhysicsStore';
import type { EffectState } from '@/types';

const effectButtons: {
  key: keyof EffectState;
  label: string;
  icon: React.ReactNode;
  activeColor: string;
  description: string;
}[] = [
  {
    key: 'collision',
    label: '碰撞',
    icon: <Zap size={18} />,
    activeColor: 'text-yellow-400',
    description: '碰撞时产生粒子碎屑',
  },
  {
    key: 'explosion',
    label: '爆炸',
    icon: <Bomb size={18} />,
    activeColor: 'text-orange-400',
    description: '点击场景中心触发爆炸',
  },
  {
    key: 'fluid',
    label: '流体',
    icon: <Droplets size={18} />,
    activeColor: 'text-cyan-400',
    description: '从上方喷射流体粒子',
  },
];

export function ControlPanel() {
  const [showAddForm, setShowAddForm] = useState(false);
  const effectState = usePhysicsStore((s) => s.effectState);
  const toggleEffect = usePhysicsStore((s) => s.toggleEffect);
  const resetScene = usePhysicsStore((s) => s.resetScene);
  const triggerExplosion = usePhysicsStore((s) => s.triggerExplosion);
  const isRecording = usePhysicsStore((s) => s.isRecording);
  const isReplaying = usePhysicsStore((s) => s.isReplaying);
  const startRecording = usePhysicsStore((s) => s.startRecording);
  const stopRecording = usePhysicsStore((s) => s.stopRecording);
  const startReplay = usePhysicsStore((s) => s.startReplay);
  const stopReplay = usePhysicsStore((s) => s.stopReplay);
  const recordingFrames = usePhysicsStore((s) => s.recordingFrames);

  const handleExplosionClick = () => {
    if (effectState.explosion) {
      triggerExplosion([0, 1, 0], 50);
    }
  };

  const handleToggleEffect = (key: keyof EffectState) => {
    toggleEffect(key);
    if (key === 'explosion' && !effectState.explosion) {
      setTimeout(() => triggerExplosion([0, 1, 0], 50), 100);
    }
  };

  return (
    <>
      {showAddForm && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-96 glass-panel rounded-2xl shadow-2xl border border-cyan-500/20 z-20">
          <AddObjectForm onClose={() => setShowAddForm(false)} />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 glass-panel border-t border-cyan-500/20 px-6 py-4 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pr-4 border-r border-cyan-500/20">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/30">
                <Zap size={20} className="text-cyan-400" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-sm leading-tight">
                  3D物理沙盒
                </h1>
                <p className="text-cyan-400/60 text-[10px] font-mono-sans">
                  Physics Sandbox v1.0
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`glass-button px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
                showAddForm ? 'active' : ''
              }`}
            >
              <Plus size={18} className={showAddForm ? 'rotate-45 transition-transform' : ''} />
              <span>添加物体</span>
            </button>

            <button
              onClick={resetScene}
              className="glass-button px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-red-400 transition-all group"
            >
              <RotateCcw size={18} className="group-hover:rotate-[-180deg] transition-transform duration-500" />
              <span>重置场景</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-cyan-300/60 pr-3 border-r border-cyan-500/20">
              物理效果
            </span>

            <div className="flex gap-1.5">
              {effectButtons.map(({ key, label, icon, activeColor, description }) => {
                const isActive = effectState[key];
                return (
                  <button
                    key={key as string}
                    onClick={() => handleToggleEffect(key)}
                    onMouseDown={key === 'explosion' ? handleExplosionClick : undefined}
                    className={`glass-button px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs transition-all relative ${
                      isActive ? `active ${activeColor}` : 'text-gray-400'
                    }`}
                    title={description}
                  >
                    {icon}
                    <span>{label}</span>
                    {key === 'explosion' && isActive && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-cyan-300/60 pr-3 border-r border-cyan-500/20">
              录制回放
            </span>

            {isReplaying ? (
              <button
                onClick={stopReplay}
                className="glass-button px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs active text-red-400"
              >
                <Square size={16} fill="currentColor" />
                <span>停止回放</span>
              </button>
            ) : isRecording ? (
              <>
                <div className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-400">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-mono-sans">
                    {Math.min(30, Math.floor(recordingFrames.length / 60))}s
                  </span>
                </div>
                <button
                  onClick={stopRecording}
                  className="glass-button px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs active text-red-400"
                >
                  <Square size={16} fill="currentColor" />
                  <span>停止录制</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startRecording}
                  className="glass-button px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs text-gray-300 hover:text-red-400"
                >
                  <Video size={16} />
                  <span>开始录制</span>
                </button>
                <button
                  onClick={startReplay}
                  disabled={recordingFrames.length === 0}
                  className={`glass-button px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs transition-all ${
                    recordingFrames.length > 0
                      ? 'text-gray-300 hover:text-green-400'
                      : 'opacity-40 cursor-not-allowed text-gray-600'
                  }`}
                >
                  <Play size={16} />
                  <span>回放</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
