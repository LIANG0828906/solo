import { useEffect } from 'react';
import { CalculusStore } from './components/CalculusStore';
import { Workshop } from './components/Workshop';
import { InfoPanel } from './components/InfoPanel';
import { useWorkshopStore } from './store/workshopStore';
import { useAudio } from './hooks/useAudio';

function App() {
  const { initCalculi, longPressCalculus } = useWorkshopStore();
  const { playClickSound } = useAudio();

  useEffect(() => {
    initCalculi();
  }, [initCalculi]);

  return (
    <div className="w-full h-full flex bg-[#e8d5b3] paper-texture overflow-hidden">
      <div className="w-1/5 min-w-[280px] h-full flex flex-col z-10">
        <div className="p-4 text-center">
          <h1 className="ancient-title text-2xl mb-1">算筹·天工</h1>
          <div className="text-xs text-[#4a3a24]" style={{ fontFamily: 'var(--font-ancient)' }}>
            以五行之理，造天工之物
          </div>
        </div>
        <CalculusStore />
      </div>

      <div className="flex-1 h-full relative">
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bamboo-panel px-6 py-2 text-center">
            <div className="ancient-title text-sm">工坊</div>
          </div>
        </div>
        <Workshop />
      </div>

      <div className="w-1/4 min-w-[320px] h-full z-10">
        <InfoPanel />
      </div>

      {longPressCalculus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 scale-in">
          <div className="bamboo-panel p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <div
                className="w-16 h-20 rounded mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                style={{ backgroundColor: `var(--color-${longPressCalculus.element})` }}
              >
                {longPressCalculus.element === 'wood' ? '木' : 
                 longPressCalculus.element === 'fire' ? '火' :
                 longPressCalculus.element === 'earth' ? '土' :
                 longPressCalculus.element === 'metal' ? '金' : '水'}
              </div>
              <h3 className="ancient-title text-xl text-[#c0392b]">{longPressCalculus.name}</h3>
            </div>

            <div className="space-y-3">
              {[
                { key: 'hardness', name: '硬度' },
                { key: 'sharpness', name: '锋利度' },
                { key: 'resonance', name: '音律' },
                { key: 'durability', name: '耐久度' },
                { key: 'flexibility', name: '柔韧性' },
              ].map(({ key, name }) => (
                <div key={key}>
                  <div className="flex justify-between text-[#2b1e0e] mb-1">
                    <span style={{ fontFamily: 'var(--font-ancient)' }}>{name}</span>
                    <span className="font-mono text-[#c0392b]">
                      {longPressCalculus.attributes[key as keyof typeof longPressCalculus.attributes]}
                    </span>
                  </div>
                  <div className="attribute-bar">
                    <div
                      className="attribute-bar-fill"
                      style={{
                        width: `${longPressCalculus.attributes[key as keyof typeof longPressCalculus.attributes]}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center text-sm text-[#4a3a24]">
              松开关闭此面板
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-10">
        <div className="absolute top-10 left-10 text-[120px] text-[#c0392b] font-bold" style={{ fontFamily: 'var(--font-ancient)' }}>
          天
        </div>
        <div className="absolute bottom-10 right-10 text-[120px] text-[#2b1e0e] font-bold" style={{ fontFamily: 'var(--font-ancient)' }}>
          工
        </div>
      </div>
    </div>
  );
}

export default App;
