import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useMoleculeStore } from './store/useMoleculeStore';
import { MoleculeViewer } from './components/MoleculeViewer';
import { ReactionAnimation } from './components/ReactionAnimation';
import { ControlPanel } from './components/ControlPanel';
import { InfoPanel } from './components/InfoPanel';
import { ProximityDialog } from './components/ProximityDialog';
import { Play, Pause, RotateCcw } from 'lucide-react';

const TopNav: React.FC = () => {
  const editMode = useMoleculeStore((s) => s.editMode);
  const setEditMode = useMoleculeStore((s) => s.setEditMode);
  const reactionResult = useMoleculeStore((s) => s.reactionResult);
  const animationPlaying = useMoleculeStore((s) => s.animationPlaying);
  const setAnimationPlaying = useMoleculeStore((s) => s.setAnimationPlaying);
  const setAnimationProgress = useMoleculeStore((s) => s.setAnimationProgress);
  const animationProgress = useMoleculeStore((s) => s.animationProgress);

  const modes: { value: 'atom' | 'bond' | 'select'; label: string }[] = [
    { value: 'atom', label: '原子模式' },
    { value: 'bond', label: '键模式' },
    { value: 'select', label: '选择模式' },
  ];

  return (
    <div className="top-nav">
      <div className="title">⚛ 分子工坊</div>
      <div className="mode-switcher">
        {modes.map((m) => (
          <button
            key={m.value}
            className={`mode-btn ${editMode === m.value ? 'active' : ''}`}
            onClick={() => setEditMode(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="play-controls">
        {reactionResult && (
          <>
            <button
              className="play-btn"
              onClick={() => setAnimationPlaying(!animationPlaying)}
              title={animationPlaying ? '暂停' : '播放'}
            >
              {animationPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              className="play-btn"
              onClick={() => setAnimationProgress(0)}
              title="重置"
            >
              <RotateCcw size={14} />
            </button>
            <div className="progress-bar"
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const x = e.clientX - rect.left;
                setAnimationProgress(Math.max(0, Math.min(1, x / rect.width)));
              }}
            >
              <div className="progress-fill" style={{ width: `${animationProgress * 100}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const selectedAtomId = useMoleculeStore((s) => s.selectedAtomId);
  const selectedBondId = useMoleculeStore((s) => s.selectedBondId);
  const removeAtom = useMoleculeStore((s) => s.removeAtom);
  const removeBond = useMoleculeStore((s) => s.removeBond);
  const cancelBondCreation = useMoleculeStore((s) => s.cancelBondCreation);
  const toastMessage = useMoleculeStore((s) => s.toastMessage);
  const reactionResult = useMoleculeStore((s) => s.reactionResult);
  const animationPlaying = useMoleculeStore((s) => s.animationPlaying);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAtomId) removeAtom(selectedAtomId);
        else if (selectedBondId) removeBond(selectedBondId);
      } else if (e.key === 'Escape') {
        cancelBondCreation();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedAtomId, selectedBondId, removeAtom, removeBond, cancelBondCreation]);

  const showReactionScene = reactionResult && animationPlaying;

  return (
    <div className="app-root">
      <TopNav />
      <div className="scene-container">
        <Canvas
          shadows
          camera={{ position: [0, 3, 12], fov: 55 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]}
        >
          {showReactionScene ? <ReactionAnimation /> : <MoleculeViewer />}
        </Canvas>
      </div>
      <ControlPanel />
      <InfoPanel />
      <ProximityDialog />
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
};

export default App;
