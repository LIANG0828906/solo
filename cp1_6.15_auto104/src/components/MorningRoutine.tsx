import { useEffect, useState } from 'react';
import { Brain, Droplets, BookOpen, Heart, Plus } from 'lucide-react';
import { getRituals, createRitual } from '@/services/api';
import { useStore } from '@/stores/useStore';
import CheckInForm from '@/components/CheckInForm';

const PRESET_ICONS: Record<string, React.ReactNode> = {
  '冥想5分钟': <Brain className="w-8 h-8" />,
  '喝一杯温水': <Droplets className="w-8 h-8" />,
  '晨间日记': <BookOpen className="w-8 h-8" />,
  '感恩练习': <Heart className="w-8 h-8" />,
};

export default function MorningRoutine() {
  const morningRituals = useStore((s) => s.morningRituals);
  const selectedRitual = useStore((s) => s.selectedRitual);
  const setRituals = useStore((s) => s.setRituals);
  const selectRitual = useStore((s) => s.selectRitual);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    getRituals('morning').then((rituals) => setRituals('morning', rituals));
  }, [setRituals]);

  const handleAddCustom = async () => {
    if (!customName.trim()) return;
    await createRitual(customName.trim(), 'morning');
    const rituals = await getRituals('morning');
    setRituals('morning', rituals);
    setCustomName('');
    setShowCustom(false);
  };

  return (
    <div className="bg-morning-gradient min-h-screen px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-white">晨间仪式</h1>

      <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
        {morningRituals.map((ritual) => (
          <button
            key={ritual.id}
            className={`flex flex-col items-center justify-center w-24 h-24 mx-auto rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white transition-all ${
              selectedRitual?.id === ritual.id ? 'ritual-selected' : ''
            }`}
            onClick={() => selectRitual(ritual)}
          >
            {PRESET_ICONS[ritual.name] ?? <Brain className="w-8 h-8" />}
            <span className="text-xs mt-1">{ritual.name}</span>
          </button>
        ))}
      </div>

      <div className="max-w-sm mx-auto mt-8">
        {!showCustom ? (
          <button
            className="w-full py-2 rounded-lg border border-white/30 text-white/80 hover:bg-white/10 transition"
            onClick={() => setShowCustom(true)}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            自定义仪式
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none"
              placeholder="输入仪式名称"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
            />
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#f2a900', color: '#1a1a2e' }}
              onClick={handleAddCustom}
            >
              添加
            </button>
          </div>
        )}
      </div>

      {selectedRitual && <CheckInForm ritualType="morning" />}
    </div>
  );
}
