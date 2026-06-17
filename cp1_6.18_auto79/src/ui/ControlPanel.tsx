import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { startBattle, playerEndTurn, getUnitName } from '../engine/battle';
import type { UnitType, UnitStats } from '../types';

const UNIT_COLORS: Record<string, string> = {
  warrior: '#E74C3C',
  archer: '#3498DB',
  cavalry: '#F1C40F',
};

const UNIT_ICONS: Record<string, string> = {
  warrior: '⚔️',
  archer: '🏹',
  cavalry: '🐴',
};

interface UnitCardProps {
  type: UnitType;
  count: number;
  isSelected: boolean;
  stats: UnitStats;
  onClick: () => void;
}

function UnitCard({ type, count, isSelected, stats, onClick }: UnitCardProps) {
  return (
    <button
      className={`unit-card ${isSelected ? 'selected' : ''} ${count <= 0 ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={count <= 0}
    >
      <div className="unit-icon" style={{ backgroundColor: UNIT_COLORS[type] }}>
        <span>{UNIT_ICONS[type]}</span>
      </div>
      <div className="unit-info">
        <div className="unit-name">{getUnitName(type)}</div>
        <div className="unit-stats">
          <span>❤️{stats.hp}</span>
          <span>⚔️{stats.attack}</span>
          <span>👟{stats.move}</span>
          <span>🎯{stats.range}</span>
        </div>
      </div>
      <div className="unit-count">x{count}</div>
      <style>{`
        .unit-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: #21262D;
          border: 2px solid #30363D;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          color: #fff;
        }
        .unit-card:hover:not(.disabled) {
          background: #30363D;
          border-color: #58A6FF;
        }
        .unit-card.selected {
          border-color: #58A6FF;
          box-shadow: 0 0 10px rgba(88, 166, 255, 0.3);
        }
        .unit-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .unit-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .unit-info {
          flex: 1;
          text-align: left;
        }
        .unit-name {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .unit-stats {
          display: flex;
          gap: 8px;
          font-size: 11px;
          color: #8B949E;
        }
        .unit-count {
          font-size: 16px;
          font-weight: bold;
          color: #58A6FF;
        }
      `}</style>
    </button>
  );
}

function NumberInput({
  value,
  onChange,
  min = 1,
  max = 20,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const handleDecrease = () => {
    if (value > min) onChange(value - 1);
  };
  const handleIncrease = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className="number-input">
      <button onClick={handleDecrease} disabled={value <= min}>−</button>
      <input type="number" value={value} readOnly />
      <button onClick={handleIncrease} disabled={value >= max}>+</button>
      <style>{`
        .number-input {
          display: flex;
          align-items: center;
          background: #2D2D44;
          border-radius: 6px;
          overflow: hidden;
        }
        .number-input button {
          width: 28px;
          height: 28px;
          background: #21262D;
          border: none;
          color: #fff;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .number-input button:hover:not(:disabled) {
          background: #30363D;
        }
        .number-input button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .number-input input {
          width: 40px;
          height: 28px;
          background: #2D2D44;
          border: none;
          color: #fff;
          text-align: center;
          font-size: 13px;
          -moz-appearance: textfield;
        }
        .number-input input::-webkit-outer-spin-button,
        .number-input input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="slider-container">
      <div className="slider-label">
        <span>{label}</span>
        <span className="slider-value">{value}</span>
      </div>
      <div className="slider-track">
        <div className="slider-fill" style={{ width: `${percentage}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-input"
        />
      </div>
      <div className="slider-ticks">
        {[0, 25, 50, 75, 100].map(tick => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
      <style>{`
        .slider-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .slider-label {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #C9D1D9;
        }
        .slider-value {
          color: #58A6FF;
          font-weight: bold;
        }
        .slider-track {
          position: relative;
          height: 6px;
          background: #21262D;
          border-radius: 3px;
        }
        .slider-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: #58A6FF;
          border-radius: 3px;
        }
        .slider-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
        .slider-ticks {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #6E7681;
        }
      `}</style>
    </div>
  );
}

export default function ControlPanel() {
  const {
    phase,
    currentTurn,
    turnNumber,
    deployableUnits,
    deployingUnitType,
    setDeployingUnitType,
    logs,
    settings,
    updateSettings,
    winner,
    resetGame,
    isReplaying,
    replaySteps,
    replayIndex,
    startReplay,
    stopReplay,
    setReplayIndex,
    units,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'deploy' | 'settings'>('deploy');
  const logRef = useRef<HTMLDivElement>(null);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const replayIntervalRef = useRef<number | null>(null);

  const playerUnits = units.filter(u => u.team === 'player' && u.hp > 0);
  const aiUnits = units.filter(u => u.team === 'ai' && u.hp > 0);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    return () => {
      if (replayIntervalRef.current) {
        clearInterval(replayIntervalRef.current);
      }
    };
  }, []);

  const handleStartBattle = () => {
    if (playerUnits.length === 0) return;
    startBattle();
  };

  const handleEndTurn = () => {
    if (currentTurn !== 'player' || phase !== 'battle' || isReplaying) return;
    playerEndTurn();
  };

  const handleUpdateWarriorStat = (key: keyof UnitStats, value: number) => {
    updateSettings({
      warriorStats: { ...settings.warriorStats, [key]: value },
    });
  };

  const handleUpdateArcherStat = (key: keyof UnitStats, value: number) => {
    updateSettings({
      archerStats: { ...settings.archerStats, [key]: value },
    });
  };

  const handleUpdateCavalryStat = (key: keyof UnitStats, value: number) => {
    updateSettings({
      cavalryStats: { ...settings.cavalryStats, [key]: value },
    });
  };

  const handlePlayReplay = () => {
    if (replaySteps.length === 0) return;

    if (replayPlaying) {
      if (replayIntervalRef.current) {
        clearInterval(replayIntervalRef.current);
        replayIntervalRef.current = null;
      }
      setReplayPlaying(false);
      return;
    }

    if (replayIndex === -1 || replayIndex >= replaySteps.length - 1) {
      startReplay();
    }

    setReplayPlaying(true);
    replayIntervalRef.current = window.setInterval(() => {
      const state = useGameStore.getState();
      if (state.replayIndex >= state.replaySteps.length - 1) {
        if (replayIntervalRef.current) {
          clearInterval(replayIntervalRef.current);
          replayIntervalRef.current = null;
        }
        setReplayPlaying(false);
        return;
      }
      useGameStore.getState().setReplayIndex(state.replayIndex + 1);
    }, 800);
  };

  const handleStopReplay = () => {
    if (replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
      replayIntervalRef.current = null;
    }
    setReplayPlaying(false);
    stopReplay();
  };

  return (
    <div className="control-panel">
      <div className="status-bar">
        <div className="turn-info">
          <span className="turn-label">回合 {turnNumber}</span>
          <span className={`turn-team ${currentTurn}`}>
            {currentTurn === 'player' ? '玩家回合' : 'AI回合'}
          </span>
        </div>
        <div className="units-count">
          <span className="player-count">我方: {playerUnits.length}</span>
          <span className="ai-count">敌方: {aiUnits.length}</span>
        </div>
      </div>

      <div className="action-bar">
        {phase === 'deploy' && (
          <button
            className="action-btn primary"
            onClick={handleStartBattle}
            disabled={playerUnits.length === 0}
          >
            开始战斗
          </button>
        )}
        {phase === 'battle' && currentTurn === 'player' && !isReplaying && (
          <button className="action-btn primary" onClick={handleEndTurn}>
            结束回合
          </button>
        )}
        {phase === 'ended' && (
          <div className="game-over">
            <div className={`winner-text ${winner}`}>
              {winner === 'player' ? '🎉 胜利！' : '💀 失败...'}
            </div>
            <button className="action-btn primary" onClick={resetGame}>
              重新开始
            </button>
            {replaySteps.length > 0 && (
              <button className="action-btn secondary" onClick={handlePlayReplay}>
                {replayPlaying ? '暂停回放' : '观看回放'}
              </button>
            )}
          </div>
        )}
        {isReplaying && (
          <div className="replay-controls">
            <button className="action-btn secondary" onClick={handlePlayReplay}>
              {replayPlaying ? '暂停' : '播放'}
            </button>
            <button className="action-btn secondary" onClick={handleStopReplay}>
              退出回放
            </button>
            <span className="replay-progress">
              {replayIndex + 1} / {replaySteps.length}
            </span>
          </div>
        )}
      </div>

      {phase === 'deploy' && (
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'deploy' ? 'active' : ''}`}
            onClick={() => setActiveTab('deploy')}
          >
            部署单位
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            游戏设置
          </button>
        </div>
      )}

      {phase === 'deploy' && activeTab === 'deploy' && (
        <div className="deploy-section">
          <p className="section-hint">选择单位后点击左侧蓝色区域部署（最多4个）</p>
          <div className="unit-list">
            {deployableUnits.map(du => (
              <UnitCard
                key={du.type}
                type={du.type}
                count={du.count}
                isSelected={deployingUnitType === du.type}
                stats={
                  du.type === 'warrior' ? settings.warriorStats :
                  du.type === 'archer' ? settings.archerStats :
                  settings.cavalryStats
                }
                onClick={() => setDeployingUnitType(deployingUnitType === du.type ? null : du.type)}
              />
            ))}
          </div>
          <p className="section-hint small">右键点击已部署单位可移除</p>
        </div>
      )}

      {(phase === 'deploy' && activeTab === 'settings') && (
        <div className="settings-section">
          <h4>AI设置</h4>
          <Slider
            label="AI随机因子"
            value={settings.aiRandomFactor}
            onChange={(v) => updateSettings({ aiRandomFactor: v })}
          />

          <h4>单位属性 - 战士</h4>
          <div className="stat-row">
            <span>生命值</span>
            <NumberInput
              value={settings.warriorStats.hp}
              onChange={(v) => handleUpdateWarriorStat('hp', v)}
            />
          </div>
          <div className="stat-row">
            <span>攻击力</span>
            <NumberInput
              value={settings.warriorStats.attack}
              onChange={(v) => handleUpdateWarriorStat('attack', v)}
            />
          </div>
          <div className="stat-row">
            <span>移动力</span>
            <NumberInput
              value={settings.warriorStats.move}
              onChange={(v) => handleUpdateWarriorStat('move', v)}
              min={1}
              max={10}
            />
          </div>

          <h4>单位属性 - 弓箭手</h4>
          <div className="stat-row">
            <span>生命值</span>
            <NumberInput
              value={settings.archerStats.hp}
              onChange={(v) => handleUpdateArcherStat('hp', v)}
            />
          </div>
          <div className="stat-row">
            <span>攻击力</span>
            <NumberInput
              value={settings.archerStats.attack}
              onChange={(v) => handleUpdateArcherStat('attack', v)}
            />
          </div>
          <div className="stat-row">
            <span>移动力</span>
            <NumberInput
              value={settings.archerStats.move}
              onChange={(v) => handleUpdateArcherStat('move', v)}
              min={1}
              max={10}
            />
          </div>
          <div className="stat-row">
            <span>攻击距离</span>
            <NumberInput
              value={settings.archerStats.range}
              onChange={(v) => handleUpdateArcherStat('range', v)}
              min={1}
              max={8}
            />
          </div>

          <h4>单位属性 - 骑兵</h4>
          <div className="stat-row">
            <span>生命值</span>
            <NumberInput
              value={settings.cavalryStats.hp}
              onChange={(v) => handleUpdateCavalryStat('hp', v)}
            />
          </div>
          <div className="stat-row">
            <span>攻击力</span>
            <NumberInput
              value={settings.cavalryStats.attack}
              onChange={(v) => handleUpdateCavalryStat('attack', v)}
            />
          </div>
          <div className="stat-row">
            <span>移动力</span>
            <NumberInput
              value={settings.cavalryStats.move}
              onChange={(v) => handleUpdateCavalryStat('move', v)}
              min={1}
              max={10}
            />
          </div>
        </div>
      )}

      <div className="log-section">
        <h4>战斗日志</h4>
        <div className="log-list" ref={logRef}>
          {logs.length === 0 ? (
            <p className="log-empty">暂无记录</p>
          ) : (
            logs.map((log, index) => (
              <div
                key={log.id}
                className={`log-entry ${log.team} ${index === logs.length - 1 ? 'latest' : ''}`}
              >
                <span className="log-turn">[回合{log.turn}]</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .control-panel {
          width: 280px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #161B22;
          border: 1px solid #30363D;
          border-radius: 8px;
        }
        .turn-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .turn-label {
          font-size: 12px;
          color: #8B949E;
        }
        .turn-team {
          font-size: 16px;
          font-weight: bold;
        }
        .turn-team.player {
          color: #79C0FF;
        }
        .turn-team.ai {
          color: #FFA657;
        }
        .units-count {
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: right;
          font-size: 12px;
        }
        .player-count {
          color: #79C0FF;
        }
        .ai-count {
          color: #FFA657;
        }
        .action-bar {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .action-btn {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .action-btn.primary {
          background: #238636;
          color: white;
        }
        .action-btn.primary:hover:not(:disabled) {
          background: #2ea043;
        }
        .action-btn.secondary {
          background: #21262D;
          color: #C9D1D9;
          border: 1px solid #30363D;
        }
        .action-btn.secondary:hover {
          background: #30363D;
        }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .game-over {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .winner-text {
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          padding: 12px;
          border-radius: 8px;
        }
        .winner-text.player {
          color: #3FB950;
          background: rgba(63, 185, 80, 0.1);
        }
        .winner-text.ai {
          color: #F85149;
          background: rgba(248, 81, 73, 0.1);
        }
        .replay-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .replay-progress {
          font-size: 12px;
          color: #8B949E;
        }
        .tabs {
          display: flex;
          gap: 4px;
          background: #161B22;
          border-radius: 8px;
          padding: 4px;
        }
        .tab-btn {
          flex: 1;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: #8B949E;
          font-size: 13px;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .tab-btn.active {
          background: #21262D;
          color: #58A6FF;
          font-weight: 600;
        }
        .tab-btn:hover {
          color: #C9D1D9;
        }
        .deploy-section, .settings-section {
          background: #161B22;
          border: 1px solid #30363D;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .section-hint {
          font-size: 12px;
          color: #8B949E;
          margin: 0;
        }
        .section-hint.small {
          font-size: 11px;
          color: #6E7681;
        }
        .unit-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .settings-section h4 {
          margin: 8px 0 4px 0;
          color: #C9D1D9;
          font-size: 13px;
        }
        .settings-section h4:first-child {
          margin-top: 0;
        }
        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #8B949E;
        }
        .log-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 200px;
          background: #1E1E2E;
          border: 1px solid #3A3A5C;
          border-radius: 8px;
          overflow: hidden;
        }
        .log-section h4 {
          margin: 0;
          padding: 10px 12px;
          color: #C9D1D9;
          font-size: 13px;
          border-bottom: 1px solid #3A3A5C;
          background: #161B22;
        }
        .log-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 300px;
        }
        .log-empty {
          color: #6E7681;
          font-size: 12px;
          text-align: center;
          padding: 20px 0;
          margin: 0;
        }
        .log-entry {
          font-size: 11px;
          line-height: 1.4;
          padding: 6px 8px;
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        .log-entry.player .log-turn {
          color: #79C0FF;
        }
        .log-entry.player .log-message {
          color: #C9D1D9;
        }
        .log-entry.ai .log-turn {
          color: #FFA657;
        }
        .log-entry.ai .log-message {
          color: #C9D1D9;
        }
        .log-entry.latest {
          background: rgba(88, 166, 255, 0.1);
        }
        .log-turn {
          font-weight: bold;
          margin-right: 4px;
        }
        .log-list::-webkit-scrollbar {
          width: 6px;
        }
        .log-list::-webkit-scrollbar-track {
          background: #161B22;
        }
        .log-list::-webkit-scrollbar-thumb {
          background: #30363D;
          border-radius: 3px;
        }
        .log-list::-webkit-scrollbar-thumb:hover {
          background: #484f58;
        }
      `}</style>
    </div>
  );
}
