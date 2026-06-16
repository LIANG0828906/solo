import React from 'react';
import { Dashboard } from './Dashboard';
import { BottomBar } from './BottomBar';
import { Tooltip } from './Tooltip';
import { GameState, BeeType, Flower, Enemy, Position } from '../types';

interface UIPanelProps {
  gameState: GameState;
  selectedBeeType: BeeType | null;
  onSelectBeeType: (type: BeeType | null) => void;
  onUpgradeHive: () => void;
  onStartGame: () => void;
  onResetGame: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  tooltipFlower: Flower | null;
  tooltipEnemy: Enemy | null;
  tooltipPosition: Position;
  tooltipVisible: boolean;
}

export const UIPanel: React.FC<UIPanelProps> = ({
  gameState,
  selectedBeeType,
  onSelectBeeType,
  onUpgradeHive,
  onStartGame,
  onResetGame,
  onPauseGame,
  onResumeGame,
  tooltipFlower,
  tooltipEnemy,
  tooltipPosition,
  tooltipVisible,
}) => {
  const { phase, hive } = gameState;

  const canUpgrade = hive.level < hive.maxLevel && hive.honey >= hive.upgradeCosts[hive.level - 1];
  const upgradeCost = hive.level < hive.maxLevel ? hive.upgradeCosts[hive.level - 1] : 0;

  return (
    <div className="ui-panel">
      {phase === 'menu' && (
        <div className="menu-overlay">
          <div className="menu-container">
            <h1 className="game-title">🐝 BeeHiveSim</h1>
            <p className="game-subtitle">蜂巢管理模拟器</p>
            <p className="game-desc">
              派遣蜜蜂采集蜂蜜，建造升级蜂巢，抵御入侵者！
            </p>
            <button className="start-btn" onClick={onStartGame}>
              开始游戏
            </button>
            <div className="game-tips">
              <h3>游戏说明</h3>
              <ul>
                <li>🐝 <strong>采集蜂</strong> - 前往花朵采集蜂蜜</li>
                <li>🔍 <strong>侦察蜂</strong> - 探索未知区域，发现新花朵</li>
                <li>⚔️ <strong>护卫蜂</strong> - 巡逻并攻击入侵的敌人</li>
                <li>⬆️ <strong>升级蜂巢</strong> - 增加蜜蜂槽位和护盾</li>
              </ul>
              <p className="tip-text">
                快捷键: Q采集蜂 | W侦察蜂 | E护卫蜂 | 空格暂停
              </p>
            </div>
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <>
          <Dashboard gameState={gameState} />
          
          <div className="top-controls">
            <button className="pause-btn" onClick={onPauseGame}>
              ⏸ 暂停
            </button>
          </div>

          <BottomBar
            selectedBeeType={selectedBeeType}
            onSelectBeeType={onSelectBeeType}
            onUpgradeHive={onUpgradeHive}
            hiveLevel={hive.level}
            maxHiveLevel={hive.maxLevel}
            upgradeCost={upgradeCost}
            canUpgrade={canUpgrade}
            honey={hive.honey}
          />

          <Tooltip
            flower={tooltipFlower}
            enemy={tooltipEnemy}
            position={tooltipPosition}
            visible={tooltipVisible}
          />
        </>
      )}

      {phase === 'paused' && (
        <div className="pause-overlay">
          <div className="pause-container">
            <h2>游戏暂停</h2>
            <button className="resume-btn" onClick={onResumeGame}>
              ▶ 继续游戏
            </button>
            <button className="restart-btn" onClick={onResetGame}>
              🔄 重新开始
            </button>
          </div>
        </div>
      )}

      {phase === 'gameover' && (
        <div className="gameover-overlay">
          <div className="gameover-container">
            <h2>💔 游戏结束</h2>
            <p className="gameover-text">蜂巢已被摧毁...</p>
            <div className="gameover-stats">
              <div>存活波数: <strong>{gameState.wave}</strong></div>
              <div>收集蜂蜜: <strong>{Math.floor(hive.maxHoney)}</strong></div>
            </div>
            <button className="restart-btn" onClick={onResetGame}>
              🔄 再来一局
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
