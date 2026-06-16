import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import {
  CombatEngine,
  CharacterClass,
  Team,
} from '../game/CombatEngine';
import { connectSocket } from '../services/socketService';

const CLASS_CONFIG = [
  {
    cls: CharacterClass.Warrior,
    name: '战士',
    icon: '⚔️',
    color: '#CC4444',
  },
  {
    cls: CharacterClass.Archer,
    name: '弓箭手',
    icon: '🏹',
    color: '#44AA66',
  },
  {
    cls: CharacterClass.Mage,
    name: '法师',
    icon: '🔮',
    color: '#7744CC',
  },
];

const ControlPanel: React.FC = () => {
  const [socketConnected, setSocketConnected] = useState(false);
  const charCounter = useRef({ ally: 0, enemy: 0 });

  const characters = useGameStore(s => s.characters);
  const selectedCharacterId = useGameStore(s => s.selectedCharacterId);
  const isAutoPlaying = useGameStore(s => s.isAutoPlaying);
  const battleReport = useGameStore(s => s.battleReport);
  const battleLogs = useGameStore(s => s.battleLogs);
  const logPanelExpanded = useGameStore(s => s.logPanelExpanded);
  const actionQueue = useGameStore(s => s.actionQueue);
  const currentActionIndex = useGameStore(s => s.currentActionIndex);
  const roundCount = useGameStore(s => s.roundCount);

  const addCharacter = useGameStore(s => s.addCharacter);
  const startAutoPlay = useGameStore(s => s.startAutoPlay);
  const stopAutoPlay = useGameStore(s => s.stopAutoPlay);
  const advanceAutoPlay = useGameStore(s => s.advanceAutoPlay);
  const setBattleReport = useGameStore(s => s.setBattleReport);
  const toggleLogPanel = useGameStore(s => s.toggleLogPanel);
  const resetBattle = useGameStore(s => s.resetBattle);
  const removeCharacter = useGameStore(s => s.removeCharacter);

  useEffect(() => {
    try {
      const socket = connectSocket();
      socket.on('connect', () => setSocketConnected(true));
      socket.on('disconnect', () => setSocketConnected(false));
    } catch {
      console.warn('Socket.IO server not available - running in standalone mode');
    }
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      advanceAutoPlay();
    }, 500);
    return () => clearInterval(timer);
  }, [isAutoPlaying, advanceAutoPlay]);

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);

  const handleCreateCharacter = (cls: CharacterClass, team: Team) => {
    const prefix = team === Team.Ally ? '友' : '敌';
    const idx = ++charCounter.current[team === Team.Ally ? 'ally' : 'enemy'];
    const name = `${prefix}${CLASS_CONFIG.find(c => c.cls === cls)?.name}${idx}`;
    const character = CombatEngine.createCharacter(name, cls, team);

    let placed = false;
    for (let y = 0; y < 8 && !placed; y++) {
      for (let x = 0; x < 12 && !placed; x++) {
        const grid = useGameStore.getState().grid;
        if (grid.getCellState(x, y) === 0) {
          addCharacter(character, x, y);
          placed = true;
        }
      }
    }
  };

  const handleStartAutoPlay = () => {
    const alive = characters.filter(c => c.isAlive);
    const hasAlly = alive.some(c => c.team === Team.Ally);
    const hasEnemy = alive.some(c => c.team === Team.Enemy);
    if (!hasAlly || !hasEnemy) {
      alert('需要至少一名己方和一名敌方角色才能开始推演！');
      return;
    }
    startAutoPlay();
  };

  const logTypeColor = (type: string) => {
    switch (type) {
      case 'attack': return '#4CAF50';
      case 'move': return '#FFEB3B';
      case 'skill': return '#F44336';
      default: return '#B0BEC5';
    }
  };

  const logTypeLabel = (type: string) => {
    switch (type) {
      case 'attack': return '攻';
      case 'move': return '移';
      case 'skill': return '技';
      default: return '?';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#E0E0E0' }}>
      {}
      <div style={{
        padding: '8px 12px',
        background: '#2A2A3E',
        borderBottom: '1px solid #3A3A5E',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
      }}>
        <button
          onClick={isAutoPlaying ? stopAutoPlay : handleStartAutoPlay}
          style={{
            background: isAutoPlaying ? '#E57373' : '#26A69A',
            color: '#FFF',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '12px',
            fontFamily: 'Orbitron, monospace',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.background = isAutoPlaying ? '#EF5350' : '#4DB6AC';
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.background = isAutoPlaying ? '#E57373' : '#26A69A';
          }}
        >
          {isAutoPlaying ? '⏹ 停止推演' : '▶ 自动推演'}
        </button>
        <button
          onClick={resetBattle}
          style={{
            background: '#455A64',
            color: '#FFF',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '11px',
            fontFamily: 'Orbitron, monospace',
            cursor: 'pointer',
          }}
        >
          🔄 重置
        </button>
        {isAutoPlaying && (
          <span style={{ fontSize: '11px', color: '#FFB300' }}>
            回合 {roundCount} | 行动 {currentActionIndex + 1}/{actionQueue.length}
          </span>
        )}
        <span style={{
          marginLeft: 'auto',
          fontSize: '10px',
          color: socketConnected ? '#4CAF50' : '#78909C',
        }}>
          {socketConnected ? '● 已连接' : '○ 离线'}
        </span>
      </div>

      {}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {}
        <div style={{
          padding: '8px',
          borderBottom: '1px solid #3A3A5E',
        }}>
          <div style={{ fontSize: '10px', color: '#00BFA5', marginBottom: '6px', fontFamily: 'Orbitron, monospace' }}>
            己方角色池
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {CLASS_CONFIG.map(cfg => (
              <button
                key={`ally-${cfg.cls}`}
                onClick={() => handleCreateCharacter(cfg.cls, Team.Ally)}
                style={{
                  background: '#1E1E2E',
                  border: '1px solid #3A3A5E',
                  borderRadius: '6px',
                  padding: '6px',
                  cursor: 'grab',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  minWidth: '54px',
                }}
              >
                <span style={{ fontSize: '18px' }}>{cfg.icon}</span>
                <span style={{ fontSize: '8px', color: cfg.color, fontFamily: 'Orbitron, monospace' }}>{cfg.name}</span>
              </button>
            ))}
          </div>

          <div style={{ fontSize: '10px', color: '#FF5252', marginBottom: '6px', marginTop: '8px', fontFamily: 'Orbitron, monospace' }}>
            敌方角色池
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {CLASS_CONFIG.map(cfg => (
              <button
                key={`enemy-${cfg.cls}`}
                onClick={() => handleCreateCharacter(cfg.cls, Team.Enemy)}
                style={{
                  background: '#1E1E2E',
                  border: '1px solid #5A2A2A',
                  borderRadius: '6px',
                  padding: '6px',
                  cursor: 'grab',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  minWidth: '54px',
                }}
              >
                <span style={{ fontSize: '18px' }}>{cfg.icon}</span>
                <span style={{ fontSize: '8px', color: '#FF5252', fontFamily: 'Orbitron, monospace' }}>{cfg.name}</span>
              </button>
            ))}
          </div>
        </div>

        {}
        {isAutoPlaying && actionQueue.length > 0 && (
          <div style={{
            padding: '8px',
            borderBottom: '1px solid #3A3A5E',
            maxHeight: '180px',
            overflowY: 'auto',
          }}>
            <div style={{ fontSize: '10px', color: '#FFB300', marginBottom: '4px', fontFamily: 'Orbitron, monospace' }}>
              行动顺序
            </div>
            {actionQueue.map((id, idx) => {
              const char = characters.find(c => c.id === id);
              if (!char) return null;
              return (
                <div key={id} style={{
                  padding: '3px 6px',
                  fontSize: '10px',
                  fontFamily: 'Orbitron, monospace',
                  background: idx === currentActionIndex ? '#FF9800' : 'transparent',
                  color: idx === currentActionIndex ? '#1E1E2E' : (char.team === Team.Ally ? '#00BFA5' : '#FF5252'),
                  borderRadius: '3px',
                  marginBottom: '2px',
                  transition: 'background 0.2s',
                }}>
                  {idx + 1}. {char.name} (SPD:{char.speed})
                </div>
              );
            })}
          </div>
        )}

        {}
        <div style={{
          padding: '8px',
          borderBottom: '1px solid #3A3A5E',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '10px', color: '#FFB300', marginBottom: '4px', fontFamily: 'Orbitron, monospace' }}>
            角色属性
          </div>
          {selectedCharacter ? (
            <div style={{ fontSize: '9px', lineHeight: '1.8', fontFamily: 'Orbitron, monospace' }}>
              <div style={{ color: selectedCharacter.team === Team.Ally ? '#00BFA5' : '#FF5252', fontWeight: 'bold' }}>
                {selectedCharacter.name}
              </div>
              <div>HP: {selectedCharacter.hp}/{selectedCharacter.maxHp}</div>
              <div>ATK: {selectedCharacter.atk}</div>
              <div>DEF: {selectedCharacter.def}</div>
              <div>SPD: {selectedCharacter.speed}</div>
              <div>移动: {selectedCharacter.moveRange}</div>
              <div>射程: {selectedCharacter.attackRange}</div>
              <div>类型: {selectedCharacter.damageType === 'physical' ? '物理' : '魔法'}</div>
              <div>位置: ({selectedCharacter.x}, {selectedCharacter.y})</div>
              {selectedCharacter.statusEffects.length > 0 && (
                <div style={{ color: '#CE93D8' }}>
                  状态: {selectedCharacter.statusEffects.map(e => e.type).join(', ')}
                </div>
              )}
              {selectedCharacter.team === Team.Ally && (
                <button
                  onClick={() => removeCharacter(selectedCharacter.id)}
                  style={{
                    marginTop: '4px',
                    background: '#C62828',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '9px',
                    cursor: 'pointer',
                    fontFamily: 'Orbitron, monospace',
                  }}
                >
                  移除角色
                </button>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '9px', color: '#78909C', fontFamily: 'Orbitron, monospace' }}>
              点击角色查看属性
            </div>
          )}
        </div>

        {}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div
            onClick={toggleLogPanel}
            style={{
              padding: '6px 8px',
              background: '#263238',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #3A3A5E',
            }}
          >
            <span style={{ fontSize: '10px', color: '#B0BEC5', fontFamily: 'Orbitron, monospace' }}>
              📋 战斗日志
            </span>
            <span style={{ fontSize: '10px', color: '#78909C' }}>
              {logPanelExpanded ? '▼' : '▶'}
            </span>
          </div>
          {logPanelExpanded && (
            <div style={{
              height: '200px',
              overflowY: 'auto',
              background: '#263238',
              padding: '4px',
            }}>
              {battleLogs.length === 0 ? (
                <div style={{ fontSize: '9px', color: '#546E7A', padding: '4px', fontFamily: 'Orbitron, monospace' }}>
                  暂无战斗日志
                </div>
              ) : (
                battleLogs.map(log => (
                  <div key={log.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    padding: '3px 4px',
                    fontSize: '9px',
                    color: '#B0BEC5',
                    fontFamily: 'Orbitron, monospace',
                    borderBottom: '1px solid #37474F',
                  }}>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: logTypeColor(log.type),
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                      color: log.type === 'move' ? '#1E1E2E' : '#FFF',
                      flexShrink: 0,
                    }}>
                      {logTypeLabel(log.type)}
                    </span>
                    <span style={{ flex: 1, wordBreak: 'break-word' }}>{log.message}</span>
                    <span style={{ color: '#546E7A', fontSize: '8px', flexShrink: 0 }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {}
      {battleReport && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)',
            zIndex: 1000,
          }}
          onClick={() => setBattleReport(null)}
        >
          <div
            style={{
              background: '#2A2A3E',
              borderRadius: '12px',
              padding: '24px',
              minWidth: '300px',
              color: '#FFFFFF',
              fontFamily: 'Orbitron, monospace',
              animation: 'scaleIn 0.3s ease-out',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ textAlign: 'center', marginBottom: '16px', fontSize: '16px', color: '#FFB300' }}>
              ⚔️ 战斗报告
            </h2>
            <div style={{ fontSize: '12px', lineHeight: '2' }}>
              <div>总回合数: <span style={{ color: '#00BFA5' }}>{battleReport.totalRounds}</span></div>
              <div>总伤害量: <span style={{ color: '#FF5252' }}>{battleReport.totalDamageDealt}</span></div>
              <div>获胜方: <span style={{ color: battleReport.winner === Team.Ally ? '#00BFA5' : '#FF5252' }}>
                {battleReport.winner === Team.Ally ? '己方' : '敌方'}
              </span></div>
              <div>存活角色: {battleReport.survivors.length}</div>
              {battleReport.survivors.map(c => (
                <div key={c.id} style={{ paddingLeft: '12px', color: c.team === Team.Ally ? '#00BFA5' : '#FF5252', fontSize: '10px' }}>
                  {c.name} (HP: {c.hp}/{c.maxHp})
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                onClick={() => setBattleReport(null)}
                style={{
                  background: '#26A69A',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 24px',
                  fontSize: '12px',
                  fontFamily: 'Orbitron, monospace',
                  cursor: 'pointer',
                }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ControlPanel;
