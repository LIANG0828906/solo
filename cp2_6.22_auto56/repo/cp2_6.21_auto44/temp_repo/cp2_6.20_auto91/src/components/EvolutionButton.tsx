import React from 'react';
import { useIncubationStore } from '../store/incubationStore';
import { Sparkles } from 'lucide-react';

const EvolutionButton: React.FC = () => {
  const canEvolve = useIncubationStore((state) => state.canEvolve);
  const isEvolving = useIncubationStore((state) => state.isEvolving);
  const evolutionStage = useIncubationStore((state) => state.evolutionStage);
  const evolve = useIncubationStore((state) => state.evolve);

  if (evolutionStage === 'evolved' || evolutionStage === 'egg') {
    return null;
  }

  const getButtonText = () => {
    if (isEvolving) return '进化中...';
    if (evolutionStage === 'baby') return '进化为成体';
    if (evolutionStage === 'adult') return '进化为最终形态';
    return '进化';
  };

  return (
    <button
      onClick={evolve}
      disabled={!canEvolve || isEvolving}
      className={`
        w-full py-4 px-6 rounded-xl font-bold text-white
        transition-all duration-300
        flex items-center justify-center gap-2
        ${canEvolve && !isEvolving
          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400'
          : 'bg-gray-600 cursor-not-allowed opacity-50'
        }
        ${canEvolve && !isEvolving ? 'animate-[goldGlow_1.5s_ease-in-out_infinite]' : ''}
        active:scale-95
      `}
      style={{
        fontFamily: "'Cinzel Decorative', serif",
        boxShadow: canEvolve && !isEvolving
          ? '0 0 30px rgba(255, 215, 0, 0.5), 0 0 60px rgba(255, 165, 0, 0.3)'
          : 'none',
      }}
    >
      <Sparkles
        className={`w-5 h-5 ${isEvolving ? 'animate-spin' : ''}`}
      />
      {getButtonText()}
    </button>
  );
};

export default EvolutionButton;
