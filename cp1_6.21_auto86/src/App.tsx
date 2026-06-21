import React from 'react';
import ChordEditor from './ChordEditor';
import RhythmViewer from './RhythmViewer';
import SpectrumVisualizer from './SpectrumVisualizer';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { useStore } from './store/useStore';
import { Play, Pause, RotateCcw, Music2 } from 'lucide-react';

const App: React.FC = () => {
  const { togglePlayback, isPlaying } = useAudioPlayback();
  const { chordSequence, reset } = useStore();

  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <Music2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] font-display">
              ChordViz
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              和弦可视化学习工具
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all"
          >
            <RotateCcw size={18} />
            <span className="text-sm font-medium">重置</span>
          </button>

          <button
            onClick={togglePlayback}
            disabled={chordSequence.length === 0}
            className={`flex items-center justify-center w-14 h-14 rounded-full text-white transition-all hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 ${
              isPlaying ? 'animate-breath' : ''
            }`}
            style={{
              width: '56px',
              height: '56px',
              background: isPlaying
                ? 'linear-gradient(135deg, #E74C3C 0%, #F39C12 100%)'
                : 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
              boxShadow: isPlaying
                ? '0 0 30px rgba(231, 76, 60, 0.5)'
                : '0 4px 15px rgba(102, 126, 234, 0.4)',
              transitionDuration: '300ms',
            }}
          >
            {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div
          className="w-full lg:w-[35%] border-r border-[var(--border-color)] overflow-hidden flex flex-col"
          style={{ minHeight: 0 }}
        >
          <ChordEditor />
        </div>

        <div
          className="w-full lg:w-[65%] overflow-hidden flex flex-col"
          style={{ minHeight: 0 }}
        >
          <div className="flex-1 overflow-hidden">
            <SpectrumVisualizer />
          </div>
          <div className="border-t border-[var(--border-color)]">
            <RhythmViewer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
