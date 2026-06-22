import React, { useState, useMemo } from 'react';
import { useIncubationStore } from '../store/incubationStore';
import { EGG_CONFIGS, EVOLUTION_STAGE_LABELS, EVOLUTION_REQUIREMENTS } from '../utils/constants';
import type { EvolutionStage, Skill } from '../types';
import RadarChart from './RadarChart';
import EvolutionButton from './EvolutionButton';
import { Egg, Baby, Crown, Star, Lock, Sparkles } from 'lucide-react';

const AttributePanel: React.FC = () => {
  const evolutionStage = useIncubationStore((state) => state.evolutionStage);
  const creatureStats = useIncubationStore((state) => state.creatureStats);
  const selectedEgg = useIncubationStore((state) => state.selectedEgg);
  const level = useIncubationStore((state) => state.level);
  const trainingCount = useIncubationStore((state) => state.trainingCount);
  const [hoveredStage, setHoveredStage] = useState<EvolutionStage | null>(null);

  const stages: EvolutionStage[] = ['egg', 'baby', 'adult', 'evolved'];

  const getStageIcon = (stage: EvolutionStage) => {
    switch (stage) {
      case 'egg':
        return <Egg className="w-5 h-5" />;
      case 'baby':
        return <Baby className="w-5 h-5" />;
      case 'adult':
        return <Crown className="w-5 h-5" />;
      case 'evolved':
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const isStageUnlocked = (stage: EvolutionStage): boolean => {
    const stageOrder: EvolutionStage[] = ['egg', 'baby', 'adult', 'evolved'];
    return stageOrder.indexOf(stage) <= stageOrder.indexOf(evolutionStage);
  };

  const isStageCurrent = (stage: EvolutionStage): boolean => {
    return stage === evolutionStage;
  };

  const getSkillsForStage = (stage: EvolutionStage): Skill[] => {
    if (!selectedEgg) return [];
    const config = EGG_CONFIGS[selectedEgg];
    if (!config) return [];

    switch (stage) {
      case 'baby':
        return config.skills.baby;
      case 'adult':
        return config.skills.adult;
      case 'evolved':
        return config.skills.evolved;
      default:
        return [];
    }
  };

  const getStageRequirements = (stage: EvolutionStage) => {
    if (stage === 'adult') {
      return EVOLUTION_REQUIREMENTS.baby_to_adult;
    }
    if (stage === 'evolved') {
      return EVOLUTION_REQUIREMENTS.adult_to_evolved;
    }
    return null;
  };

  const creatureName = useMemo(() => {
    if (!selectedEgg) return '';
    return EGG_CONFIGS[selectedEgg]?.name || '';
  }, [selectedEgg]);

  if (evolutionStage === 'egg') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Egg className="w-16 h-16 text-[#2d2d44] mb-4" />
        <p
          className="text-sm"
          style={{ fontFamily: "'Lato', sans-serif", color: '#6b7280' }}
        >
          孵化完成后显示灵兽属性
        </p>
      </div>
    );
  }

  if (!creatureStats) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3
          className="text-xl font-bold tracking-wide"
          style={{
            fontFamily: "'Cinzel Decorative', serif",
            color: '#ffd700',
            textShadow: '0 0 15px rgba(255, 215, 0, 0.4)',
          }}
        >
          {creatureName}
        </h3>
        <div
          className="text-sm mt-1"
          style={{
            fontFamily: "'Lato', sans-serif",
            color: '#8b5cf6',
          }}
        >
          {EVOLUTION_STAGE_LABELS[evolutionStage]}
        </div>
      </div>

      <div className="h-64">
        <RadarChart stats={creatureStats} />
      </div>

      <div className="space-y-3">
        <h4
          className="text-sm font-bold tracking-wide"
          style={{
            fontFamily: "'Cinzel Decorative', serif",
            color: '#b0b0d0',
          }}
        >
          成长路径
        </h4>

        <div className="relative">
          <div className="absolute top-6 left-0 right-0 h-1 bg-[#2d2d44] rounded-full" />
          <div
            className="absolute top-6 left-0 h-1 rounded-full bg-gradient-to-r from-purple-500 to-yellow-500 transition-all duration-500"
            style={{
              width: `${(stages.indexOf(evolutionStage) / (stages.length - 1)) * 100}%`,
            }}
          />

          <div className="relative flex justify-between">
            {stages.map((stage, index) => {
              const unlocked = isStageUnlocked(stage);
              const current = isStageCurrent(stage);
              const skills = getSkillsForStage(stage);
              const requirements = getStageRequirements(stage);
              const canShowRequirements =
                requirements &&
                !unlocked &&
                ((evolutionStage === 'baby' && stage === 'adult') ||
                  (evolutionStage === 'adult' && stage === 'evolved'));

              return (
                <div
                  key={stage}
                  className="relative flex flex-col items-center"
                  onMouseEnter={() => setHoveredStage(stage)}
                  onMouseLeave={() => setHoveredStage(null)}
                >
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      transition-all duration-300 border-2 z-10
                      ${current
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-300 scale-110 shadow-lg shadow-yellow-500/50'
                        : unlocked
                        ? 'bg-[#2d2d44] border-purple-500 text-purple-400'
                        : 'bg-[#1a1a2e] border-[#2d2d44] text-[#2d2d44]'
                      }
                    `}
                  >
                    {unlocked ? (
                      getStageIcon(stage)
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>

                  <div
                    className="text-xs mt-2"
                    style={{
                      fontFamily: "'Lato', sans-serif",
                      color: current ? '#ffd700' : unlocked ? '#b0b0d0' : '#4b5563',
                    }}
                  >
                    {EVOLUTION_STAGE_LABELS[stage]}
                  </div>

                  {hoveredStage === stage && skills.length > 0 && (
                    <div
                      className="absolute top-16 z-20 w-48 p-3 rounded-xl border border-[#2d2d44] bg-[#1a1a2e]/95 backdrop-blur-md shadow-xl"
                      style={{
                        left: index === 0 ? 0 : index === stages.length - 1 ? 'auto' : '-50%',
                        right: index === stages.length - 1 ? 0 : 'auto',
                      }}
                    >
                      <div className="text-xs font-bold mb-2 text-purple-400">
                        解锁技能
                      </div>
                      <div className="space-y-2">
                        {skills.map((skill, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 p-2 rounded-lg bg-[#0d0d1a]/50"
                          >
                            <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                            <div>
                              <div className="text-xs font-medium text-white/80">
                                {skill.name}
                              </div>
                              <div className="text-[10px] text-white/50">
                                {skill.description}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {canShowRequirements && (
                        <div className="mt-3 pt-2 border-t border-[#2d2d44]">
                          <div className="text-xs font-bold mb-1 text-orange-400">
                            进化条件
                          </div>
                          <div className="text-[10px] space-y-1">
                            <div
                              className={`flex justify-between ${
                                level >= requirements.level ? 'text-green-400' : 'text-white/50'
                              }`}
                            >
                              <span>等级</span>
                              <span>
                                {level}/{requirements.level}
                              </span>
                            </div>
                            <div
                              className={`flex justify-between ${
                                trainingCount >= requirements.trainingCount
                                  ? 'text-green-400'
                                  : 'text-white/50'
                              }`}
                            >
                              <span>训练次数</span>
                              <span>
                                {trainingCount}/{requirements.trainingCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-[#2d2d44]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <EvolutionButton />
    </div>
  );
};

export default AttributePanel;
