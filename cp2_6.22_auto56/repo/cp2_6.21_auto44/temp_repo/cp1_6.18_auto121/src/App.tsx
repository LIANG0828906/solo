import { useEffect } from 'react';
import { Camera, Lightbulb, RotateCcw, X } from 'lucide-react';
import { PuzzleBoard } from './components/PuzzleBoard';
import { AudioPlayer } from './components/AudioPlayer';
import { usePuzzleStore } from './store/puzzleStore';
import { getDecadeData } from './data/cityData';

export default function App() {
  const {
    progress,
    hintText,
    showClues,
    clues,
    currentDecade,
    currentAudioPath,
    phase,
    init,
    reset,
    toggleClues,
    setCurrentAudioPath,
  } = usePuzzleStore();

  useEffect(() => {
    init();
  }, [init]);

  const decadeData = getDecadeData(currentDecade);

  return (
    <div className="min-h-screen bg-[#1E1E2E] flex flex-col">
      <header
        className="h-[60px] bg-[#0F172A] flex items-center justify-between px-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <Camera size={32} color="white" />
          </div>
          <h1 className="text-white text-lg font-bold tracking-wide">
            时光拼图店
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: decadeData.color }}
            />
            <span className="text-white/70 text-sm">{decadeData.label}</span>
          </div>
          <div
            className="text-white font-semibold text-base"
            style={{
              background: `linear-gradient(90deg, #FFD700 0%, #FFD700 ${progress}%, rgba(255,255,255,0.4) ${progress}%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {progress}%
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-white/70 text-sm text-center mb-4 h-6">
            {hintText}
          </div>

          <PuzzleBoard />
        </div>

        <div className="fixed bottom-6 left-6 flex items-center gap-3 z-40">
          <button
            onClick={toggleClues}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{
              backgroundColor: '#FFD166',
              animation: 'pulse 1s ease-in-out infinite',
            }}
            aria-label="查看线索"
          >
            <Lightbulb size={24} color="#1E1E2E" fill="#1E1E2E" />
          </button>

          <AudioPlayer
            autoPlayPath={currentAudioPath}
            onAutoPlayComplete={() => setCurrentAudioPath(null)}
          />

          <button
            onClick={reset}
            className="w-12 h-12 rounded-full bg-[#3D3D5C] flex items-center justify-center text-white hover:bg-[#4D4D6C] transition-all duration-300"
            aria-label="重置拼图"
          >
            <RotateCcw size={20} />
          </button>
        </div>

        {showClues && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            onClick={toggleClues}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div
              className="relative p-6"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 320,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <button
                onClick={toggleClues}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                aria-label="关闭"
              >
                <X size={16} color="#666" />
              </button>
              <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: decadeData.color }}
                />
                {decadeData.label}线索
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                根据以下线索判断碎片应放置的位置
              </p>
              <ul className="space-y-3">
                {clues.map((clue, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                  >
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: decadeData.color }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-gray-700 text-sm leading-relaxed">
                      {clue}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 209, 102, 0.7); }
          50% { box-shadow: 0 0 0 12px rgba(255, 209, 102, 0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes celebrate {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }
        @keyframes particle {
          0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translate(${Math.random() * 100 - 50}px, ${-50 - Math.random() * 100}px) scale(1); }
        }
      `}</style>
    </div>
  );
}
