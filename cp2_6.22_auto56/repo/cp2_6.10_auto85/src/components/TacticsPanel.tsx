import { motion } from 'framer-motion';
import { Shield, Users, Swords } from 'lucide-react';
import { Tactics } from '../store/useGameStore';
import { COLORS } from '../gameLogic';

interface TacticsPanelProps {
  currentTactics: Tactics;
  onChangeTactics: (tactics: Tactics) => void;
  isTransitioning: boolean;
}

export default function TacticsPanel({
  currentTactics,
  onChangeTactics,
  isTransitioning,
}: TacticsPanelProps) {
  const tactics = [
    {
      id: 'defense' as Tactics,
      name: '稳守反击',
      icon: Shield,
      description: '全员回撤防守区域',
    },
    {
      id: 'midfield' as Tactics,
      name: '中场控制',
      icon: Users,
      description: '球员在中圈附近布阵',
    },
    {
      id: 'offense' as Tactics,
      name: '全线压上',
      icon: Swords,
      description: '球员前压至对方半场',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10"
    >
      <div
        className="p-4 rounded-lg shadow-xl"
        style={{
          background: `linear-gradient(135deg, rgba(184, 115, 51, 0.95), rgba(139, 90, 43, 0.95))`,
          border: '2px solid #d4a76a',
        }}
      >
        <h3
          className="text-white text-center mb-3 font-bold"
          style={{ fontFamily: 'serif', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
        >
          战术调整
        </h3>
        <div className="space-y-2">
          {tactics.map((tactic) => {
            const Icon = tactic.icon;
            const isActive = currentTactics === tactic.id;
            return (
              <motion.button
                key={tactic.id}
                onClick={() => onChangeTactics(tactic.id)}
                disabled={isTransitioning}
                whileHover={{ scale: isTransitioning ? 1 : 1.05 }}
                whileTap={{ scale: isTransitioning ? 1 : 0.95 }}
                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                  isActive ? 'ring-2 ring-white' : ''
                }`}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${COLORS.copperHover}, #b8860b)`
                    : `linear-gradient(135deg, #8b5a2b, #654321)`,
                  boxShadow: isActive
                    ? `0 0 15px ${COLORS.copperHover}80`
                    : '0 2px 4px rgba(0,0,0,0.3)',
                  cursor: isTransitioning ? 'not-allowed' : 'pointer',
                  opacity: isTransitioning ? 0.6 : 1,
                }}
              >
                <Icon size={24} color="#fff" />
                <div className="text-left">
                  <div className="text-white font-bold text-sm">{tactic.name}</div>
                  <div className="text-white/70 text-xs">{tactic.description}</div>
                </div>
              </motion.button>
            );
          })}
        </div>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-center text-yellow-200 text-xs"
          >
            阵型调整中...
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
