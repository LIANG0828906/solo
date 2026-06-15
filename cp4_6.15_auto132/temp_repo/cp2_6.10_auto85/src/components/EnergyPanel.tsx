import { motion } from 'framer-motion';
import { Player } from '../store/useGameStore';
import { COLORS } from '../gameLogic';
import { Battery, BatteryLow, BatteryMedium } from 'lucide-react';

interface EnergyPanelProps {
  players: Player[];
}

export default function EnergyPanel({ players }: EnergyPanelProps) {
  const playerTeamPlayers = players.filter((p) => p.team === 'player');

  const getEnergyIcon = (energy: number) => {
    if (energy > 50) return Battery;
    if (energy > 10) return BatteryMedium;
    return BatteryLow;
  };

  const getEnergyColor = (energy: number) => {
    if (energy > 50) return COLORS.energyBar;
    if (energy > 10) return '#f59e0b';
    return COLORS.energyLow;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute right-4 bottom-4 z-10"
    >
      <div
        className="p-4 rounded-lg shadow-xl min-w-[220px]"
        style={{
          background: `linear-gradient(135deg, rgba(184, 115, 51, 0.95), rgba(139, 90, 43, 0.95))`,
          border: '2px solid #d4a76a',
        }}
      >
        <h3
          className="text-white text-center mb-3 font-bold"
          style={{ fontFamily: 'serif', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
        >
          球员体能
        </h3>
        <div className="space-y-2">
          {playerTeamPlayers.map((player) => {
            const Icon = getEnergyIcon(player.energy);
            const energyColor = getEnergyColor(player.energy);
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: player.id * 0.1 }}
                className="flex items-center gap-2"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.playerVest}, #d4a017)`,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {player.number}
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-black/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: '100%' }}
                      animate={{ width: `${player.energy}%` }}
                      transition={{ duration: 0.3 }}
                      style={{ backgroundColor: energyColor }}
                    />
                  </div>
                </div>
                <Icon size={16} color={energyColor} />
                <span className="text-white text-xs w-8 text-right">
                  {Math.round(player.energy)}%
                </span>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/70 text-center">
          低于10%时速度下降30%
        </div>
      </div>
    </motion.div>
  );
}
