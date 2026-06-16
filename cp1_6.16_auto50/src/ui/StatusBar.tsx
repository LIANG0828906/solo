import { Shield, Zap, Target, Trophy } from 'lucide-react';

interface StatusBarProps {
  armor: number;
  maxArmor: number;
  energy: number;
  maxEnergy: number;
  energyCollected: number;
  energyTarget: number;
  score: number;
  armorFlashing: boolean;
  shieldActive: boolean;
}

export function StatusBar({
  armor,
  maxArmor,
  energy,
  maxEnergy,
  energyCollected,
  energyTarget,
  score,
  armorFlashing,
  shieldActive,
}: StatusBarProps) {
  const armorPercent = (armor / maxArmor) * 100;
  const energyPercent = (energy / maxEnergy) * 100;
  const progressPercent = (energyCollected / energyTarget) * 100;

  const getArmorColor = () => {
    if (armorPercent > 60) return 'from-green-400 to-green-600';
    if (armorPercent > 30) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  return (
    <div
      className="absolute top-0 left-0 right-0 p-4 flex items-center gap-6 z-10"
      style={{
        background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div className="flex items-center gap-2 flex-1">
        <div className={`p-2 rounded-lg ${shieldActive ? 'bg-blue-500/30' : 'bg-white/10'}`}>
          <Shield className={`w-5 h-5 ${shieldActive ? 'text-blue-400' : 'text-white/70'}`} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>护甲</span>
            <span className="font-mono">{Math.round(armor)}/{maxArmor}</span>
          </div>
          <div
            className={`h-3 rounded-full overflow-hidden bg-white/10 transition-opacity ${
              armorFlashing ? 'animate-pulse' : ''
            }`}
            style={{
              opacity: armorFlashing ? 0.5 : 1,
            }}
          >
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getArmorColor()} transition-all duration-200`}
              style={{ width: `${armorPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-1">
        <div className="p-2 rounded-lg bg-yellow-500/20">
          <Zap className="w-5 h-5 text-yellow-400" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>能量</span>
            <span className="font-mono">{Math.round(energy)}/{maxEnergy}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-200"
              style={{ width: `${energyPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-1">
        <div className="p-2 rounded-lg bg-green-500/20">
          <Target className="w-5 h-5 text-green-400" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>任务进度</span>
            <span className="font-mono">{energyCollected}/{energyTarget}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10">
        <Trophy className="w-5 h-5 text-amber-400" />
        <div className="text-right">
          <div className="text-xs text-white/60">得分</div>
          <div className="text-lg font-bold text-white font-mono">{score}</div>
        </div>
      </div>
    </div>
  );
}
