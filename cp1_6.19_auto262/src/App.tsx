import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HexBoard } from './modules/board/HexBoard';
import { SpiritCard } from './modules/entities/SpiritCard';
import { useGameStore } from './modules/game/GameStore';
import type { ElementType, HexCoord } from './modules/board/hexUtils';
import { WEATHER_CONFIG, TERRAIN_CONFIG, hexEquals } from './modules/board/hexUtils';
import { ELEMENT_NAMES, ELEMENT_ICONS, ELEMENT_COLORS } from './modules/entities/spiritData';
import './styles/global.css';

const App: React.FC = () => {
  const {
    spirits,
    selectedSpirit,
    selectedSkill,
    currentTurn,
    currentPlayer,
    weather,
    actionLog,
    summonPoints,
    gameOver,
    winner,
    initGame,
    summonSpirit,
    moveSpirit,
    attackSpirit,
    useSkill,
    endTurn,
    selectSpirit,
    selectSkill,
    getTerrainAt
  } = useGameStore();

  const [summonMode, setSummonMode] = useState<ElementType | null>(null);
  const [lastActionTime, setLastActionTime] = useState(0);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const playerSpirits = spirits.filter(s => s.owner === 'player');
  const enemySpirits = spirits.filter(s => s.owner === 'enemy');
  const selectedSpiritData = spirits.find(s => s.id === selectedSpirit);

  const handleHexClick = useCallback((coord: HexCoord) => {
    const now = Date.now();
    if (now - lastActionTime < 300) return;

    if (summonMode) {
      const success = summonSpirit(summonMode, coord);
      if (success) {
        setSummonMode(null);
        setLastActionTime(now);
      }
      return;
    }

    if (selectedSpirit && selectedSpiritData) {
      const spiritAtPos = spirits.find(
        s => s.position && hexEquals(s.position, coord)
      );

      if (spiritAtPos && spiritAtPos.owner !== selectedSpiritData.owner) {
        if (selectedSkill) {
          const success = useSkill(selectedSpirit, selectedSkill, coord);
          if (success) {
            setLastActionTime(now);
          }
        } else {
          const success = attackSpirit(selectedSpirit, spiritAtPos.id);
          if (success) {
            setLastActionTime(now);
          }
        }
        return;
      }

      if (!spiritAtPos && !selectedSkill) {
        const success = moveSpirit(selectedSpirit, coord);
        if (success) {
          setLastActionTime(now);
        }
        return;
      }

      if (spiritAtPos && spiritAtPos.owner === selectedSpiritData.owner && selectedSkill) {
        const skill = selectedSpiritData.activeSkills.find(s => s.id === selectedSkill);
        if (skill && skill.damage < 0) {
          const success = useSkill(selectedSpirit, selectedSkill, coord);
          if (success) {
            setLastActionTime(now);
          }
        }
      }
    }

    const clickedSpirit = spirits.find(
      s => s.position && hexEquals(s.position, coord)
    );
    if (clickedSpirit && clickedSpirit.owner === 'player') {
      selectSpirit(clickedSpirit.id);
    } else if (!clickedSpirit) {
      selectSpirit(null);
    }
  }, [summonMode, selectedSpirit, selectedSkill, selectedSpiritData, spirits, summonSpirit, attackSpirit, moveSpirit, useSkill, selectSpirit, lastActionTime]);

  const handleCardClick = useCallback((spiritId: string) => {
    if (selectedSpirit === spiritId) {
      selectSpirit(null);
    } else {
      selectSpirit(spiritId);
    }
  }, [selectedSpirit, selectSpirit]);

  const handleSkillClick = useCallback((skillId: string) => {
    if (selectedSkill === skillId) {
      selectSkill(null);
    } else {
      selectSkill(skillId);
    }
  }, [selectedSkill, selectSkill]);

  const handleSummonClick = useCallback((element: ElementType) => {
    if (summonPoints <= 0) return;
    setSummonMode(summonMode === element ? null : element);
    selectSpirit(null);
    selectSkill(null);
  }, [summonMode, summonPoints, selectSpirit, selectSkill]);

  const handleEndTurn = useCallback(() => {
    setSummonMode(null);
    selectSpirit(null);
    selectSkill(null);
    endTurn();
  }, [endTurn, selectSpirit, selectSkill]);

  const elements: ElementType[] = ['fire', 'water', 'wind', 'earth', 'light', 'dark'];
  const weatherInfo = WEATHER_CONFIG[weather];

  return (
    <div className="w-full h-full flex items-center justify-center p-4 gap-4 overflow-hidden">
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-panel p-8 text-center max-w-md"
            >
              <div className="text-4xl mb-4">
                {winner === 'player' ? '🎉' : '💀'}
              </div>
              <h2 className="text-3xl font-bold mb-2">
                {winner === 'player' ? '胜利！' : '失败...'}
              </h2>
              <p className="text-white/70 mb-6">
                {winner === 'player' 
                  ? '恭喜你击败了所有敌人！' 
                  : '你的灵体全部阵亡了...'}
              </p>
              <p className="text-white/60 mb-6">
                共进行了 {currentTurn} 回合
              </p>
              <button
                onClick={initGame}
                className="btn-summon"
              >
                再来一局
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel w-72 h-full flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-bold mb-1">我的灵体</h2>
          <div className="text-xs text-white/60">
            {playerSpirits.length} 个灵体 · 召唤点: {summonPoints}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <div className="flex flex-col gap-3">
            {playerSpirits.length === 0 ? (
              <div className="text-center text-white/50 py-8">
                <div className="text-3xl mb-2">🎮</div>
                <p className="text-sm">还没有灵体</p>
                <p className="text-xs mt-1">点击下方按钮召唤</p>
              </div>
            ) : (
              playerSpirits.map(spirit => (
                <SpiritCard
                  key={spirit.id}
                  spirit={spirit}
                  isSelected={selectedSpirit === spirit.id}
                  onClick={() => handleCardClick(spirit.id)}
                  onSkillClick={handleSkillClick}
                  selectedSkill={selectedSkill}
                />
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-white/60 mb-2">召唤灵体</div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {elements.map(element => (
              <motion.button
                key={element}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSummonClick(element)}
                disabled={summonPoints <= 0}
                className={`
                  h-12 rounded-lg flex flex-col items-center justify-center
                  transition-all duration-200
                  ${summonMode === element ? 'ring-2 ring-white scale-105' : ''}
                  ${summonPoints <= 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{ backgroundColor: ELEMENT_COLORS[element] }}
              >
                <span className="text-lg">{ELEMENT_ICONS[element]}</span>
                <span className="text-[10px] text-white/90">{ELEMENT_NAMES[element]}</span>
              </motion.button>
            ))}
          </div>

          {summonMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-center text-cyan-400 mb-3"
            >
              点击棋盘空格召唤{ELEMENT_NAMES[summonMode]}灵
            </motion.div>
          )}

          <div className="flex gap-2">
            <button
              className="btn-summon flex-1"
              onClick={() => setSummonMode(null)}
              disabled={!summonMode}
            >
              取消召唤
            </button>
            <button
              className="btn-end-turn flex-1"
              onClick={handleEndTurn}
              disabled={currentPlayer !== 'player'}
            >
              结束回合
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
            幻灵棋
          </h1>
          <div className="text-sm text-white/60 mt-1">
            第 {currentTurn} 回合 · {currentPlayer === 'player' ? '你的回合' : '敌方回合'}
          </div>
        </div>

        <HexBoard onHexClick={handleHexClick} />

        <div className="flex gap-4 text-xs">
          {Object.entries(TERRAIN_CONFIG).map(([type, config]) => (
            type !== 'normal' && (
              <div key={type} className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded"
                  style={{
                    background: `radial-gradient(circle, ${config.colors[0]}, ${config.colors[1]})`
                  }}
                />
                <span className="text-white/60">{config.name}</span>
              </div>
            )
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-panel w-72 h-full flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-bold mb-3">对战信息</h2>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-400">
                {playerSpirits.length}
              </div>
              <div className="text-[10px] text-white/60">我方灵体</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">
                {enemySpirits.length}
              </div>
              <div className="text-[10px] text-white/60">敌方灵体</div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/60">当前天气</span>
              <span className="text-xs font-bold" style={{
                color: weatherInfo.modifier > 1 ? '#EF4444' : weatherInfo.modifier < 1 ? '#3B82F6' : '#4ADE80'
              }}>
                {weatherInfo.modifier > 1 ? '×2' : weatherInfo.modifier < 1 ? '×0.5' : '×1'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {weather === 'sunny' ? '☀️' : weather === 'rainy' ? '🌧️' : weather === 'stormy' ? '⛈️' : '🌤️'}
              </span>
              <div>
                <div className="text-sm font-bold">{weatherInfo.name}</div>
                <div className="text-[10px] text-white/50">
                  {weatherInfo.modifier > 1 ? '地形效果增强' : weatherInfo.modifier < 1 ? '地形效果减弱' : '地形效果正常'}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-white/40 mt-2">
              每3回合切换天气
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-white/10">
            <h3 className="text-sm font-bold">行动日志</h3>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
            <div className="flex flex-col gap-2">
              {[...actionLog].reverse().map(log => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 rounded-lg p-2 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/50">回合 {log.turn}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">
                      {log.action}
                    </span>
                  </div>
                  <div className="text-white/80">{log.message}</div>
                </motion.div>
              ))}
              {actionLog.length === 0 && (
                <div className="text-center text-white/40 py-8 text-xs">
                  暂无行动记录
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedSpiritData && (
          <div className="p-4 border-t border-white/10">
            <div className="text-xs text-white/60 mb-2">选中灵体</div>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: ELEMENT_COLORS[selectedSpiritData.element] }}
              >
                {ELEMENT_ICONS[selectedSpiritData.element]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{selectedSpiritData.name}</div>
                <div className="text-[10px] text-white/60">
                  {!selectedSpiritData.hasMoved && '可移动 '}
                  {!selectedSpiritData.hasAttacked && '可攻击'}
                  {selectedSpiritData.hasMoved && selectedSpiritData.hasAttacked && '已行动'}
                </div>
              </div>
            </div>

            {selectedSpiritData.activeSkills.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] text-white/60 mb-1">技能</div>
                <div className="flex flex-wrap gap-1">
                  {selectedSpiritData.activeSkills.map(skill => (
                    <button
                      key={skill.id}
                      onClick={() => handleSkillClick(skill.id)}
                      disabled={skill.currentCooldown > 0 || selectedSpiritData.hasAttacked}
                      className={`
                        text-[10px] px-2 py-1 rounded
                        transition-all duration-200
                        ${selectedSkill === skill.id 
                          ? 'bg-white text-black' 
                          : 'bg-white/10 hover:bg-white/20'
                        }
                        ${(skill.currentCooldown > 0 || selectedSpiritData.hasAttacked) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {skill.name}
                      {skill.currentCooldown > 0 && ` (${skill.currentCooldown})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedSkill && (
              <div className="mt-2 text-[10px] text-cyan-400">
                点击目标使用技能
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default App;
