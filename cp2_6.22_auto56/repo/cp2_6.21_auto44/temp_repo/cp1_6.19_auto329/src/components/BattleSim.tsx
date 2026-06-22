import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Play, Pause, Heart, Shield, Zap, Target } from 'lucide-react';
import { useGameStore, calculateShipStats } from '../gameStore';
import { BattleLog } from './BattleLog';
import { ResultModal } from './ResultModal';

export const BattleSim = () => {
  const {
    battleState,
    startBattle,
    executeTurn,
    resetBattle,
    clearLastHit,
    getTotalThrust,
    getTotalShield,
    getTotalWeapon,
  } = useGameStore();

  const playerStats = useMemo(() => {
    if (battleState) {
      return calculateShipStats(battleState.playerShip);
    }
    return {
      thrust: getTotalThrust(),
      shield: getTotalShield(),
      weapon: getTotalWeapon(),
    };
  }, [battleState, getTotalThrust, getTotalShield, getTotalWeapon]);

  const enemyStats = useMemo(() => {
    if (battleState) {
      return calculateShipStats(battleState.enemyShip);
    }
    return { thrust: 30, shield: 50, weapon: 35 };
  }, [battleState]);

  useEffect(() => {
    if (battleState?.isActive && !battleState.winner) {
      const timer = setTimeout(() => {
        executeTurn();
        setTimeout(() => clearLastHit(), 200);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [battleState?.isActive, battleState?.currentTurn, battleState?.winner, executeTurn, clearLastHit]);

  if (!battleState) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#2a2a3e] rounded-xl p-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-6xl mb-4">⚔️</div>
          <h2 className="text-2xl font-bold text-[#4FC3F7] mb-2">准备战斗</h2>
          <p className="text-[#A0A0B0] mb-6 max-w-sm">
            装配好你的飞船后，点击下方按钮启动模拟战斗。
            <br />
            对手：掠夺者号 AI飞船
          </p>
          
          <div className="bg-[#1a1a2e] rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-bold text-[#FFD54F] mb-2">敌军数据</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-[#FF5252]" />
                <span>推力: {enemyStats.thrust}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-[#448AFF]" />
                <span>护盾: {enemyStats.shield}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target size={14} className="text-[#69F0AE]" />
                <span>武器: {enemyStats.weapon}</span>
              </div>
            </div>
          </div>

          <motion.button
            onClick={startBattle}
            className="px-8 py-4 rounded-xl font-bold text-white text-lg flex items-center gap-3 mx-auto"
            style={{
              background: 'linear-gradient(135deg, #F44336, #FF5722)',
              boxShadow: '0 4px 30px rgba(244, 67, 54, 0.4)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play size={24} />
            启动战斗
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const { playerShip, enemyShip, currentTurn, maxTurns, logs, winner, lastHitShip } = battleState;

  const playerHpPercent = (playerShip.currentHp / playerShip.maxHp) * 100;
  const enemyHpPercent = (enemyShip.currentHp / enemyShip.maxHp) * 100;

  return (
    <div className="h-full flex flex-col bg-[#2a2a3e] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#4FC3F7]20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#4FC3F7] flex items-center gap-2">
            <Swords size={20} />
            <span>战斗模拟</span>
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="opacity-60">回合: </span>
              <span className="font-bold text-[#FFD54F]">{currentTurn}</span>
              <span className="opacity-60"> / {maxTurns}</span>
            </div>
            {battleState.isActive && (
              <Pause size={16} className="text-[#FFD54F] animate-pulse" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <motion.div
            className={`p-4 rounded-xl ${lastHitShip === 'player' ? 'hit-animation' : ''}`}
            style={{
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              border: `2px solid ${lastHitShip === 'player' ? '#F44336' : 'rgba(76, 175, 80, 0.3)'}`,
              transition: 'border-color 0.2s',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🛸</span>
              <span className="font-bold text-[#81C784]">{playerShip.name}</span>
            </div>
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1">
                  <Heart size={12} className="text-[#F44336]" />
                  生命值
                </span>
                <span>{playerShip.currentHp} / {playerShip.maxHp}</span>
              </div>
              <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: '#F44336' }}
                  initial={{ width: '100%' }}
                  animate={{ width: `${playerHpPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Zap size={10} className="text-[#FF5252]" />
                <span>{playerStats.thrust}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield size={10} className="text-[#448AFF]" />
                <span>{playerStats.shield}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target size={10} className="text-[#69F0AE]" />
                <span>{playerStats.weapon}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className={`p-4 rounded-xl ${lastHitShip === 'enemy' ? 'hit-animation' : ''}`}
            style={{
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              border: `2px solid ${lastHitShip === 'enemy' ? '#F44336' : 'rgba(244, 67, 54, 0.3)'}`,
              transition: 'border-color 0.2s',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">👾</span>
              <span className="font-bold text-[#E57373]">{enemyShip.name}</span>
            </div>
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1">
                  <Heart size={12} className="text-[#F44336]" />
                  生命值
                </span>
                <span>{enemyShip.currentHp} / {enemyShip.maxHp}</span>
              </div>
              <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: '#F44336' }}
                  initial={{ width: '100%' }}
                  animate={{ width: `${enemyHpPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Zap size={10} className="text-[#FF5252]" />
                <span>{enemyStats.thrust}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield size={10} className="text-[#448AFF]" />
                <span>{enemyStats.shield}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target size={10} className="text-[#69F0AE]" />
                <span>{enemyStats.weapon}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-hidden">
        <BattleLog logs={logs} />
      </div>

      <div className="p-4 border-t border-[#4FC3F7]20">
        <motion.button
          onClick={resetBattle}
          className="w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2"
          style={{
            backgroundColor: '#4FC3F7',
            boxShadow: '0 2px 15px rgba(79, 195, 247, 0.3)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ← 返回装配
        </motion.button>
      </div>

      <AnimatePresence>
        {winner && (
          <ResultModal winner={winner} onRestart={resetBattle} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BattleSim;
