import { useMemo } from 'react';
import { usePetStore } from '@/store';
import { MOOD_EMOJIS, SPECIES_LABELS } from '@/types';
import { Sparkles } from 'lucide-react';

export default function RecommendSection() {
  const { petList, recentCareSpecies } = usePetStore();

  const recommended = useMemo(() => {
    const filtered = petList.filter((pet) => recentCareSpecies.includes(pet.species));
    return [...filtered].sort(() => 0.5 - Math.random()).slice(0, 4);
  }, [petList.length, recentCareSpecies]);

  if (!recommended.length) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} className="text-accent" />
        <span className="text-sm font-semibold text-text-primary">为你推荐</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {recommended.map((pet) => (
          <div
            key={pet.id}
            className="shrink-0 w-[200px] bg-base-card border border-base-border rounded-xl p-4 cursor-pointer transition-all hover:border-accent hover:-translate-y-0.5"
            onClick={() => { window.location.hash = '#/pet/' + pet.id; }}
          >
            <div className="w-12 h-12 rounded-full bg-[#2A2A44] flex items-center justify-center text-2xl">
              {pet.avatarIcon}
            </div>
            <div className="text-text-primary text-sm font-medium mt-2">{pet.name}</div>
            <div className="text-text-secondary text-xs mt-0.5">
              {SPECIES_LABELS[pet.species]} · {pet.age}岁
            </div>
            <div className="mt-2">{MOOD_EMOJIS[pet.mood]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
