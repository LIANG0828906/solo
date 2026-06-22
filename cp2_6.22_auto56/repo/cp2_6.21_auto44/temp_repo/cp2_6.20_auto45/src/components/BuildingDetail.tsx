import React, { useEffect, useState } from 'react';
import { X, Heart, Clock, Egg, Milk, Sparkles } from 'lucide-react';
import { useGameStore, Animal, Building, BuildingType } from '../stores/useGameStore';

interface BuildingDetailProps {
  building: Building;
  onClose: () => void;
}

interface AnimalCardInternalProps {
  animal: Animal;
  buildingType: BuildingType | undefined;
  formatCountdown: (ts: number) => string;
}

const getHealthStatus = (health: number): { text: string; labelColor: string; indicatorColor: string } => {
  if (health >= 70) {
    return {
      text: '健康',
      labelColor: 'text-emerald-600',
      indicatorColor: 'bg-emerald-500',
    };
  }
  if (health >= 40) {
    return {
      text: '一般',
      labelColor: 'text-amber-600',
      indicatorColor: 'bg-amber-500',
    };
  }
  return {
    text: '需喂食',
    labelColor: 'text-red-600',
    indicatorColor: 'bg-red-500',
  };
};

const AnimalCardInternal: React.FC<AnimalCardInternalProps> = ({ animal, buildingType, formatCountdown }) => {
  const [timeDisplay, setTimeDisplay] = useState<string>(formatCountdown(animal.productReadyAt));
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevTime, setPrevTime] = useState<string>('');
  const isProductReady = animal.productReadyAt <= Date.now();
  const healthStatus = getHealthStatus(animal.health);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = formatCountdown(animal.productReadyAt);
      if (newTime !== timeDisplay) {
        setPrevTime(timeDisplay);
        setIsAnimating(true);
        setTimeDisplay(newTime);
        setTimeout(() => setIsAnimating(false), 300);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [animal.productReadyAt, formatCountdown, timeDisplay]);

  const getAnimalName = (type: string): string => {
    switch (type) {
      case 'chicken': return '母鸡';
      case 'cow': return '奶牛';
      case 'sheep': return '绵羊';
      default: return '动物';
    }
  };

  const getHealthBarWidth = (health: number): number => {
    return Math.max(0, Math.min(100, health));
  };

  const getHealthBarGradient = (health: number): string => {
    const h = getHealthBarWidth(health);
    if (h >= 70) {
      return 'linear-gradient(to right, #10b981, #34d399, #6ee7b7)';
    }
    if (h >= 40) {
      return 'linear-gradient(to right, #f59e0b, #fbbf24, #fcd34d)';
    }
    return 'linear-gradient(to right, #ef4444, #f87171, #fca5a5)';
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* 头部信息 */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center shadow-inner">
            <span className="text-5xl transform hover:scale-110 transition-transform duration-300">
              {animal.icon}
            </span>
          </div>
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${healthStatus.indicatorColor} flex items-center justify-center shadow-md`}>
            <Heart className="w-3.5 h-3.5 text-white" fill="white" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-lg font-bold text-amber-900">
              {getAnimalName(animal.type)}
            </h4>
            <span className={`
              px-3 py-1 rounded-full text-xs font-bold
              ${healthStatus.labelColor} bg-white/80 border border-current/30
            `}>
              {healthStatus.text}
            </span>
          </div>

          {/* 健康条 */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-amber-700 mb-1.5">
              <span className="font-medium">健康状况</span>
              <span className="font-bold">{animal.health}%</span>
            </div>
            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full transition-all duration-700 ease-out rounded-full"
                style={{
                  width: `${getHealthBarWidth(animal.health)}%`,
                  background: getHealthBarGradient(animal.health),
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.15)',
                }}
              />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/30 to-transparent rounded-full" />
            </div>
          </div>

          {/* 产品产出 */}
          <div className="bg-white/60 rounded-xl p-3 border border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-200 flex items-center justify-center shadow-sm">
                  <span className="text-2xl">{buildingType?.productIcon}</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">下一次产出</div>
                  <div className="text-sm font-bold text-amber-800">
                    {buildingType?.productName}
                  </div>
                </div>
              </div>

              {isProductReady ? (
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-2 rounded-xl shadow-md animate-pulse">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-bold text-sm">可收获!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <div className="relative">
                    {prevTime && isAnimating && (
                      <span
                        className="absolute right-0 font-mono font-bold text-amber-700 text-lg transition-all duration-300"
                        style={{
                          opacity: 0,
                          transform: 'translateY(-12px) scale(0.8)',
                        }}
                      >
                        {prevTime}
                      </span>
                    )}
                    <span
                      className={`font-mono font-bold text-amber-700 text-lg transition-all duration-300 inline-block ${isAnimating ? 'animate-number-pop' : ''}`}
                      style={{
                        textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                      }}
                    >
                      {timeDisplay}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BuildingDetail: React.FC<BuildingDetailProps> = ({ building, onClose }) => {
  const {
    getBuildingType,
    getAnimalsInBuilding,
    formatCountdown,
    feedAnimals,
    collectProduct,
    feedParticles,
  } = useGameStore();

  const buildingType = getBuildingType(building.typeId);
  const animals = getAnimalsInBuilding(building.id);
  const buildingParticles = feedParticles.filter(p => p.buildingId === building.id);
  const [isFeeding, setIsFeeding] = useState(false);

  const averageHealth = animals.length > 0
    ? Math.round(animals.reduce((sum, a) => sum + a.health, 0) / animals.length)
    : 0;

  const readyCount = animals.filter(a => a.productReadyAt <= Date.now()).length;

  const handleFeed = () => {
    setIsFeeding(true);
    feedAnimals(building.id);
    setTimeout(() => setIsFeeding(false), 1000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-pop"
        onClick={e => e.stopPropagation()}
      >
        {/* 顶部 */}
        <div className="relative bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 p-6 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-40 h-40 bg-yellow-300 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-orange-300 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                <span className="text-4xl">{buildingType?.icon}</span>
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-1">{buildingType?.name}</h2>
                <div className="flex items-center gap-3 text-white/80 text-sm">
                  <span>🐾 {animals.length} 只动物</span>
                  <span>❤️ 平均 {averageHealth}%</span>
                  {readyCount > 0 && (
                    <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                      {readyCount} 个待收获
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors hover:scale-110 active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)] relative">
          {/* 粒子效果 */}
          {buildingParticles.map((particle, i) => (
            <div
              key={particle.id}
              className="absolute w-4 h-4 rounded-full bg-green-400 pointer-events-none shadow-lg shadow-green-400/50"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                '--px': `${(particle.x - 50) * 2}px`,
                '--py': `${(particle.y - 50) * 2}px`,
                animation: `feed-particle 0.8s ease-out forwards`,
                animationDelay: `${i * 30}ms`,
              } as React.CSSProperties}
            />
          ))}

          {animals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <span className="text-6xl block mb-4">🐣</span>
              <p>还没有动物，先购买一些吧~</p>
            </div>
          ) : (
            <div className="space-y-4">
              {animals.map(animal => (
                <AnimalCardInternal
                  key={animal.id}
                  animal={animal}
                  buildingType={buildingType}
                  formatCountdown={formatCountdown}
                />
              ))}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="p-6 bg-white/80 backdrop-blur border-t border-amber-200">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleFeed}
              disabled={isFeeding}
              className={`
                relative overflow-hidden flex items-center justify-center gap-3
                py-4 px-6 rounded-2xl font-bold text-lg text-white
                transition-all duration-300 active:scale-95
                ${isFeeding 
                  ? 'bg-green-400 cursor-wait' 
                  : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                }
              `}
            >
              <span className={`text-2xl ${isFeeding ? 'animate-spin' : ''}`}>🥣</span>
              <span>喂食所有动物</span>
            </button>

            <button
              onClick={() => collectProduct(building.id)}
              disabled={readyCount === 0}
              className={`
                relative overflow-hidden flex items-center justify-center gap-3
                py-4 px-6 rounded-2xl font-bold text-lg text-white
                transition-all duration-300 active:scale-95
                ${readyCount === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                }
              `}
            >
              <span className="text-2xl">{buildingType?.productIcon}</span>
              <span>
                收集产品
                {readyCount > 0 && (
                  <span className="ml-2 bg-white/25 px-2 py-0.5 rounded-full text-sm">
                    {readyCount}
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
