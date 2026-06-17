import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePetStore } from '@/store';
import { MOOD_EMOJIS, MOOD_COLORS, SPECIES_LABELS, MoodType } from '@/types';
import ActivityTimeline from '@/components/ActivityTimeline';
import { ActivityForm } from '@/components/ActivityForm';
import { ArrowLeft } from 'lucide-react';

const MOOD_LABELS: Record<MoodType, string> = {
  happy: '开心',
  calm: '平静',
  unhappy: '不开心',
};

const PetDetail = () => {
  const { petList, selectedPet, setSelectedPet, fetchActivities } = usePetStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const pet = petList.find((p) => p.id === id);
    if (pet) {
      setSelectedPet(pet);
      fetchActivities(pet.id);
    }
  }, [id]);

  if (!selectedPet) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-text-secondary text-lg mb-4">宠物不存在</p>
        <button
          onClick={() => navigate('/')}
          className="text-accent hover:underline"
        >
          返回看板
        </button>
      </div>
    );
  }

  const pet = selectedPet;
  const mood = pet.mood as MoodType;
  const moodGradientClass =
    mood === 'happy'
      ? 'mood-gradient-happy'
      : mood === 'calm'
        ? 'mood-gradient-calm'
        : 'mood-gradient-unhappy';
  const glowClass = `pet-glow-${pet.mood}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div
        className="flex items-center gap-2 text-text-secondary hover:text-accent cursor-pointer mb-6 transition-colors"
        onClick={() => navigate('/')}
      >
        <ArrowLeft size={18} />
        <span>返回看板</span>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-[360px] shrink-0">
          <div
            className={`bg-base-card border border-base-border rounded-2xl p-6 ${moodGradientClass}`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-24 h-24 rounded-full bg-[#2A2A44] flex items-center justify-center text-5xl ${glowClass}`}
              >
                {pet.avatarIcon}
              </div>
              <div className="text-xl font-bold text-text-primary mt-4">
                {pet.name}
              </div>
              <div className="text-text-secondary text-sm mt-1">
                {SPECIES_LABELS[pet.species]} · {pet.age}岁
              </div>
            </div>

            <div className="mt-6 text-center">
              <div className="text-xs text-text-secondary mb-2">当前情绪</div>
              <div className="text-4xl">{MOOD_EMOJIS[pet.mood]}</div>
              <div className="text-sm mt-1" style={{ color: MOOD_COLORS[pet.mood] }}>
                {MOOD_LABELS[mood]}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                情绪指数: {pet.moodScore}
              </div>
            </div>

            <div className="border-t border-base-border my-4" />

            <ActivityForm petId={pet.id} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold text-text-primary mb-4">活动日志</div>
          <ActivityTimeline petId={pet.id} />
        </div>
      </div>
    </div>
  );
};

export default PetDetail;
