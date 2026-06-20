import React from 'react';
import { useIncubation } from './hooks/useIncubation';
import EggSelector from './components/EggSelector';
import IncubationPanel from './components/IncubationPanel';
import CreatureEvolution from './components/CreatureEvolution';
import AttributePanel from './components/AttributePanel';
import TrainingPanel from './components/TrainingPanel';
import Toast from './components/Toast';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  useIncubation();

  return (
    <div
      className="min-h-screen w-full overflow-hidden relative"
      style={{ backgroundColor: '#0d0d1a' }}
    >
      <header
        className="absolute top-0 left-0 right-0 z-30 p-4 flex items-center justify-between"
        style={{
          background:
            'linear-gradient(to bottom, rgba(13, 13, 26, 0.9) 0%, transparent 100%)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, #6c63ff 0%, #8b5cf6 100%)',
              boxShadow: '0 0 20px rgba(108, 99, 255, 0.5)',
            }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1
              className="text-xl font-bold tracking-wide"
              style={{
                fontFamily: "'Cinzel Decorative', serif",
                color: '#e0e0f0',
                textShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
              }}
            >
              灵兽孵化模拟器
            </h1>
            <p
              className="text-xs"
              style={{
                fontFamily: "'Lato', sans-serif",
                color: '#6b7280',
              }}
            >
              Mythical Creature Incubator
            </p>
          </div>
        </div>
      </header>

      <main className="relative w-full h-screen flex">
        <aside
          className="hidden lg:block absolute left-0 top-0 bottom-0 z-20 p-4 pt-24 overflow-y-auto"
          style={{
            width: '300px',
            background:
              'linear-gradient(to right, rgba(26, 26, 46, 0.9) 0%, rgba(26, 26, 46, 0.7) 100%)',
            backdropFilter: 'blur(12px)',
            borderRight: '1px solid rgba(45, 45, 68, 0.5)',
          }}
        >
          <div className="space-y-6">
            <EggSelector />
            <div className="border-t border-[#2d2d44] pt-6">
              <IncubationPanel />
            </div>
            <div className="border-t border-[#2d2d44] pt-6">
              <TrainingPanel />
            </div>
          </div>
        </aside>

        <section
          className="flex-1 relative"
          style={{ marginLeft: '0', marginRight: '0' }}
        >
          <div className="absolute inset-0 pt-16 pb-16 lg:pl-[300px] lg:pr-[300px]">
            <CreatureEvolution />
          </div>

          <div className="lg:hidden absolute bottom-0 left-0 right-0 z-20 max-h-[50vh] overflow-y-auto">
            <div
              className="p-4 space-y-4"
              style={{
                background:
                  'linear-gradient(to top, rgba(26, 26, 46, 0.95) 0%, rgba(26, 26, 46, 0.8) 100%)',
                backdropFilter: 'blur(12px)',
                borderTop: '1px solid rgba(45, 45, 68, 0.5)',
              }}
            >
              <EggSelector />
              <div className="border-t border-[#2d2d44] pt-4">
                <IncubationPanel />
              </div>
              <div className="border-t border-[#2d2d44] pt-4">
                <TrainingPanel />
              </div>
              <div className="border-t border-[#2d2d44] pt-4">
                <AttributePanel />
              </div>
            </div>
          </div>
        </section>

        <aside
          className="hidden lg:block absolute right-0 top-0 bottom-0 z-20 p-4 pt-24 overflow-y-auto"
          style={{
            width: '300px',
            background:
              'linear-gradient(to left, rgba(26, 26, 46, 0.9) 0%, rgba(26, 26, 46, 0.7) 100%)',
            backdropFilter: 'blur(12px)',
            borderLeft: '1px solid rgba(45, 45, 68, 0.5)',
          }}
        >
          <AttributePanel />
        </aside>
      </main>

      <Toast />

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
        }

        @keyframes breathe {
          0%, 100% {
            opacity: 1;
            r: 6;
          }
          50% {
            opacity: 0.8;
            r: 8;
          }
        }

        @keyframes goldGlow {
          0%, 100% {
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.5), 0 0 60px rgba(255, 165, 0, 0.3);
          }
          50% {
            box-shadow: 0 0 50px rgba(255, 215, 0, 0.8), 0 0 100px rgba(255, 165, 0, 0.5);
          }
        }

        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #6c63ff;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(108, 99, 255, 0.8);
          transition: all 0.2s;
        }

        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(108, 99, 255, 1);
        }

        input[type='range']::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #6c63ff;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(108, 99, 255, 0.8);
        }

        * {
          scrollbar-width: thin;
          scrollbar-color: #2d2d44 transparent;
        }

        *::-webkit-scrollbar {
          width: 6px;
        }

        *::-webkit-scrollbar-track {
          background: transparent;
        }

        *::-webkit-scrollbar-thumb {
          background: #2d2d44;
          border-radius: 3px;
        }

        *::-webkit-scrollbar-thumb:hover {
          background: #3d3d5c;
        }
      `}</style>
    </div>
  );
};

export default App;
