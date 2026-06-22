import { Pet, MOOD_EMOJIS, SPECIES_LABELS } from '@/types';

interface PetCardProps {
  pet: Pet;
  onSelect: (pet: Pet) => void;
}

const MOOD_GLOW_MAP: Record<string, string> = {
  happy: 'pet-glow-happy',
  calm: 'pet-glow-calm',
  unhappy: 'pet-glow-unhappy',
};

export default function PetCard({ pet, onSelect }: PetCardProps) {
  return (
    <div
      className="relative bg-base-card border border-base-border rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-accent group"
      onClick={() => onSelect(pet)}
    >
      <div className={`w-[60px] h-[60px] rounded-full bg-[#2A2A44] flex items-center justify-center text-3xl mx-auto ${MOOD_GLOW_MAP[pet.mood] ?? ''}`}>
        {pet.avatarIcon}
      </div>
      <div className="text-text-primary font-semibold text-base mt-3 text-center">
        {pet.name}
      </div>
      <div className="text-text-secondary text-xs mt-1 text-center">
        {SPECIES_LABELS[pet.species]} · {pet.age}岁
      </div>
      <div className="text-[28px] mt-3 text-center">
        {MOOD_EMOJIS[pet.mood]}
      </div>
      <button className="mt-4 w-full py-2 rounded-xl text-xs font-medium bg-accent/10 text-accent border border-accent/20 transition-all hover:bg-accent/20">
        浏览详情
      </button>
    </div>
  );
}
